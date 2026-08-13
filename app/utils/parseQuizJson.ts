// app/utils/parseQuizJson.ts
//
// Tolerant JSON text parser for quiz imports.
// Handles common copy/paste problems:
//   - Markdown code fences (```json ... ```) around the JSON
//   - A leading BOM character (\uFEFF)
//   - HTML/rich-text clipboard pollution (e.g. pasting from an AI chat):
//       * `<p>` / `<br>` / fragment comment tags
//       * `&nbsp;` entities and raw non-breaking space characters (U+00A0)
//   - Surrounding whitespace / stray blank lines
//   - Quote-wrapped / stringified JSON (e.g. "{\"title\":...}") — a common
//     ChatGPT-on-phone mistake that produces Safari's
//     "JSON Parse error: Unrecognized token '"'""
//   - Prose around the JSON ("Here is your quiz: {...} Hope that helps!")
//   - Smart/curly quotes (" " ' ') introduced by iOS/Mac autocorrect
//   - JS-object-literal output from AIs ({ title: 'x', } instead of strict JSON)
//
// Recovery strategy: an ordered pipeline of progressively more aggressive
// transformations, each run through JSON.parse. The first attempt that
// yields a quiz object wins — valid JSON parses on attempt 1 and is never
// touched by the aggressive passes, so unescaped `<`/`>` inside string
// values survive untouched.

export type JsonParseResult =
  | { ok: true; data: any }
  | { ok: false; error: string };

const CODE_FENCE_LINE = /^\s*```[a-zA-Z0-9_-]*\s*$/;

/** All Unicode whitespace that is invisible but NOT valid JSON whitespace. */
const UNICODE_WHITESPACE = /[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g;

/** HTML block/line tags that cause line breaks when copied in rich text. */
const HTML_BREAK_TAGS = /<\s*\/*(?:p|div|br|pre|blockquote|li|ul|ol|h[1-6]|tr|table|section|article)\s*>/gi;

/** Any remaining HTML tags (inline or unknown), plus HTML/XML comments. */
const HTML_STRIP = /<!--[\s\S]*?-->|<[^>]+>/g;

/** Smart/curly double quotes introduced by iOS/Mac autocorrect. */
const SMART_DOUBLE_QUOTES = /[\u201C\u201D]/g;

/** Smart/curly single quotes introduced by iOS/Mac autocorrect. */
const SMART_SINGLE_QUOTES = /[\u2018\u2019]/g;

/**
 * Step 0 — harmless normalization. Never deletes text, only converts
 * invisible whitespace and strips BOM/fences, so valid JSON strings with
 * `<`/`>` (legal, unescaped JSON) survive untouched.
 */
const normalizeSafe = (raw: string): string => {
  let text = raw.replace(/^\uFEFF/, ''); // strip BOM

  // Decode `&nbsp;` entities (also `&nbsp` without ;) — Gemini's rich-text
  // clipboard uses these for indentation. Inside a string value this is
  // harmless whitespace normalization.
  text = text.replace(/&nbsp;/gi, ' ');

  // Convert every Unicode non-breaking/space-like whitespace char into a
  // plain space (U+0020), which IS valid JSON whitespace.
  text = text.replace(UNICODE_WHITESPACE, ' ');

  const lines = text.split(/\r?\n/);

  // Remove leading/trailing markdown code fences. A stray fence in the
  // middle is left alone so error line numbers stay accurate.
  while (lines.length > 0) {
    const first = lines[0];
    if (first === undefined || !CODE_FENCE_LINE.test(first)) break;
    lines.shift();
  }
  while (lines.length > 0) {
    const last = lines[lines.length - 1];
    if (last === undefined || !CODE_FENCE_LINE.test(last)) break;
    lines.pop();
  }

  return lines.join('\n').trim();
};

/**
 * Aggressive rich-text cleanup: block tags become line breaks; remaining
 * tags and comments are removed.
 */
const stripHtml = (text: string): string =>
  text.replace(HTML_BREAK_TAGS, '\n').replace(HTML_STRIP, '').trim();

/** Replace iOS/Mac autocorrect curly quotes with straight ASCII quotes. */
const replaceSmartQuotes = (text: string): string =>
  text.replace(SMART_DOUBLE_QUOTES, '"').replace(SMART_SINGLE_QUOTES, "'");

/**
 * Extract the outermost `{ ... }` region of the text, dropping any prose
 * that an AI wrote before/after the JSON object. Refuses to extract when
 * the content is a top-level array (`[ ... ]`) — a quiz must be a single
 * object, so an array must be rejected rather than having its inner object
 * silently rescued.
 */
const extractJsonObject = (text: string): string | null => {
  const trimmed = text.trimStart();
  if (trimmed[0] === '[') return null;
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) return null;
  return text.slice(firstBrace, lastBrace + 1);
};

interface ParseAttemptResult {
  ok: boolean;
  data?: any;
  error?: unknown;
}

/**
 * Strict JSON.parse, then recursively unwraps stringified JSON — i.e.
 * `"{\"title\":...}"` (the whole object wrapped in a JSON string, a common
 * ChatGPT-on-phone output) parses twice so the inner object comes out.
 */
const parseWithUnwrap = (text: string): ParseAttemptResult => {
  try {
    let data: unknown = JSON.parse(text);
    for (let depth = 0; depth < 3 && typeof data === 'string'; depth++) {
      try {
        data = JSON.parse(data);
      } catch {
        break;
      }
    }
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: err };
  }
};

type StringState = 'none' | 'double' | 'single';

/**
 * Last-resort best-effort repair of AI JS-object-literal output into strict
 * JSON: single-quoted strings, unquoted keys, trailing commas, and `//` /
 * block comments. Uses a char-by-char state machine so the *inside* of
 * string values (e.g. URLs like http://, or an apostrophe like "It's") is
 * never touched. Refuses to repair content that is a top-level array.
 */
const repairJsObject = (text: string): string | null => {
  const trimmed = text.trimStart();
  if (trimmed[0] === '[') return null;
  if (!text.includes('{')) return null;

  // Drop prose around the object if present.
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    text = text.slice(firstBrace, lastBrace + 1);
  }

  let out = '';
  let pendingComma = false;
  let inString: StringState = 'none';
  const n = text.length;
  let i = 0;

  const flushComma = (): void => {
    if (pendingComma) {
      out += ',';
      pendingComma = false;
    }
  };

  while (i < n) {
    const ch = text[i]!;

    // Inside a double-quoted string: copy verbatim, honoring escapes.
    if (inString === 'double') {
      out += ch;
      i++;
      if (ch === '\\' && i < n) {
        out += text[i]!;
        i++;
      } else if (ch === '"') {
        inString = 'none';
      }
      continue;
    }

    // Inside a single-quoted string: convert to double-quoted, handle \' escapes.
    if (inString === 'single') {
      if (ch === '\\') {
        const next = text[i + 1];
        if (next === "'") {
          out += '\\"';
          i += 2;
          continue;
        }
        out += ch;
        i++;
        if (i < n) {
          out += text[i]!;
          i++;
        }
        continue;
      }
      if (ch === "'") {
        out += '"';
        i++;
        inString = 'none';
        continue;
      }
      out += ch;
      i++;
      continue;
    }

    // Outside strings: opening quotes.
    if (ch === '"') {
      flushComma();
      out += '"';
      i++;
      inString = 'double';
      continue;
    }
    if (ch === "'") {
      flushComma();
      out += '"';
      i++;
      inString = 'single';
      continue;
    }

    // `//` line comment outside a string: skip to end of line.
    if (ch === '/' && text[i + 1] === '/') {
      while (i < n && text[i] !== '\n') i++;
      continue;
    }

    // `/* ... */` block comment outside a string.
    if (ch === '/' && text[i + 1] === '*') {
      const end = text.indexOf('*/', i + 2);
      i = end === -1 ? n : end + 2;
      continue;
    }

    // Trailing-comma handling: hold commas until we know what follows.
    if (ch === ',') {
      pendingComma = true;
      i++;
      continue;
    }

    // Closing brace/bracket with a pending trailing comma: drop the comma.
    if ((ch === '}' || ch === ']') && pendingComma) {
      pendingComma = false;
      out += ch;
      i++;
      continue;
    }

    // Whitespace outside strings is emitted as-is; a pending comma is kept
    // pending so `value , }` is still recognized as a trailing comma.
    if (/\s/.test(ch)) {
      out += ch;
      i++;
      continue;
    }

    // Unquoted identifier: could be an unquoted key (`title: "x"`) or a
    // JS literal value (`undefined`, `NaN`, `Infinity`).
    if (/[A-Za-z_$]/.test(ch)) {
      let j = i;
      while (j < n && /[A-Za-z0-9_$\-]/.test(text[j]!)) j++;
      let k = j;
      while (k < n && /\s/.test(text[k]!)) k++;
      const word = text.slice(i, j);
      if (text[k] === ':') {
        flushComma();
        out += '"' + word + '"';
        i = j;
        continue;
      }
      if (word === 'undefined' || word === 'NaN' || word === 'Infinity') {
        flushComma();
        out += 'null';
        i = j;
        continue;
      }
    }

    // Everything else (punctuation, numbers, operators): flush any pending
    // comma, then emit.
    flushComma();
    out += ch;
    i++;
  }

  return out;
};

const isQuizObject = (value: any): boolean =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

/**
 * Build a human-readable error that tells the user exactly what went wrong,
 * instead of dumping Safari's cryptic engine message.
 */
const buildFriendlyError = (text: string, lastError: unknown): string => {
  const trimmed = text.trim();
  const firstChar = trimmed[0] ?? '';
  const msg = lastError instanceof Error ? lastError.message : 'JSON parse failed.';
  const posMatch = msg.match(/position (\d+)/);
  const pos = posMatch ? ` at position ${posMatch[1]}` : '';
  const snippet = trimmed.slice(0, 60);

  let hint: string;
  switch (firstChar) {
    case '"':
      hint = 'It starts with a double quote, so the JSON got wrapped in quotation marks. In ChatGPT, tap "Copy code" on the JSON block instead of copying the whole message.';
      break;
    case '{':
      hint = 'It starts with "{" but something inside is invalid — likely a stray or unescaped quote inside a string value. Try regenerating the quiz.';
      break;
    case '[':
      hint = 'It starts with "[", but a quiz must be a single JSON object { ... }, not an array.';
      break;
    case '':
      hint = 'The text is empty.';
      break;
    default:
      hint = `It starts with "${firstChar}" — expected "{". In ChatGPT, use "Copy code" on the JSON block, not "Copy message".`;
  }

  return `Invalid JSON${pos}: ${msg}. ${hint} Preview: "${snippet}${trimmed.length > 60 ? '…' : ''}"`;
};

export const parseQuizJson = (raw: string): JsonParseResult => {
  const text = normalizeSafe(raw);

  if (!text) {
    return { ok: false, error: 'Empty input — paste or drop a quiz JSON file first.' };
  }

  // Ordered recovery pipeline. Attempts run from least to most aggressive;
  // the first that yields a quiz object wins. Valid JSON parses on attempt 1
  // and is therefore never touched by the aggressive passes.
  const attempts: Array<(t: string) => string | null> = [
    (t) => t,
    (t) => stripHtml(t),
    (t) => extractJsonObject(stripHtml(t)),
    (t) => replaceSmartQuotes(stripHtml(t)),
    (t) => {
      const block = extractJsonObject(stripHtml(t));
      return block === null ? null : replaceSmartQuotes(block);
    },
    (t) => repairJsObject(replaceSmartQuotes(stripHtml(t))),
  ];

  let lastError: unknown = null;
  let lastParsedNonObject: any = null;

  for (const transform of attempts) {
    const candidate = transform(text);
    if (candidate === null || candidate.trim() === '') continue;

    const result = parseWithUnwrap(candidate);
    if (!result.ok) {
      if (lastError === null) lastError = result.error ?? null;
      continue;
    }

    if (isQuizObject(result.data)) {
      return { ok: true, data: result.data };
    }

    lastParsedNonObject = result.data;
  }

  if (lastParsedNonObject !== null) {
    const what = Array.isArray(lastParsedNonObject)
      ? 'an array'
      : typeof lastParsedNonObject === 'string'
        ? 'a string'
        : `a ${typeof lastParsedNonObject}`;
    const copyHint =
      ' In ChatGPT, use "Copy code" on the JSON block, not "Copy message", so no extra text or quote marks are included.';
    return {
      ok: false,
      error:
        `The text parsed as ${what}, but a quiz must be a single JSON object ` +
        `{ ... } with "title" and "questions".${copyHint}`,
    };
  }

  return { ok: false, error: buildFriendlyError(text, lastError) };
};

// Backwards-compatible convenience: returns the parsed object, or null on failure.
export const tryParseQuizJson = (raw: string): any => {
  const result = parseQuizJson(raw);
  return result.ok ? result.data : null;
};