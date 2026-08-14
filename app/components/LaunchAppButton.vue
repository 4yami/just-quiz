<!-- app/components/LaunchAppButton.vue -->
<script setup lang="ts">
import { usePwaInstall } from '~/composables/usePwaInstall';

const props = defineProps<{
  class?: string;
  label?: string;
}>();

const { canInstall, showIOSInstructions, isMobileDevice, install } = usePwaInstall();
const showIOSModal = ref(false);

/**
 * When installation is possible (install prompt available, or iOS instructions),
 * show an install label — either the caller's override (e.g. "Install JustQuiz"
 * in the header) or the default "Install JustQuiz".
 * Everywhere else — desktop, already installed, or prompt not ready yet —
 * show "Launch JustQuiz".
 */
const label = computed(() => {
  if (canInstall.value || showIOSInstructions.value) {
    return props.label || 'Install JustQuiz';
  }
  return 'Launch JustQuiz';
});

const handleClick = async () => {
  // Android / Chrome / Edge — native install prompt
  if (canInstall.value) {
    await install();
    return;
  }
  // iOS Safari — no programmatic prompt, show manual instructions
  if (showIOSInstructions.value) {
    showIOSModal.value = true;
    return;
  }
  // Mobile but install prompt not ready yet (e.g. SW still registering) — fall back to launching
  if (isMobileDevice.value) {
    await navigateTo('/');
    return;
  }
  // Desktop / already installed — launch the app
  await navigateTo('/');
};
</script>

<template>
  <button
    type="button"
    :class="[
      'btn-primary group',
      props.class,
    ]"
    @click="handleClick"
  >
    {{ label }}
    <AppIcon name="lucide:arrow-right" class="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" :stroke-width="2.5" />
  </button>

  <!-- iOS "Add to Home Screen" instructions modal -->
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="showIOSModal" class="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center"
        @click.self="showIOSModal = false">
        <div class="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
          <div class="mb-4 flex items-start justify-between">
            <div class="flex items-center gap-3">
              <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-accent shadow-accent">
                <AppIcon name="lucide:download" class="h-5 w-5 text-white" />
              </span>
              <div>
                <h3 class="font-display text-lg tracking-tight">Install JustQuiz</h3>
                <p class="text-sm text-muted-foreground">Add to your home screen for quick access</p>
              </div>
            </div>
            <button class="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Close" @click="showIOSModal = false">
              <AppIcon name="lucide:x" class="h-5 w-5" />
            </button>
          </div>

          <ol class="space-y-4">
            <li class="flex items-start gap-3">
              <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/10 text-sm font-bold text-accent">1</span>
              <div class="text-sm leading-relaxed text-muted-foreground">
                Tap the
                <span class="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 font-medium text-foreground">
                  <AppIcon name="lucide:share" class="h-3.5 w-3.5" />
                  Share
                </span>
                button in Safari's toolbar.
              </div>
            </li>
            <li class="flex items-start gap-3">
              <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/10 text-sm font-bold text-accent">2</span>
              <div class="text-sm leading-relaxed text-muted-foreground">
                Scroll down and tap
                <span class="rounded-md bg-muted px-1.5 py-0.5 font-medium text-foreground">Add to Home Screen</span>.
              </div>
            </li>
            <li class="flex items-start gap-3">
              <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/10 text-sm font-bold text-accent">3</span>
              <div class="text-sm leading-relaxed text-muted-foreground">
                Tap <span class="rounded-md bg-muted px-1.5 py-0.5 font-medium text-foreground">Add</span> — JustQuiz will appear on your home screen.
              </div>
            </li>
          </ol>

          <button class="btn-primary mt-6 w-full" @click="showIOSModal = false">
            Got it
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>