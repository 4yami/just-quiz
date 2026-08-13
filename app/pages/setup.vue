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
          Drive <span class="gradient-text">Sync</span>
        </h1>
        <p class="mt-2 max-w-2xl text-muted-foreground">
          Manage your Google account connection here. Save and restore all quizzes directly from the
          dashboard — only files created by this app are accessible.
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
            <p class="font-semibold text-foreground">Google Account</p>
            <p class="text-sm text-muted-foreground">
              {{ isSignedIn ? 'Signed in' : 'Not signed in' }}
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

    <!-- Setup instructions -->
    <section class="mt-10 rounded-xl border border-accent/20 bg-accent/5 p-6">
      <h2 class="font-display text-lg text-foreground">How it works</h2>
      <ul class="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
        <li>• All files are stored in a <span class="font-mono text-xs text-accent">JustQuiz</span> folder in your Google Drive.</li>
        <li>• The app uses the <span class="font-mono text-xs text-accent">drive.file</span> scope — it can only see files it created itself.</li>
        <li>• No account is created with this app; you're signing straight into Google.</li>
        <li>• Quizzes imported from Drive are merged into your local (IndexedDB) collection.</li>
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