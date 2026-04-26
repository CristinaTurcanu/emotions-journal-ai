# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

We're building the app described in @SPEC.md. Read that file for geneal architectural tasks or to double-check the exact database structure, tech stack or application architecture.

Keep your replies extremely concise and focus on conveying the key information. No unencessary fluff, no long code snippets.

Whenever working with any third-party libraries or something similar, you MUST look up the official documentation to ensure that you're working with up-to-date information. 
Use the DocsExplorer subagent for efficient documentation lookup. 

## Project

**Emotions Journal** — a private journaling app for logging feelings, body sensations, intensity, and unmet needs, with shareable notes. Also a sandbox for practicing Next.js App Router + AI-augmented development. Full product/architecture spec lives in `SPEC.md` — read it before implementing new features, as it encodes decisions that are not yet reflected in code.

**Current state:** the repo is a near-default `create-next-app` scaffold (single `app/page.tsx` Hello World). The architecture described below is the *target* from `SPEC.md`; most of it has not been built yet.

## Commands

Bun is the runtime and package manager (per `SPEC.md`), though npm-style scripts still work.

- `bun dev` — start Next.js dev server (http://localhost:3000)
- `bun run build` — production build
- `bun start` — serve production build
- `bun run lint` — ESLint (flat config, extends `eslint-config-next`)

Better Auth schema is generated/migrated via its CLI: `npx @better-auth/cli generate` / `migrate` — do **not** hand-roll the `user`/`session`/`account`/`verification` tables.

## Architecture (target, from SPEC.md)

**RSC-first.** Pages, layouts, and data-fetching are React Server Components by default. Client Components are leaf-level and marked `"use client"` only when they need state, events, or browser APIs.

**Server Actions for all writes.** No API routes for mutations — form submissions call `"use server"` functions directly. API routes are reserved for auth callbacks / webhooks.

**Streaming with Suspense.** Wrap async data fetches in `<Suspense>` with skeleton fallbacks instead of full-page loaders.

**Data layer: Bun SQLite, no ORM.** Single DB file at `data/journal.db` (env: `DB_PATH`). Write raw SQL. Variable/nested data (e.g. body sensations array) goes in TEXT columns as JSON and is queried via SQLite's `json_each()` / JSON functions.

**Auth: Better Auth over the same SQLite `Database` instance.** Handler mounted at `app/api/auth/[...all]/route.ts`. Server Components read session via `auth.api.getSession({ headers })`. A middleware gates the `(app)` route group. App tables (`entries`, `notes`) FK to `user.id`.

**Public shared notes run at the edge.** `/shared/[token]` uses Next.js Edge Runtime — mind edge constraints (no `bun:sqlite` at edge; SPEC suggests a lightweight fetch layer or KV cache for that route).

**Planned file layout** (create as needed — currently only `app/layout.tsx` and `app/page.tsx` exist):

```
app/
  (auth)/login, register
  (app)/journal, entries/[id], notes/[id], patterns
  shared/[token]          ← public, edge runtime
  api/auth/[...all]       ← Better Auth handler
lib/
  db.ts                   ← bun:sqlite client + query helpers
  auth.ts                 ← Better Auth config
  actions/                ← Server Actions grouped by domain
components/
  ui/                     ← presentational, no data fetching
  features/               ← domain components, may fetch data
```

## Conventions

- **TypeScript strict** everywhere. Path alias `@/*` → repo root (see `tsconfig.json`).
- **Tailwind v4** via `@tailwindcss/postcss`. Utility-first, no component library. Design tokens (feelings/needs wheel colors) should be defined in the Tailwind config when the design system is added.
- **Rich text** uses Tiptap v3 (`@tiptap/react` + `@tiptap/starter-kit`; `@tiptap/pm` is the ProseMirror peer). The editor is browser-only, so wrap it in a `"use client"` leaf component. Persist note body as Tiptap JSON (`editor.getJSON()`) in a TEXT column — not HTML. For read-only render (notably the edge `/shared/[token]` route), use `generateHTML(json, extensions)` server-side so public pages ship HTML, not an editor bundle. Start with `StarterKit`; add extensions only when a feature needs them.
- **Validation** with Zod at Server Action boundaries.
- **Env vars:** `BETTER_AUTH_SECRET` (≥32 chars) and `DB_PATH` — see `.env.example`.

## Build order (from SPEC)

Ship the core loop first: **auth → entry logging → journal view → notes**. Defer the patterns view and AI features (emotion labeling assist, reflection prompts, note summarization) until the core loop works end-to-end with raw SQL and Server Actions.
