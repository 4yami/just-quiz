<!-- app/pages/setup.vue -->
<script setup lang="ts">
const { isSignedIn, isBusy, signIn, signOut } = useGoogleDrive();

const message = ref<{ type: 'success' | 'error'; text: string } | null>(null);

const handleSignIn = async () => {
  message.value = null;
  try {
    await signIn();
    message.value = { type: 'success', text: 'Signed in with Google.' };
  } catch (err: any) {
    message.value = { type: 'error', text: err.message || 'Sign-in failed.' };
  }
};

const handleSignOut = () => {
  signOut();
  message.value = null;
};
</script>

<template>
  <main class="mx-auto max-w-3xl px-4 py-12 sm:px-6">
    <!-- Header -->
    <div class="mb-10 space-y-4">
      <div class="section-label">
        <span class="section-label-dot" />
        <span class="font-mono text-xs uppercase tracking-[0.15em] text-accent">Google Drive</span>
      </div>

      <div>
        <h1 class="font-display text-3xl tracking-tight text-foreground sm:text-4xl">
          Keep your quizzes <span class="gradient-text">safe</span>
        </h1>
        <p class="mt-2 max-w-2xl text-muted-foreground">
          Your quizzes are saved on this device automatically. Connecting Google Drive gives you a one-click backup — and an easy way to take your quizzes with you to another phone or laptop.
        </p>
      </div>
    </div>

    <!-- Status & Actions -->
    <section class="card-surface p-6">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-accent shadow-accent">
            <AppIcon name="lucide:shield" class="h-5 w-5 text-white" />
          </span>
          <div>
            <p class="font-semibold text-foreground">Drive connection</p>
            <p class="text-sm text-muted-foreground">
              {{ isSignedIn ? 'Connected' : 'Not connected' }}
            </p>
          </div>
        </div>

        <button v-if="!isSignedIn" @click="handleSignIn" :disabled="isBusy"
          class="btn-primary disabled:cursor-not-allowed disabled:opacity-40">
          Sign in with Google
        </button>
        <button v-else @click="handleSignOut" :disabled="isBusy"
          class="btn-outline disabled:cursor-not-allowed disabled:opacity-40">
          Sign out
        </button>
      </div>
    </section>

    <!-- Message -->
    <p v-if="message" class="mt-4 border p-4 text-sm"
      :class="message.type === 'success'
        ? 'alert-success'
        : 'alert-error'">
      {{ message.text }}
    </p>

    <!-- How it works -->
    <section class="mt-10 rounded-xl border border-accent/20 bg-accent/5 p-6">
      <h2 class="font-display text-lg text-foreground">What you can do</h2>
      <ul class="mt-3 space-y-4 text-sm leading-relaxed text-muted-foreground">
        <li class="flex items-start gap-3">
          <span class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent/10">
            <AppIcon name="lucide:upload" class="h-4 w-4 text-accent" :stroke-width="2.5" />
          </span>
          <span><strong class="font-semibold text-foreground">Back up everything.</strong> Click Save Files on the Dashboard and your quizzes are stored in a private <span class="font-mono text-xs text-accent">JustQuiz</span> folder in your own Google Drive.</span>
        </li>
        <li class="flex items-start gap-3">
          <span class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent/10">
            <AppIcon name="lucide:download" class="h-4 w-4 text-accent" :stroke-width="2.5" />
          </span>
          <span><strong class="font-semibold text-foreground">Move to another device.</strong> Sign in on your phone or laptop, click Load Files, and your quizzes appear — they merge with anything you already have.</span>
        </li>
        <li class="flex items-start gap-3">
          <span class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent/10">
            <AppIcon name="lucide:shield" class="h-4 w-4 text-accent" :stroke-width="2.5" />
          </span>
          <span><strong class="font-semibold text-foreground">It stays private.</strong> JustQuiz only sees the files inside its own folder. Your other Drive files are never touched — and no separate account is created with JustQuiz itself.</span>
        </li>
      </ul>
    </section>

    <!-- Back link -->
    <div class="mt-10">
      <NuxtLink to="/" class="btn-outline">
        <AppIcon name="lucide:arrow-left" class="h-4 w-4" :stroke-width="2.5" />
        Back to Dashboard
      </NuxtLink>
    </div>
  </main>
</template>