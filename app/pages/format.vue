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
        <span class="font-mono text-xs uppercase tracking-[0.15em] text-accent">Format Guide</span>
      </div>

      <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 class="font-display text-3xl tracking-tight text-foreground sm:text-4xl">
            Create a quiz with AI <span class="gradient-text">in 3 steps</span>
          </h1>
          <p class="mt-2 max-w-2xl text-muted-foreground">
            You don't need to understand JSON to use JustQuiz. Copy the prompt below, add your notes, and the AI writes the quiz for you. JustQuiz checks everything when you import it.
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

    <!-- Quick Start -->
    <section class="space-y-4">
      <h2 class="font-display text-2xl text-foreground">Quick start</h2>
      <div class="grid gap-4 md:grid-cols-3">
        <div class="card-surface p-5">
          <div class="flex items-center gap-2">
            <AppIcon name="lucide:copy" class="h-4 w-4 text-accent" :stroke-width="2.5" />
            <h3 class="text-sm font-semibold text-foreground">1. Copy the AI prompt</h3>
          </div>
          <p class="mt-2 text-sm text-muted-foreground">
            It already contains every rule JustQuiz needs — you just add your notes.
          </p>
        </div>

        <div class="card-surface p-5">
          <div class="flex items-center gap-2">
            <AppIcon name="lucide:file-text" class="h-4 w-4 text-accent" :stroke-width="2.5" />
            <h3 class="text-sm font-semibold text-foreground">2. Paste your notes</h3>
          </div>
          <p class="mt-2 text-sm text-muted-foreground">
            Bullet points, headings, full paragraphs — messy notes are fine. The AI sorts them out.
          </p>
        </div>

        <div class="card-surface p-5">
          <div class="flex items-center gap-2">
            <AppIcon name="lucide:download" class="h-4 w-4 text-accent" :stroke-width="2.5" />
            <h3 class="text-sm font-semibold text-foreground">3. Import the result</h3>
          </div>
          <p class="mt-2 text-sm text-muted-foreground">
            Copy the AI's reply and paste it into Import on your dashboard. That's it.
          </p>
        </div>
      </div>
    </section>

    <!-- Sample JSON -->
    <section class="mt-12 space-y-4">
      <h2 class="font-display text-2xl text-foreground">Full Example</h2>
      <p class="text-sm text-muted-foreground">
        This is what a finished quiz looks like. Use it to try the import, or check it if the AI gets confused.
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
            <h3 class="text-sm font-semibold text-foreground">Ask for a set number</h3>
          </div>
          <p class="mt-2 text-sm text-muted-foreground">
            Try <em class="not-italic">"make 10 questions from these notes"</em> so you get one focused practice session.
          </p>
        </div>

        <div class="card-surface p-5">
          <div class="flex items-center gap-2">
            <AppIcon name="lucide:file-text" class="h-4 w-4 text-accent" :stroke-width="2.5" />
            <h3 class="text-sm font-semibold text-foreground">Messy notes are fine</h3>
          </div>
          <p class="mt-2 text-sm text-muted-foreground">
            Paste your raw notes as-is — bullet points, headings, paragraphs. The AI picks out the key ideas.
          </p>
        </div>

        <div class="card-surface p-5">
          <div class="flex items-center gap-2">
            <AppIcon name="lucide:target" class="h-4 w-4 text-accent" :stroke-width="2.5" />
            <h3 class="text-sm font-semibold text-foreground">One topic per quiz</h3>
          </div>
          <p class="mt-2 text-sm text-muted-foreground">
            A quiz on "Photosynthesis" beats a quiz on "All of Biology" every time.
          </p>
        </div>

        <div class="card-surface p-5">
          <div class="flex items-center gap-2">
            <AppIcon name="lucide:clipboard" class="h-4 w-4 text-accent" :stroke-width="2.5" />
            <h3 class="text-sm font-semibold text-foreground">Just hit Copy</h3>
          </div>
          <p class="mt-2 text-sm text-muted-foreground">
            The copied prompt contains every format rule — you never have to write JSON yourself.
          </p>
        </div>
      </div>
    </section>

    <!-- Top-level fields -->
    <section class="mt-12 space-y-4">
      <h2 class="font-display text-2xl text-foreground">Under the hood <span class="text-base font-normal text-muted-foreground">(only if you're curious)</span></h2>
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
      <h2 class="font-display text-2xl text-foreground">Question types you can use</h2>
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
          <h2 class="font-display text-lg text-foreground">Import is always safe</h2>
          <p class="mt-1 text-sm leading-relaxed text-muted-foreground">
            JustQuiz double-checks every quiz before saving it — required fields, valid question types, and correct answers that point to real choices. If something doesn't look right, you'll get a clear message and nothing gets saved.
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