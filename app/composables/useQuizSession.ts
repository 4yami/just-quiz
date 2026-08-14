// app/composables/useQuizSession.ts
/**
 * In-progress quiz session tracking.
 *
 * State is held at module scope (survives component unmounts, i.e. navigation)
 * and mirrored to sessionStorage (survives page refreshes within the tab).
 * Sessions are cleared automatically when the tab closes, since sessionStorage
 * is per-tab and does not persist across browser restarts.
 */

export interface QuizSession {
  quizId: string;
  quizUrl: string;
  quizTitle: string;
  currentIndex: number;
  totalQuestions: number;
  // single/true_false: number (choice index)
  // multiple: number[] (array of choice indices)
  // short_answer: string
  userAnswers: Record<number, any>;
  isChecked: boolean;
  isFinished: boolean;
  updatedAt: number;
}

const STORAGE_PREFIX = 'justquiz:session:';

// Module-scoped reactive state — survives navigation between pages.
const sessions = shallowRef<Record<string, QuizSession>>({});

const readAllFromStorage = (): Record<string, QuizSession> => {
  if (!import.meta.client) return {};
  try {
    const result: Record<string, QuizSession> = {};
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key?.startsWith(STORAGE_PREFIX)) {
        const raw = sessionStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw) as QuizSession;
          if (parsed && parsed.quizId) result[parsed.quizId] = parsed;
        }
      }
    }
    return result;
  } catch {
    // Storage unavailable (private mode, etc.) — sessions survive navigation only.
    return {};
  }
};

// Initial hydration from sessionStorage (client-side only).
if (import.meta.client) {
  sessions.value = readAllFromStorage();
}

const persist = (session: QuizSession) => {
  if (!import.meta.client) return;
  try {
    sessionStorage.setItem(`${STORAGE_PREFIX}${session.quizId}`, JSON.stringify(session));
  } catch {
    // Ignore — module state still keeps the session alive across navigation.
  }
};

export const useQuizSession = () => {
  const getSession = (quizId: string): QuizSession | null =>
    sessions.value[quizId] ?? null;

  const saveSession = (session: QuizSession) => {
    sessions.value = { ...sessions.value, [session.quizId]: session };
    persist(session);
  };

  const clearSession = (quizId: string) => {
    if (!sessions.value[quizId]) return;
    const { [quizId]: _removed, ...rest } = sessions.value;
    sessions.value = rest;
    if (import.meta.client) {
      try {
        sessionStorage.removeItem(`${STORAGE_PREFIX}${quizId}`);
      } catch {
        // Ignore removal failures.
      }
    }
  };

  // Clears any session whose quiz URL ends with the given route slug.
  // Used when a quiz page loads but the quiz no longer exists (deleted quiz → stale session).
  const clearSessionBySlug = (slug: string) => {
    const remaining: Record<string, QuizSession> = {};
    let changed = false;
    for (const [id, s] of Object.entries(sessions.value)) {
      if (s.quizUrl.endsWith(slug)) {
        if (import.meta.client) {
          try {
            sessionStorage.removeItem(`${STORAGE_PREFIX}${id}`);
          } catch {
            // Ignore removal failures.
          }
        }
        changed = true;
      } else {
        remaining[id] = s;
      }
    }
    if (changed) sessions.value = remaining;
  };

  return {
    sessions,
    getSession,
    saveSession,
    clearSession,
    clearSessionBySlug,
  };
};