Here are the full tech specs for your Emotions Journal app:

---

## Project identity

**Name:** Emotions Journal
**Goal:** A private, expressive journaling app where users log feelings, body sensations, intensity, and unmet needs — and can write and share notes with others.
**Secondary goal:** A learning sandbox for mastering Next.js App Router architecture and AI-augmented development.

---

## Tech stack

**Runtime & package manager:** Bun — used for running the dev server, executing scripts, and managing packages.

**Framework:** Next.js 15 with the App Router. All routing lives under `app/`. You'll lean into React Server Components as the default, dropping down to Client Components only where interactivity is needed (forms, real-time UI, browser APIs).

**Language:** TypeScript throughout — strict mode enabled.

**Styling:** Tailwind CSS v4. Utility-first, no component library. You define your design tokens (colors from the feelings/needs wheels, spacing, typography) in `tailwind.config.ts`.

**Database:** SQLite via Bun's built-in `bun:sqlite` module. No ORM. Raw SQL statements only. Data with variable or nested structure (e.g. body sensations, needs arrays) is stored as JSON columns using SQLite's JSON functions when querying.

**Auth:** [Better Auth](https://better-auth.com/docs/adapters/sqlite) wired to the same SQLite database via its Bun SQLite adapter (pass the `bun:sqlite` `Database` instance into `betterAuth({ database })`). Email/password to start; OAuth providers can be added later by dropping records into the `account` table. Schema is generated and kept in sync with the Better Auth CLI (`npx @better-auth/cli generate` / `migrate`). Sessions live in the same SQLite file, so no extra session store is needed.

**Rich text editor:** [Tiptap](https://tiptap.dev) v3 (`@tiptap/react` + `@tiptap/starter-kit`, with `@tiptap/pm` as the ProseMirror peer). Used for the notes editor. Tiptap is browser-only, so the editor lives in a `"use client"` leaf component; the server reads/writes the note body as Tiptap JSON (`editor.getJSON()`) stored in a TEXT column. For public read-only rendering on `/shared/[token]`, render the stored JSON with Tiptap's `generateHTML` (Node-safe) on the server so the edge route ships HTML, not an editor bundle. `StarterKit` is the baseline; additional extensions (links, task lists, etc.) are opt-in as features demand them.

---

## Data model

Everything lives in a single SQLite file at `data/journal.db`.

The `user`, `session`, `account`, and `verification` tables are owned and migrated by Better Auth — do not hand-roll them. The app's own tables (`entries`, `notes`) reference `user.id` via foreign key.

**user** (managed by Better Auth) — `id` (PK, text), `name`, `email` (unique), `emailVerified` (boolean), `image` (nullable), `createdAt`, `updatedAt`. The `display_name` we care about is just `name`; password hashes do **not** live here.

**session** (managed by Better Auth) — `id`, `userId` (FK → user.id), `token`, `expiresAt`, `ipAddress` (nullable), `userAgent` (nullable), `createdAt`, `updatedAt`.

**account** (managed by Better Auth) — `id`, `userId` (FK → user.id), `accountId`, `providerId` (e.g. `"credential"` for email/password, `"google"` for OAuth), `password` (hashed, only for the credential provider), `accessToken`, `refreshToken`, `accessTokenExpiresAt`, `refreshTokenExpiresAt`, `scope`, `idToken`, `createdAt`, `updatedAt`.

**verification** (managed by Better Auth) — `id`, `identifier`, `value`, `expiresAt`, `createdAt`, `updatedAt`. Used for email verification and password reset tokens.

**entries** — id, user_id (FK → user.id), core_emotion, nuance, intensity (1–5), body_sensations (JSON array of strings), need, created_at, updated_at

**notes** — id, user_id (FK → user.id), entry_id (nullable — a note can be standalone or attached to an entry), title, content (text), is_shared (boolean), share_token (random slug for public link sharing), created_at, updated_at

Body sensations are stored as a JSON array in a TEXT column: `["tight chest", "shallow breath", "heavy shoulders"]`. SQLite's `json_each()` can query these when needed for patterns.

---

## Feature areas

**Auth flow** — register, login, logout, handled by Better Auth's built-in email/password flows. Server Components call `auth.api.getSession({ headers })` to read the current session; a Next.js middleware gates the `(app)` route group and redirects unauthenticated visitors to `/login`. Better Auth's handler is mounted at `app/api/auth/[...all]/route.ts`. Unauthenticated users can view shared notes via a public token URL but cannot create or edit anything.

**Entry logging** — step-by-step form: core emotion → nuance → intensity → body sensations → need → optional note. Submitted as a single Server Action that writes to `entries` and optionally `notes`.

**Journal view** — chronological list of the user's entries. Rendered as a React Server Component with streaming via Suspense. Each entry shows emotion chip, intensity, body sensations, need, timestamp, and a note snippet if one exists.

**Notes** — users can create rich-text notes attached to an entry or standalone. Notes have a toggle to make them shareable via a unique URL (`/shared/[token]`). Shared notes are publicly readable — no auth required. The author can revoke sharing at any time.

**Patterns view** — server-rendered aggregations: most frequent emotions, most frequent needs, emotion→need pairings, weekly entry count. Computed with raw SQL GROUP BY queries.

---

## Architecture decisions

**React Server Components are the default.** Pages, layouts, and data-fetching components are all RSCs unless they need state, event handlers, or browser APIs. Client Components are small, leaf-level, and marked `"use client"` explicitly.

**Server Actions for all mutations.** No dedicated API routes for data writes. Form submissions and button actions call `"use server"` functions directly. This keeps the data layer close to the UI and makes mutations type-safe end to end.

**Streaming with Suspense.** The journal list, patterns, and entry detail views wrap async data fetching in `<Suspense>` with skeleton fallbacks. This means the shell of the page renders immediately while data loads — no full-page loading states.

**Edge rendering for public routes.** The shared note view (`/shared/[token]`) runs at the edge using Next.js Edge Runtime. It reads from SQLite via a lightweight fetch layer (or you can serve shared content from a small Vercel KV cache if SQLite isn't available at edge). This is the one place where you'll experiment with edge constraints.

**File layout follows the App Router convention:**
```
app/
  (auth)/login, register
  (app)/journal, entries/[id], notes/[id], patterns
  shared/[token]          ← public, edge runtime
  api/                    ← minimal, only for webhooks or OAuth callbacks
lib/
  db.ts                   ← Bun SQLite client, query helpers
  auth.ts                 ← Auth.js config
  actions/                ← Server Actions grouped by domain
components/
  ui/                     ← pure presentational (no data fetching)
  features/               ← domain components, may fetch data
```

---

## AI integration angle

Since "AI-augmented frontend development" is a stated goal, here are the touchpoints where AI fits naturally:

**Emotion labeling assist** — after a user writes a free-text note, an AI call (via Anthropic or OpenAI API) can suggest the most likely core emotion and need. The suggestion is shown as a pre-fill, not forced.

**Reflection prompts** — when viewing past entries, an RSC can call an AI endpoint to generate a one-sentence reflection prompt ("You've logged loneliness 4 times this week — what's one small thing that might help with connection?"). This runs server-side, so the API key never touches the client.

**Note summarization** — long shared notes can have an AI-generated summary shown to public readers before they read the full content.

These are additive features, not core to the MVP. They're good candidates for streaming AI responses using the Vercel AI SDK, which pairs cleanly with RSC and Suspense.

---

## Development priorities

Start with the core loop: auth → entry logging → journal view → notes. Get those working with raw SQL and Server Actions before touching patterns or AI features. The architecture patterns you'll practice most — RSC composition, Suspense boundaries, Server Actions — are all exercised by that core loop alone.