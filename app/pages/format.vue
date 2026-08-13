<!-- app/pages/format.vue -->
<script setup lang="ts">
const copiedSample = ref(false);
const copiedPrompt = ref(false);

const copySample = async () => {
  await navigator.clipboard.writeText(JSON.stringify(SAMPLE_QUIZ_JSON, null, 2));
  copiedSample.value = true;
  setTimeout(() => (copiedSample.value = false), 2000);
};

const copyAiPrompt = async () => {
  await navigator.clipboard.writeText(AI_PROMPT_TEMPLATE);
  copiedPrompt.value = true;
  setTimeout(() => (copiedPrompt.value = false), 2000);
};

const sampleJson = JSON.stringify(SAMPLE_QUIZ_JSON, null, 2);

const typeDocs = [
  {
    type: 'single',
    description: 'One correct choice out of many.',
    fields: 'choices (string[]), correctIndices (number[])',
    example: '{ "type": "single", "text": "…", "choices": ["Paris", "London"], "correctIndices": [0] }',
  },
  {
    type: 'multiple',
    description: 'Two or more correct choices.',
    fields: 'choices (string[]), correctIndices (number[])',
    example: '{ "type": "multiple", "text": "…", "choices": ["A", "B", "C"], "correctIndices": [0, 2] }',
  },
  {
    type: 'true_false',
    description: 'A true/false statement. Choices default to ["True", "False"].',
    fields: 'choices optional, correctIndices (number[])',
    example: '{ "type": "true_false", "text": "…", "correctIndices": [0] }',
  },
  {
    type: 'short_answer',
    description: 'Type-in answer. Multiple accepted spellings/case variants allowed.',
    fields: 'acceptedAnswers (string[])',
    example: '{ "type": "short_answer", "text": "…", "acceptedAnswers": ["Canberra", "canberra"] }',
  },
];

const fieldDocs = [
  {
    field: 'title',
    type: 'string',
    required: true,
    description: 'The quiz name shown on the dashboard and player header.',
  },
  {
    field: 'description',
    type: 'string',
    required: false,
    description: 'Optional short summary of the quiz.',
  },
  {
    field: 'questions[]',
    type: 'array',
    required: true,
    description: 'At least one question object. Each question is validated individually.',
  },
  {
    field: 'questions[].text',
    type: 'string',
    required: true,
    description: 'The question text shown to the player.',
  },
  {
    field: 'questions[].type',
    type: 'single | multiple | true_false | short_answer',
    required: false,
    description: 'Defaults to "single" when omitted.',
  },
  {
    field: 'questions[].explanation',
    type: 'string',
    required: false,
    description: 'Shown after the player answers, in the end-of-quiz review.',
  },
];
</script>

<template>
  <main class="mx-auto max-w-4xl px-4 py-12 sm:px-6">
    <!-- Header -->
    <div class="mb-10 space-y-4">
      <div class="section-label">
        <span class="section-label-dot" />
        <span class="font-mono text-xs uppercase tracking-[0.15em] text-accent">JSON Format</span>
      </div>

      <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 class="font-display text-3xl tracking-tight text-foreground sm:text-4xl">
            Quiz <span class="gradient-text">Schema</span>
          </h1>
          <p class="mt-2 max-w-2xl text-muted-foreground">
            Give this format to any AI chatbot to turn your notes into a quiz, then import the result.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <button @click="copyAiPrompt" class="btn-outline group">
            <AppIcon name="lucide:copy" class="h-4 w-4" />
            {{ copiedPrompt ? '✓ Copied!' : 'Copy AI Prompt' }}
          </button>
          <button @click="copySample" class="btn-primary group">
            <AppIcon name="lucide:copy" class="h-4 w-4" />
            {{ copiedSample ? '✓ Copied!' : 'Copy Sample JSON' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Sample JSON -->
    <section class="space-y-4">
      <h2 class="font-display text-2xl text-foreground">Full Example</h2>
      <p class="text-sm text-muted-foreground">
        Paste this into the import modal to try it, or use it as a template when asking an AI to generate a quiz.
      </p>
      <pre class="overflow-x-auto rounded-xl border border-border bg-inverted-bg p-6 font-mono text-xs leading-relaxed text-inverted-fg shadow-lg"><code>{{ sampleJson }}</code></pre>
    </section>

    <!-- Tips -->
    <section class="mt-12 space-y-4">
      <h2 class="font-display text-2xl text-foreground">Tips</h2>
      <div class="grid gap-4 md:grid-cols-2">
        <div class="card-surface p-5">
          <div class="flex items-center gap-2">
            <AppIcon name="lucide:list-numbers" class="h-4 w-4 text-accent" :stroke-width="2.5" />
            <h3 class="text-sm font-semibold text-foreground">Set the question count</h3>
          </div>
          <p class="mt-2 text-sm text-muted-foreground">
            Mention how many questions you want, e.g. <em class="not-italic">"make 10 questions from these notes."</em> If you don't, the AI picks a sensible number.
          </p>
        </div>

        <div class="card-surface p-5">
          <div class="flex items-center gap-2">
            <AppIcon name="lucide:file-text" class="h-4 w-4 text-accent" :stroke-width="2.5" />
            <h3 class="text-sm font-semibold text-foreground">Paste raw notes</h3>
          </div>
          <p class="mt-2 text-sm text-muted-foreground">
            Notes can be bullet points, headings, or full paragraphs — the AI extracts the key concepts.
          </p>
        </div>

        <div class="card-surface p-5">
          <div class="flex items-center gap-2">
            <AppIcon name="lucide:target" class="h-4 w-4 text-accent" :stroke-width="2.5" />
            <h3 class="text-sm font-semibold text-foreground">Keep it focused</h3>
          </div>
          <p class="mt-2 text-sm text-muted-foreground">
            One subject per quiz gives better, more consistent questions.
          </p>
        </div>

        <div class="card-surface p-5">
          <div class="flex items-center gap-2">
            <AppIcon name="lucide:clipboard" class="h-4 w-4 text-accent" :stroke-width="2.5" />
            <h3 class="text-sm font-semibold text-foreground">Copy AI Prompt handles the details</h3>
          </div>
          <p class="mt-2 text-sm text-muted-foreground">
            The prompt already contains all format rules — just replace the NOTES section with your content.
          </p>
        </div>
      </div>
    </section>

    <!-- Top-level fields -->
    <section class="mt-12 space-y-4">
      <h2 class="font-display text-2xl text-foreground">Top-Level Fields</h2>
      <div class="overflow-hidden rounded-xl border border-border bg-card shadow-md">
        <table class="w-full text-left text-sm">
          <thead class="border-b border-border bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th class="px-4 py-3 font-medium">Field</th>
              <th class="px-4 py-3 font-medium">Type</th>
              <th class="px-4 py-3 font-medium">Required</th>
              <th class="px-4 py-3 font-medium">Description</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border">
            <tr v-for="doc in fieldDocs" :key="doc.field">
              <td class="px-4 py-3 font-mono text-xs text-accent">{{ doc.field }}</td>
              <td class="px-4 py-3 font-mono text-xs text-foreground">{{ doc.type }}</td>
              <td class="px-4 py-3">
                <span class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium"
                  :class="doc.required ? 'bg-accent/10 text-accent' : 'bg-muted text-muted-foreground'">
                  {{ doc.required ? 'Required' : 'Optional' }}
                </span>
              </td>
              <td class="px-4 py-3 text-muted-foreground">{{ doc.description }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Question types -->
    <section class="mt-12 space-y-4">
      <h2 class="font-display text-2xl text-foreground">Question Types</h2>
      <p class="text-sm text-muted-foreground">
        Each element in <code class="font-mono text-xs text-accent">questions[]</code> must set a valid type (or omit it to default to <code class="font-mono text-xs text-accent">single</code>).
      </p>
      <div class="grid gap-4 md:grid-cols-2">
        <div v-for="td in typeDocs" :key="td.type"
          class="card-surface p-5">
          <div class="flex items-center justify-between gap-2">
            <span class="font-mono text-sm font-semibold text-accent">{{ td.type }}</span>
            <span class="rounded-full bg-accent/5 px-2.5 py-0.5 text-xs font-medium text-accent">type</span>
          </div>
          <p class="mt-2 text-sm text-muted-foreground">{{ td.description }}</p>
          <p class="mt-3 text-xs text-muted-foreground">
            Fields: <span class="font-mono text-xs text-foreground">{{ td.fields }}</span>
          </p>
          <pre class="mt-3 overflow-x-auto rounded-lg bg-muted/50 p-3 font-mono text-[10px] leading-relaxed text-foreground"><code>{{ td.example }}</code></pre>
        </div>
      </div>
    </section>

    <!-- Validation note -->
    <section class="mt-12 rounded-xl border border-accent/20 bg-accent/5 p-6">
      <div class="flex items-start gap-3">
        <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-accent">
          <AppIcon name="lucide:check-check" class="h-4 w-4 text-white" :stroke-width="2.5" />
        </span>
        <div>
          <h2 class="font-display text-lg text-foreground">Validation</h2>
          <p class="mt-1 text-sm leading-relaxed text-muted-foreground">
            The import modal validates every question before saving: required fields, valid types, at least 2 choices for choice-based questions, and correct-answer indices within range. If something is wrong, you'll see a clear message and nothing gets saved.
          </p>
        </div>
      </div>
    </section>

    <!-- Back link -->
    <div class="mt-12">
      <NuxtLink to="/" class="btn-outline">
        <AppIcon name="lucide:arrow-left" class="h-4 w-4" :stroke-width="2.5" />
        Back to Dashboard
      </NuxtLink>
    </div>
  </main>
</template>