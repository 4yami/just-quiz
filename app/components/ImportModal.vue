<!-- app/components/ImportModal.vue -->
<script setup lang="ts">
import { parseQuizJson } from '~/utils/parseQuizJson';

const emit = defineEmits(['close', 'quiz-added']);
const { saveImportedQuiz } = useQuizDb();

const rawJson = ref('');
const errorMessage = ref('');
const copiedPrompt = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

const loadSample = () => {
  rawJson.value = JSON.stringify(SAMPLE_QUIZ_JSON, null, 2);
  errorMessage.value = '';
};

const copyAiPrompt = async () => {
  await navigator.clipboard.writeText(AI_PROMPT_TEMPLATE);
  copiedPrompt.value = true;
  setTimeout(() => (copiedPrompt.value = false), 2000);
};

const readFileAsText = (file: File) => {
  const reader = new FileReader();
  reader.onload = () => {
    rawJson.value = String(reader.result || '');
    errorMessage.value = '';
  };
  reader.onerror = () => {
    errorMessage.value = 'Could not read the file. Please try again.';
  };
  reader.readAsText(file);
};

const handleFileSelect = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  readFileAsText(file);
};

const handleFileDrop = (e: DragEvent) => {
  const file = e.dataTransfer?.files?.[0];
  if (!file) return;
  readFileAsText(file);
};

const handleImport = async () => {
  errorMessage.value = '';
  const result = parseQuizJson(rawJson.value);

  if (!result.ok) {
    errorMessage.value = result.error;
    return;
  }

  const validation = validateQuizJson(result.data);

  if (!validation.valid) {
    errorMessage.value = validation.errors[0] || 'Invalid quiz format.';
    return;
  }

  const newId = await saveImportedQuiz(result.data);
  emit('quiz-added', newId);
  emit('close');
};
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
    <div class="w-full max-w-lg space-y-5 rounded-2xl border border-border bg-card p-6 shadow-xl sm:p-8">
      <div class="flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-accent shadow-accent">
            <AppIcon name="lucide:download" class="h-5 w-5 text-white" />
          </span>
          <h2 class="font-display text-xl text-foreground">Import Quiz</h2>
        </div>

        <button
          @click="copyAiPrompt"
          class="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all duration-200 hover:border-accent/30 hover:text-foreground"
        >
          <AppIcon name="lucide:copy" class="h-3.5 w-3.5" />
          {{ copiedPrompt ? '✓ Copied!' : 'Copy Format Prompt' }}
        </button>
      </div>

      <!-- File drop zone -->
      <div
        @dragover.prevent
        @drop.prevent="handleFileDrop"
        @click="fileInput?.click()"
        class="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/30 p-6 text-center transition-colors duration-200 hover:border-accent/40"
      >
        <AppIcon name="lucide:download" class="h-6 w-6 text-muted-foreground" />
        <p class="text-sm font-medium text-muted-foreground">
          Drop a <span class="font-mono text-xs">.json</span> file here or click to browse
        </p>
        <input
          ref="fileInput"
          type="file"
          accept=".json,application/json"
          class="hidden"
          @change="handleFileSelect"
        />
      </div>

      <div class="flex items-center gap-3">
        <div class="h-px flex-1 bg-border" />
        <span class="text-xs font-medium uppercase tracking-wider text-muted-foreground">or paste JSON</span>
        <div class="h-px flex-1 bg-border" />
      </div>

      <textarea
        v-model="rawJson"
        placeholder="Paste AI-generated JSON here..."
        class="h-56 w-full resize-none rounded-xl border border-border bg-muted/30 p-4 font-mono text-xs leading-relaxed text-foreground placeholder:text-muted-foreground/50 focus:border-accent focus:bg-card focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background"
      ></textarea>

      <div class="flex flex-wrap items-center gap-2">
        <button @click="loadSample" class="btn-ghost text-xs">
          Load sample
        </button>
      </div>

      <p v-if="errorMessage" class="flex items-center gap-2 text-sm font-medium text-red-600 dark:text-red-400">
        <AppIcon name="lucide:info" class="h-4 w-4 shrink-0" />
        {{ errorMessage }}
      </p>

      <div class="flex justify-end gap-3 pt-2">
        <button @click="$emit('close')" class="btn-outline">
          Cancel
        </button>
        <button @click="handleImport" class="btn-primary group">
          Import
          <AppIcon name="lucide:arrow-right" class="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" :stroke-width="2.5" />
        </button>
      </div>
    </div>
  </div>
</template>