// app/composables/usePwaInstall.ts
// Captures the browser's beforeinstallprompt and exposes install helpers.
// - Mobile Android/Chrome/Edge: returns a prompt we can call .prompt() on.
// - iOS Safari: no programmatic prompt; we show manual instructions instead.
// - Desktop: no install behavior (Launch just navigates).
//
// Module-level singleton: the window listeners are registered once, and all
// component instances share the same reactive state.

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

// --- Shared state (module scope) ---
const deferredPrompt = ref<BeforeInstallPromptEvent | null>(null);
const hasPromptEvent = ref(false);
const isInstalled = ref(false);

const isMobile = () => {
  if (import.meta.server) return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
};

const isIOS = () => {
  if (import.meta.server) return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
};

const isStandalone = () => {
  if (import.meta.server) return false;
  // @ts-expect-error - navigator.standalone is a legacy iOS Safari property
  return window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
};

// --- Register listeners once ---
if (!import.meta.server) {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    deferredPrompt.value = e as BeforeInstallPromptEvent;
    hasPromptEvent.value = true;
  });

  window.addEventListener('appinstalled', () => {
    isInstalled.value = true;
    deferredPrompt.value = null;
    hasPromptEvent.value = false;
  });
}

export const usePwaInstall = () => {
  /**
   * Whether the install prompt is available on this device:
   * - mobile only (Android/iPhone/iPad/iPod)
   * - a beforeinstallprompt event has fired (Android/Chrome/Edge)
   * - not already installed / not standalone
   */
  const canInstall = computed(() => {
    if (import.meta.server) return false;
    return isMobile() && hasPromptEvent.value && !isStandalone() && !isInstalled.value;
  });

  /**
   * Whether we should show iOS "Add to Home Screen" instructions:
   * - iOS Safari only
   * - not installed / not standalone
   */
  const showIOSInstructions = computed(() => {
    if (import.meta.server) return false;
    return isIOS() && !isStandalone() && !isInstalled.value;
  });

  /** Mobile device that could potentially install the PWA */
  const isMobileDevice = computed(() => {
    if (import.meta.server) return false;
    return isMobile() && !isStandalone() && !isInstalled.value;
  });

  /**
   * App is already running as an installed PWA (standalone).
   * Button should just Launch / navigate home.
   */
  const isAppInstalled = computed(() => {
    if (import.meta.server) return false;
    return isStandalone() || isInstalled.value;
  });

  /** Trigger the native install prompt (Android/Chrome/Edge) */
  const install = async () => {
    if (!deferredPrompt.value) return;
    await deferredPrompt.value.prompt();
    const choice = await deferredPrompt.value.userChoice;
    if (choice.outcome === 'accepted') {
      isInstalled.value = true;
    }
    deferredPrompt.value = null;
    hasPromptEvent.value = false;
  };

  return {
    canInstall,
    showIOSInstructions,
    isMobileDevice,
    isAppInstalled,
    install,
  };
};