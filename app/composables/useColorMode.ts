// app/composables/useColorMode.ts

export type ColorMode = 'light' | 'dark';

const STORAGE_KEY = 'justquiz-theme';

function getInitialMode(): ColorMode {
    if (import.meta.client) {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored === 'light' || stored === 'dark') return stored;
        } catch (e) {
            // localStorage unavailable — fall back to system preference
        }
        try {
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        } catch (e) {
            return 'light';
        }
    }
    return 'light';
}

export function useColorMode() {
    const mode = ref<ColorMode>(getInitialMode());

    const applyMode = (m: ColorMode) => {
        const root = document.documentElement;
        root.classList.toggle('dark', m === 'dark');
        root.style.colorScheme = m;
    };

    const persistMode = (m: ColorMode) => {
        try {
            localStorage.setItem(STORAGE_KEY, m);
        } catch (e) {
            // localStorage unavailable — theme simply won't persist across sessions
        }
    };

    const toggleMode = () => {
        // Add a temporary class to smoothly transition colors
        const root = document.documentElement;
        root.classList.add('theme-transition');
        mode.value = mode.value === 'dark' ? 'light' : 'dark';
        window.setTimeout(() => root.classList.remove('theme-transition'), 300);
    };

    watch(mode, (m) => {
        persistMode(m);
        applyMode(m);
    }, { immediate: true });

    return { mode, toggleMode };
}