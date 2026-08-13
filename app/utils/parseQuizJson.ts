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
//
// Two-pass strategy: pass 1 applies only harmless normalization (BOM, nbsp
// entities, Unicode whitespace, fences) and tries to parse. Valid JSON with
// `<`/`>` inside string values (legal, unescaped JSON) therefore survives
// untouched. Only if pass 1 fails does pass 2 strip HTML tags/comments and
// retry, recovering Gemini-style rich-text clipboard output.

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

/**
 * Pass 1 — harmless normalization. Never deletes text, only converts
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
 * Pass 2 — aggressive rich-text cleanup. Only run when pass 1 failed to
 * parse (i.e. the input is not valid JSON as-is). Block tags become line
 * breaks; remaining tags and comments are removed.
 */
const stripHtml = (text: string): string =>
  text.replace(HTML_BREAK_TAGS, '\n').replace(HTML_STRIP, '').trim();

const isQuizObject = (value: any): boolean =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

export const parseQuizJson = (raw: string): JsonParseResult => {
  const safe = normalizeSafe(raw);

  if (!safe) {
    return { ok: false, error: 'Empty input — paste or drop a quiz JSON file first.' };
  }

  // Pass 1: strict JSON after harmless normalization only.
  let data: any;
  try {
    data = JSON.parse(safe);
  } catch (err) {
    // Pass 2: rich-text clipboard output — strip HTML and try again.
    try {
      data = JSON.parse(stripHtml(safe));
    } catch (err2) {
      const message = err2 instanceof Error ? err2.message : 'Invalid JSON.';
      return { ok: false, error: `Invalid JSON: ${message}` };
    }
  }

  if (!isQuizObject(data)) {
    return { ok: false, error: 'JSON must be a single quiz object, not an array or primitive value.' };
  }

  return { ok: true, data };
};

// Backwards-compatible convenience: returns the parsed object, or null on failure.
export const tryParseQuizJson = (raw: string): any => {
  const result = parseQuizJson(raw);
  return result.ok ? result.data : null;
};