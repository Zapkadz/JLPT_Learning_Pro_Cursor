# PROGRESS — factual completion log

Last updated: 2026-09-15  
Rule: **never** write targets as completed counts.

## Current Status

- Product core (auth, decks, FSRS review, kana, JLPT practice, stats/export): **shipped in repo** (see README).  
- Grammar N2 Lesson 1 pilot: **shipped** (5 groups / 150 exercises, `agent_reviewed`).  
- Grammar N2 Master Requirement: **present**.  
- **N2-AUDIT-001 DONE** (2026-09-14).  
- **N2-MAP-001 DONE** (2026-09-14) — `content/grammar/n2/inventory.json` + `docs/grammar-n2/SOURCE-MAPPING.md`.  
- **N2-MAP-002 DONE** (2026-09-15) — **141/141** groups mapped to TNĐG URLs / match status.  
- **N2-ARCH-001 DONE** (2026-09-15) — multi-lesson loader (published JSON only); merged PR #1.  
- **N2-ARCH-002 DONE** (2026-09-15) — additive Zod metadata (`variants`, `source.urls`, exercise `origin`/`sourceNote`).  
- **N2-L01-UX-001 DONE** (2026-09-15) — Grammar UI/API no longer hard-code Lesson 1 paths.  
- Persistent project memory files: **established** (MEM-001 DONE).  
- Git: **AVAILABLE** — work on `feat/n2-arch-002-metadata` (ARCH-002 + UX-001, uncommitted).

## TARGET vs ACTUAL (Grammar N2)

| Metric | TARGET | ACTUAL (re-verified 2026-09-15 after N2-MAP-002) |
|--------|--------|-----------------------------------------------|
| Lessons in manifest | 26 | 26 rows in `manifest.json` |
| Lessons published / learnable | 26 | **1** (`lesson-01` published) |
| Canonical groups | 141 | Manifest `sum(groupCount)=141`; **implemented content: 5** |
| Exercises | 4230 | **150** in `lesson-01.json` (5×30; per-group 10+10+10; unique IDs/prompts) |
| TNĐG URLs | 141 mapped | **DONE** — 7 partial-match rows (see below) |
| Independent teacher review | desired | **Not done** (`agent_reviewed` only) |

Lesson 1 pattern IDs: `sai`, `saishite`, `totan`, `omouto`, `kanai`. Content revision: **3**.

partial-match: `l04-g05`, `l04-g06`, `l13-g02`, `l13-g05`, `l18-g03`, `l23-g06`, `l26-g02`.

## Completed Work (evidence-based)

### Core product 1.0 (pre-existing)

Result: Local full-stack app as described in `README.md`, `DESIGN.md`, `docs/PRODUCT.md`.  
Important areas: `src/`, `server/app.ts`, `shared/domain.ts`, `tests/api.test.ts`, `tests/app.spec.ts`.

### Grammar N2 Lesson 1 pilot (documented 2026-09-13 in `docs/grammar-n2/PROGRESS.md`)

| Legacy ID | Result |
|-----------|--------|
| G04–G10 | Lesson 1 content, API, UI, practice modes, progress/SRS/export, acceptance for pilot scope |

### MEM-001 (2026-09-14) — DONE

Root project memory docs + `.cursor/rules/project-memory.mdc`.

### N2-GIT-000 (2026-09-14) — DONE

Git init + push to `origin/main`.

### N2-AUDIT-001 (2026-09-14) — DONE

Re-verified against repository (no app code changes):

- **151 vs 141:** Kotoba UI/API use `targetGroups: 141`. No `151` in `src/` or content. **151** is NhatKanji reference count in `docs/grammar-n2/PLAN.md` only.  
- L1: 5 groups × 30 = 150; each group 10 vi-ja + 10 ja-vi + 10 order; 150 unique exercise IDs and prompts; 0 reverse VI↔JA pairs; 0 learning↔practice overlaps (exact/substring); 0 one-token near-dups; order structures valid.  
- Learning examples: 1 per group with structured ruby; practice JA→VI: plain text, no ruby fields.  
- Source metadata: pattern `source.pdfPage/printedPage` + lesson `provenance`; no Tiếng Nhật Đơn Giản URLs; no exercise `origin`.  
- Progress/SRS keyed by stable `pattern_id` strings; stats entity `grammar:{patternId}`.  
- Scale gap: `content.ts` hardcodes `lesson-01.json`; UI hardcodes Bài 01 paths; SOURCE-MAPPING missing.  
- Tests: `tests/grammar/grammar.test.ts` (3 cases); no Playwright grammar journey file.

### N2-L01-UX-001 (2026-09-15) — DONE

- Course hero CTA uses first `published` lesson from API.  
- Pattern detail returns `lessonId` / `lessonNumber` / `lessonTitle`; back-link uses those.  
- SRS deck blurb uses lesson number from manifest.  
- No `lesson-01` string left in `Grammar.tsx`.

### N2-ARCH-002 (2026-09-15) — DONE

- Extended `patternSchema` with `variants` (default `[]`) and `source.urls` (default `[]`).  
- Extended exercises with optional `origin` (`source` | `source-adapted` | `authored`) and `sourceNote`.  
- Lesson 1 JSON unchanged; still parses. `publicExercise` strips answers/origin/sourceNote.  
- Lesson list API returns `variants`. Branch: `feat/n2-arch-002-metadata`.

### N2-ARCH-001 (2026-09-15) — DONE

- Replaced hard-coded `lesson-01.json` load with manifest-driven loader.  
- Only `published: true` lessons are loaded; missing published file fails at startup.  
- Router: `GET /lessons/:id` unpublished/unknown → 404; course counts from `allPatterns()`.  
- Branch: `feat/n2-arch-001-loader`. No L2–26 content JSON added.

### N2-MAP-002 L21–26 batch (2026-09-15) — DONE (141/141)

- Filled final 36 `canonicalPattern`s (L22–26 from 3A TOC; L21 from Quizlet/mylittlewordland).  
- Mapped TNĐG URLs; `l23-g06` / `l26-g02` marked `partial-match`.  
- Inventory test updated to assert 141 mapped / 0 `needs-review`.

### N2-MAP-002 L16–20 batch (2026-09-15) — DONE (105/141 cumulative at time)

- Filled `canonicalPattern` for lessons 16–20 from 3A TOC.  
- Mapped TNĐG URLs; `l18-g03` (かねる) marked `partial-match`.

### N2-MAP-002 L11–15 batch (2026-09-15) — DONE (77/141 cumulative at time)

- Filled `canonicalPattern` for lessons 11–15 from 3A TOC.  
- Mapped TNĐG URLs; `l13-g02` / `l13-g05` marked `partial-match`.

### N2-MAP-002 L6–10 batch (2026-09-14) — DONE (50/141 cumulative at time)

- Filled `canonicalPattern` for lessons 6–10 from 3A TOC.  
- Mapped TNĐG URLs (all full-match in this batch).

### N2-MAP-002 L2–5 batch (2026-09-14) — DONE (26/141 cumulative at time)

- Filled `canonicalPattern` for lessons 2–5 from 3A Shinkanzen TOC.  
- Mapped TNĐG URLs; `l04-g05` / `l04-g06` marked `partial-match`.

### N2-MAP-002 L1 batch (2026-09-14)

- Mapped Lesson 1 groups to Tiếng Nhật Đơn Giản URLs in `inventory.json`.

## Verification History

| When | What | Result | Evidence |
|------|------|--------|----------|
| 2026-09-15 | N2-L01-UX-001 + pattern lesson metadata | **14/14 pass** | `npm test` |
| 2026-09-15 | N2-ARCH-002 additive Zod metadata + DTO strip | **14/14 pass** | `npm test` |
| 2026-09-15 | N2-ARCH-001 multi-lesson loader after PR merge | **13/13 pass** | `npm test` on `main` |
| 2026-09-15 | N2-MAP-002 L21–26 + inventory test | **12/12 pass** | `npm test` |
| 2026-09-15 | N2-MAP-002 L16–20 + inventory test | **12/12 pass** | `npm test` |
| 2026-09-15 | N2-MAP-002 L11–15 + inventory test | **12/12 pass** | `npm test` |
| 2026-09-14 | N2-MAP-002 L6–10 + inventory test | **12/12 pass** | `npm test` |
| 2026-09-14 | N2-MAP-002 L2–5 + inventory test | **12/12 pass** | `npm test` |
| 2026-09-14 | N2-MAP-002 L1 + inventory test | **12/12 pass** | `npm test` |
| 2026-09-14 | N2-MAP-001 inventory test | **12/12 pass** (with full suite) | `npm test` after MAP-001 |
| 2026-09-14 | `npm test` | **11/11 pass** (earlier same calendar day) | Prior session |
| 2026-09-14 | `npm run build` / `test:e2e` / `format:check` | **NOT RUN** during N2-AUDIT-001 | — |

## Known Incomplete Work

- Lesson 1 golden-template polish (**N2-L01-GOLD-001**).  
- Lessons 2–26 content import.  
- Playwright grammar E2E.  
- Populate `origin` / `variants` on Lesson 1 content (schema ready; data later).  
- Commit/PR for `feat/n2-arch-002-metadata` (ARCH-002 + UX-001).

## Known Issues

- Dual trackers: `docs/grammar-n2/*` (history) vs root PLAN/PROGRESS (active).  
- UX-CONTRACT cites `server/index.ts` for CRUD; implementation is `server/app.ts`.  
- `premium-audit.json` stale `projectRoot` path.

## Blockers

1. Merge PR for `feat/n2-arch-002-metadata`; then **N2-L01-GOLD-001** (or furigana decision).
