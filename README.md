# JustQuiz

**Offline-first quiz practice app.** Paste AI-generated quizzes, play them right in your browser — no accounts, no servers, no setup.

---

## What This Project Does

JustQuiz turns study material into interactive quizzes you can practice anywhere. The core workflow is simple:

1. **Generate** — Take your lecture notes, textbook chapters, or any study material and ask an AI chatbot (ChatGPT, Claude, etc.) to create a quiz using JustQuiz's JSON format. A ready-to-use AI prompt template is built into the app.
2. **Import** — Paste the AI-generated JSON into the app. It validates every question (required fields, types, answer indices) before saving, so bad data never gets in.
3. **Practice** — Play your quiz with immediate feedback, explanations for every answer, and a detailed score review at the end.

Everything lives in the browser — quizzes are stored locally on your device (IndexedDB), so the app works fully offline. There is no backend, no user accounts, and no data tracking.

> **Recruiter summary:** A full-stack-frontend web app demonstrating offline-first architecture, PWA installability, client-side data persistence, browser-based OAuth integration with an external API (Google Drive), and a polished Vue 3 + TypeScript UI.

---

## Key Features

### 🧠 AI-First Quiz Import
- Structured JSON schema (`title`, `description`, `questions[]`) documented in-app with a copyable sample and AI prompt.
- Any AI chatbot can generate valid quizzes; imported JSON is validated question-by-question with clear error messages.
- Supports **4 question types**: single choice, multiple choice, true/false, and short answer (with multiple accepted answers).

### 📡 Fully Offline & Private
- SPA architecture (`ssr: false`) — no server required, static output deploys anywhere.
- Quizzes persist in the browser via **IndexedDB (Dexie)**.
- Works on a plane, on a train, with no internet at all.

### 📱 Installable PWA
- Built with Vite PWA — installable on desktop and mobile.
- Icons bundled at build time so the app works completely offline after install.
- iOS meta tags for "Add to Home Screen" support on iPhone/iPad.

### ☁️ Optional Google Drive Backup
- Sign in with Google (OAuth 2.0 via Google Identity Services) to back up or restore all quizzes.
- Uses the `drive.file` scope — the app can only access files **it** created, stored in a dedicated `JustQuiz` folder.
- "Save Files" / "Load Files" actions on the dashboard with merge logic (new quizzes created, matching titles updated in place).

### ✍️ Built-In Quiz Editor
- Create quizzes from scratch with a step-by-step visual editor.
- Edit existing quizzes, or delete them with confirmation.

### 🎨 Polished UX
- Quiz player with answer checking, explanations, and a final score review.
- Dashboard with search, sort filters, and an empty state.
- Share quizzes via short link.
- Dark / light mode with system preference detection.
- Custom design system: gradient accents, glassy cards, animated hero, custom fonts (Tailwind CSS).

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | **Nuxt 4** (Vue 3, Composition API) |
| Language | **TypeScript** |
| Styling | **Tailwind CSS 3** + custom design tokens |
| Local storage | **Dexie** (IndexedDB wrapper) |
| Google integration | **Google Identity Services** (browser OAuth) + Drive REST API |
| PWA | **@vite-pwa/nuxt** (offline support, installability) |
| Icons | **@nuxt/icon** with lucide icons (bundled at build time) |
| Package manager | **pnpm** |

---

## Project Structure

```
├── app/
│   ├── components/          # UI building blocks
│   │   ├── QuizPlayer.vue   #   quiz-taking experience w/ feedback & scoring
│   │   ├── QuizEditor.vue   #   step-by-step quiz builder
│   │   ├── ImportModal.vue  #   paste/upload JSON → validate → save
│   │   ├── ShareModal.vue   #   share quiz via short link
│   │   └── ...              #   AppHeader/Footer, ConfirmDialog, PWA install, etc.
│   ├── composables/         # Reusable logic
│   │   ├── useQuizDb.ts     #   IndexedDB CRUD for quizzes
│   │   ├── useGoogleDrive.ts#   OAuth sign-in + Drive save/load/merge
│   │   ├── usePwaInstall.ts #   PWA install prompt handling
│   │   └── useColorMode.ts  #   dark/light theme with system detection
│   ├── pages/               # Routes
│   │   ├── index.vue        #   dashboard (search, sort, CRUD, Drive actions)
│   │   ├── about.vue        #   landing page w/ features & how-it-works
│   │   ├── format.vue       #   JSON schema docs + copyable AI prompt
│   │   ├── setup.vue        #   Google Drive connection management
│   │   └── quiz/            #   player ([slug]), create (new), edit
│   ├── types/quiz.ts        # Quiz & Question TypeScript models
│   └── utils/               # db, validation, JSON parsing, slugs, sample data
├── public/                  # PWA icons, favicon, robots.txt
├── scripts/                 # PWA icon generation
└── nuxt.config.ts           # SPA mode, PWA manifest, runtime config, fonts
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm (recommended)

### Install dependencies

```bash
# pnpm (recommended)
pnpm install

# or
npm install
```

### Development server

Start the dev server at `http://localhost:3000`:

```bash
pnpm dev
```

### Production build

```bash
pnpm build     # static SPA output (nuxt build, ssr: false)
pnpm preview   # locally preview the production build
```

---

## Deployment

The app is configured for **static hosting** (e.g. GitHub Pages, Netlify, Vercel) — no Node server required.

- **Base path:** When serving from a sub-path (like `https://user.github.io/just-quiz/`), set `NUXT_APP_BASE_URL=/${{ github.event.repository.name }}/` at build time (see `nuxt.config.ts`).
- **Google Drive sync:** Set `NUXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID` to your Google OAuth client ID to enable the backup/sync feature. Drive sync gracefully degrades if unset.
- **PWA icons:** Regenerate after changing branding with `pnpm icons`.

---

## License

Private project.