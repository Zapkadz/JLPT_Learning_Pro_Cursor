# Project Context

Last updated: 2026-09-17
Source of truth for implementation: this repository (not chat history).

## Product Overview

**Kotoba** (`kotoba-learning`) is a Vietnamese-oriented Japanese learning app for personal study. Learners create decks, review with FSRS, practice JLPT-style multiple-choice, study kana, track progress (heatmap / streak / XP), and use a dedicated **Grammar N2** course module.

**Kaiwa Studio** is an **APPROVED / PLANNED** speaking / video-dubbing module. Full-video continuous dubbing is the current scope; character role-play is later. **Kaiwa application code is not implemented yet.**

Runs full-stack on a single Node.js host. SQLite persists per-account metadata. No default seeded user. No paid AI or email services required for core Grammar/flashcard product.

## Current Product Scope

Implemented and usable locally:

- Auth (register / login / logout)
- Decks & notes (CRUD, import TXT/CSV/TSV, templates, drafts)
- FSRS review (reveal-before-rate, versioning, idempotent review ids)
- Hiragana / Katakana charts + SRS deck creation
- JLPT practice (kanji / vocabulary / grammar MCQ from starter bank + personal questions)
- Progress, settings, personal JSON export
- Grammar N2: **26 lessons / 141 groups / 4230 exercises** published; optional JA→VI `promptRuby` (ADR-009)

Explicitly not full JLPT curriculum: starter bank remains a small authored set; Grammar N2 teacher independent review is still PENDING.

**Not implemented:** Kaiwa Studio UI, APIs, workers, migrations, or media storage.

## Tech Stack

### Frontend

- React 19, React DOM 19
- React Router 7 (`createBrowserRouter`)
- Vite 6 + `@vitejs/plugin-react`
- Lucide icons
- App CSS tokens in `src/styles.css` (DESIGN.md)

### Backend

- Express 5
- `tsx` runtime (`server/index.ts` → `createApp()` in `server/app.ts`)
- Helmet, cookie-parser, express-rate-limit
- Zod validation (shared + server)

### Database / Persistence

- SQLite via `better-sqlite3`, WAL mode
- Default path: `data/kotoba.sqlite` (`DB_PATH` override)
- Schema: `server/schema.sql`
- Grammar additive migration: `server/modules/grammar/migration.sql`

### Authentication

- scrypt password hashing
- Session cookie `kotoba_session` (HttpOnly, SameSite=strict; Secure in production)
- Session token stored hashed in `sessions`
- Mutations: origin / Sec-Fetch-Site checks

### Testing

- Node test runner via `tsx --test` (`tests/*.test.ts`, `tests/grammar/*.test.ts`)
- Playwright (`tests/app.spec.ts`, `npm run test:e2e`)
- Prettier format check

### Tooling / Infrastructure

- TypeScript 5.8 (`tsc --noEmit` in build)
- Concurrently for `npm run dev` (API `:3001` + Vite `:5173` loopback)
- Dockerfile (Node 22); online backup script `npm run backup`
- No ESLint config found in repo root

## Repository Structure

| Path | Role |
|------|------|
| `src/` | React UI: `main.tsx`, `App.tsx`, `pages/`, `features/grammar/`, `components/`, `lib/api.ts` |
| `server/` | Express app, schema, starter content, backup, `modules/grammar/` |
| `shared/` | Domain Zod/helpers, kana, kanji suggest, `grammar/types.ts` |
| `content/grammar/n2/` | Versioned Grammar N2 JSON (`manifest.json`, `lesson-01`…`lesson-26.json`) |
| `tests/` | Unit / API / grammar / Playwright |
| `docs/` | Product memory, requirements, grammar-n2 tracker, **kaiwa planning** |
| `docs/kaiwa/` | Approved Kaiwa PLAN / TASKS / IMPLEMENTATION-RULES |
| `data/` | Local SQLite (gitignored) |
| `.cursor/rules/` | Agent workflow + memory + Karpathy guidelines |

**Planned (partially present after KAI-005):** `src/features/kaiwa/` (UI not yet), `shared/kaiwa/` (**exists**), `server/modules/kaiwa/` (**exists** — migration + repository + routes), `server/workers/kaiwa/` (not yet), `server/modules/kaiwa/providers/` (not yet).

Ignored / do not treat as source: `node_modules/`, `dist/`, `tmp/`, `data/`.

## Application Architecture

```
Browser (Vite SPA)
  → fetch /api/* (dev proxy to :3001)
  → Express REST (auth cookie)
  → SQLite (prepared statements, ownership checks)
```

Production: Express also serves `dist/` SPA when `NODE_ENV=production` (+ required `APP_ORIGIN`).

Shared domain logic lives in `shared/` and is imported by both client and server where appropriate. Grammar answers stay server-side; public DTOs strip solutions.

## Main Modules

### Vocabulary / Kanji / Grammar (decks + practice)

- **Responsibility:** User decks of notes; optional MCQ on notes; global starter bank for `/practice`.
- **Entry:** `src/pages/Decks.tsx`, `DeckEditor.tsx`, `Practice.tsx`; `server/app.ts` deck/practice routes; `server/content.ts` bank.
- **Flow:** Edit notes → cards scheduled → review; or start practice attempt → submit → score (server grades).

### Flashcards / Review / SRS

- **Responsibility:** FSRS schedules on `cards`; reveal then rate 1–4.
- **Entry:** `src/pages/Review.tsx`; `POST /api/review/:id/reveal`, `POST /api/review/:id`.
- **Flow:** Due queue → reveal → rate → schedule + append-only `reviews` (requestId idempotency).

### Progress / XP / Heatmap

- **Responsibility:** Activity by local day `Asia/Ho_Chi_Minh`; unique entity keys; XP derived from unique knowledge × 10.
- **Entry:** `src/pages/Progress.tsx`, `Dashboard.tsx`; `GET /api/stats`.
- **Flow:** Merges reviews, practice attempts, and `grammar_events` (grammar pattern entity keys avoid double-count with SRS links).

### Kana

- **Responsibility:** Charts + create kana SRS decks.
- **Entry:** `src/pages/Kana.tsx`; `shared/kana.ts`; `POST /api/kana`.

### Grammar N2 (course module)

See dedicated section below. Separate from JLPT practice “grammar” MCQ.

### Kaiwa Studio (APPROVED / PLANNED — NOT YET IMPLEMENTED)

| Concern | Location |
|---------|----------|
| Module scope / gates | `docs/kaiwa/PLAN.md` |
| Task backlog / dependencies | `docs/kaiwa/TASKS.md` |
| Coding / evidence rules | `docs/kaiwa/IMPLEMENTATION-RULES.md` |
| Root queue pointer | `docs/PLAN.md` (current task **KAI-001**) |

**Planned architecture (intent only — directories do not exist yet):**

| Path | Planned responsibility |
|------|------------------------|
| `src/features/kaiwa/` | Pages, player, editor, recorder state machine, upload client, feedback UI |
| `shared/kaiwa/` | Zod schemas, DTOs, error contracts, scoring result contracts |
| `server/modules/kaiwa/` | Routes, services, repositories, ownership, quota, upload/take sessions |
| `server/workers/kaiwa/` | Durable jobs: probe/transcode, mix, export MP4, ASR, scoring, cleanup |
| `server/modules/kaiwa/providers/` | ASR / translation / pronunciation adapters + capability map |

**Persistence intent:** SQLite for metadata and pointers only. Large video/audio **must not** live as base64/blobs in SQLite. Media is **private per owner**. Export and assessment are independent pipelines (ADR-012–014).

**Current factual state:** No Kaiwa feature routes, tables, or UI in the codebase. Gate A / Gate B not started.

## Grammar N2 Architecture

| Concern | Location |
|---------|----------|
| Formal requirement | `docs/requirements/GRAMMAR-N2-MASTER-REQUIREMENT.md` |
| Historical module plan/progress | `docs/grammar-n2/PLAN.md`, `PROGRESS.md`, `IMPLEMENTATION-RULES.md` |
| Active task queue / status | `docs/PLAN.md`, `docs/PROGRESS.md`, `docs/HANDOFF.md` |
| Content | `content/grammar/n2/manifest.json`, `lesson-01.json` … `lesson-26.json`, `inventory.json` |
| Types / Zod | `shared/grammar/types.ts` |
| Load / grade / public DTO | `server/modules/grammar/content.ts` |
| API router + seed revisions | `server/modules/grammar/router.ts` mounted at `/api/grammar` |
| UI | `src/features/grammar/Grammar.tsx`, `grammar.css` |
| Routes | `/grammar`, `/grammar/n2`, lessons, patterns, exercises (see `src/main.tsx`) |
| Tests | `tests/grammar/grammar.test.ts` |
| Source mapping | `docs/grammar-n2/SOURCE-MAPPING.md` |

**Representation:** Published lesson files embed patterns (canonical groups). Each pattern has theory, examples with structured `ruby`, and 30 exercises (`vi-ja` / `ja-vi` / `order`). Optional `promptRuby` on `ja-vi` (ADR-009). Lesson 1 IDs: `sai`, `saishite`, `totan`, `omouto`, `kanai`. Other lessons use `lXX-gYY` IDs.

**Progress:** `grammar_progress`, `grammar_sessions` + responses, `grammar_events` (XP/heatmap), `grammar_srs_links` → flashcard decks. Denominator = 141 (ADR-008).

**Loader:** Multi-lesson loader loads published JSON from the manifest (all 26 published).

## Important Data Models

- **User / session / settings** — `users`, `sessions`; settings JSON (dailyGoal, level, retention).
- **Deck / note / card** — note JSON (`term`, `reading`, `meaning`, `example`, optional `question`); card FSRS schedule JSON + `version` / `revealed_version`.
- **Review / attempt** — append-only reviews; practice attempts snapshot questions (answers hidden until submit).
- **Grammar** — immutable `grammar_content_revisions`; sessions snapshot exercises; response state includes version, result, reveal/hint flags.
- **Kaiwa (planned)** — project/media/transcript-revision/take/export/assessment metadata in SQLite; binary assets on private storage.

## Important APIs

Under `/api` (auth required except health + auth register/login):

- Auth: `POST /auth/register|login|logout`, `GET /me`
- Decks: `GET/POST /decks`, `GET/PUT/DELETE /decks/:id`, starters, `POST /kana`
- Review: `GET /review`, `POST /review/:id/reveal`, `POST /review/:id`
- Practice: catalog, create attempt, get, submit, retry, `GET /attempts`
- Stats / settings / export
- Grammar: `/grammar/courses/n2`, `/grammar/lessons/:id`, `/grammar/patterns/:id`, progress, sessions, responses (save/check/hint/reveal/self-review), complete, SRS
- **Kaiwa:** none yet (planned under `/api/kaiwa` per module PLAN)

## State / Persistence

| Kind | Where |
|------|--------|
| Account, decks, schedules, reviews, attempts, grammar progress/sessions | SQLite server |
| Session auth | Cookie + DB hash |
| Grammar editor drafts (client) | `sessionStorage` (study content only; UX-CONTRACT) |
| Furigana preference | `localStorage` key `kotoba-grammar-reading` |
| Stats heatmap / streak / XP | Derived on read from DB events |
| Content bank / lessons | JSON files on disk; revisions copied into SQLite on startup |
| Kaiwa media (planned) | Private filesystem / later object storage — not SQLite blobs |

## Testing Strategy

- Domain/unit: import, JLPT matrix, kana/day helpers, generate (`tests/domain.test.ts`, `generate.test.ts`)
- API integration: auth, ownership, FSRS, quiz (`tests/api.test.ts`)
- Grammar: content invariants + API + migration/backup (`tests/grammar/grammar.test.ts`)
- E2E: import → review → quiz (`tests/app.spec.ts`) — requires Playwright + running app
- Kaiwa: per `docs/kaiwa/IMPLEMENTATION-RULES.md` when implementation starts

## Important Commands

From `package.json`:

| Command | Purpose |
|---------|---------|
| `npm run dev` | API watch + Vite |
| `npm run build` | `tsc --noEmit` + Vite build |
| `npm start` | Production API (+ static if production) |
| `npm test` | Unit + API + grammar tests |
| `npm run test:e2e` | Playwright |
| `npm run format` / `format:check` | Prettier |
| `npm run backup -- <path>` | SQLite online backup |

## Critical Constraints

- Do **not** reset/delete user progress, SRS history, or remap stable grammar `pattern_id`s without an approved migration.
- Do **not** expose exercise answers / `acceptedOrders` in public grammar DTOs or frontend bundles.
- Do **not** treat translation mismatch as automatic “incorrect”; use `matched` / `needs_review`.
- Do **not** report Grammar N2 targets (141 / 4230) as completed counts when incomplete; current published totals must match evidence.
- Do **not** claim `expert` / teacher verified without independent review.
- Do **not** invent Kaiwa as shipped or store large Kaiwa media in SQLite.
- Do **not** fake Japanese speaking scores.
- Reuse Kotoba architecture, DESIGN.md tokens, UX-CONTRACT owners; do not clone third-party branding.
- Conversation history is **not** persistent memory — update `docs/HANDOFF.md` and related docs.
- Remote repository: `https://github.com/Zapkadz/JLPT_Learning_Pro_Cursor.git` (default branch `main`).

## Important Documentation

| Doc | Role |
|-----|------|
| `README.md` | Runbook + feature summary |
| `DESIGN.md` | Visual / UX design system |
| `UX-CONTRACT.md` | Canonical UI ownership |
| `docs/PRODUCT.md` | Product vision / sitemap |
| `docs/PROJECT-CONTEXT.md` | This file — architecture snapshot |
| `docs/PLAN.md` | Active project-level task queue |
| `docs/PROGRESS.md` | Completed work + metrics |
| `docs/HANDOFF.md` | Session handoff (read first) |
| `docs/DECISIONS.md` | Long-lived decisions (ADR) |
| `docs/AI-BOOTSTRAP.md` | Bootstrap procedure for new AI/account |
| `docs/requirements/GRAMMAR-N2-MASTER-REQUIREMENT.md` | Formal Grammar N2 requirement |
| `docs/grammar-n2/*` | Module design notes, older tracker, implementation rules |
| `docs/kaiwa/PLAN.md` | Approved Kaiwa product scope + architecture + gates |
| `docs/kaiwa/TASKS.md` | Kaiwa backlog / dependencies / acceptance |
| `docs/kaiwa/IMPLEMENTATION-RULES.md` | Kaiwa coding / evidence / progress rules |

## Source of Truth Hierarchy

1. Current explicit user instruction
2. Approved module scope (`docs/kaiwa/PLAN.md` for Kaiwa; Grammar Master Requirement for Grammar N2)
3. Detailed module task state (`docs/kaiwa/TASKS.md`, etc.)
4. Module implementation rules
5. `DESIGN.md` / `UX-CONTRACT.md` / `docs/PRODUCT.md`
6. Root `docs/PLAN.md` (project-level active queue)
7. Existing repository code + git (factual implementation)
8. `docs/PROGRESS.md` / `HANDOFF.md` / `DECISIONS.md`
9. Historical/detail docs (`docs/grammar-n2/*`, research notes)
10. Implementation judgment

If intended behaviour and code differ: requirements decide intended state; code/git decide current factual state. Never write planned behaviour as shipped.

Git is authoritative for history. This workspace tracks `origin/main` on GitHub.
