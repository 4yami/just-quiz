/**
 * Tracks whether the user is visiting the app for the first time.
 *
 * Uses localStorage to persist a "has visited" flag so the first-time
 * onboarding redirect (Dashboard → About) only happens once per browser.
 */
const STORAGE_KEY = 'justquiz:hasVisited';

export const useFirstVisit = () => {
  // Whether this is the user's first visit (checked once on mount, client-side only).
  const isFirstVisit = ref(false);

  const checkFirstVisit = () => {
    if (import.meta.client) {
      let hasVisited = false;
      try {
        hasVisited = localStorage.getItem(STORAGE_KEY) === 'true';
      } catch {
        // localStorage unavailable (private mode, etc.) — treat as returning visitor
        hasVisited = true;
      }
      isFirstVisit.value = !hasVisited;
    }
  };

  // Marks the user as a returning visitor so they aren't redirected again.
  const markVisited = () => {
    if (import.meta.client) {
      try {
        localStorage.setItem(STORAGE_KEY, 'true');
      } catch {
        // Ignore storage failures — worst case the user is redirected once more.
      }
    }
    isFirstVisit.value = false;
  };

  return {
    isFirstVisit,
    checkFirstVisit,
    markVisited,
  };
};