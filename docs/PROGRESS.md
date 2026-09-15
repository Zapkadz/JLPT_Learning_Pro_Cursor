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
- **N2-L01-GOLD-001 DONE** (2026-09-15) — Lesson 1 examples enriched (3/group), variants/urls filled, revision 4; merged PR #3.  
- **N2-L01-GOLD-002 DONE** (2026-09-15) — all 150 L1 exercises `origin: authored`; hint≠answer validators; revision 5; merged PR #4.  
- **N2-L01-PROG-001 DONE** (2026-09-15) — progress denominator + XP policy locked (ADR-008); merged PR #5.  
- **N2-TEST-001 DONE** (2026-09-15/16) — golden validators + grammar Playwright; merged PR #6.  
- **N2-E2E-001 DONE** (2026-09-16) — legacy `app.spec` fixed; full e2e 2/2; merged PR #7.  
- **N2-L02-BATCH DONE** (2026-09-16) — Lessons 2–5 published (21×30 = 630 exercises).  
- Persistent project memory files: **established** (MEM-001 DONE).  
- Git: **AVAILABLE** — `main` @ PR #7; L02-BATCH on `feat/n2-l02-batch`.

## TARGET vs ACTUAL (Grammar N2)

| Metric | TARGET | ACTUAL (re-verified 2026-09-16 after N2-L02-BATCH) |
|--------|--------|-----------------------------------------------|
| Lessons in manifest | 26 | 26 rows in `manifest.json` |
| Lessons published / learnable | 26 | **5** (`lesson-01`…`lesson-05`) |
| Canonical groups | 141 | Manifest `sum(groupCount)=141`; **implemented content: 26** |
| Exercises | 4230 | **780** (L1 150 + L2–5 630) |
| Learning examples (published) | richer set | **3 per group** |
| TNĐG URLs | 141 mapped | **DONE** — 7 partial-match rows (see below) |
| Independent teacher review | desired | **Not done** (`agent_reviewed` only) |

Lesson 1 pattern IDs: `sai`, `saishite`, `totan`, `omouto`, `kanai` (rev **5**).  
Lessons 2–5 IDs: `l02-g01`…`l05-g04` (rev **1**).

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

### N2-L02-BATCH (2026-09-16) — DONE

- Authored + published Lessons 2–5: 21 groups × 30 exercises = **630** (plus 3 examples/group).  
- Files: `lesson-02.json`…`lesson-05.json`; manifest `published: true`; inventory `imported` / `agent_reviewed`.  
- Generators: `scripts/gen-n2-l02-batch.mjs`, `scripts/n2-batch/*`, `scripts/fix-overlaps.mjs` (dedupe example↔practice).  
- UI/API: lesson payload includes `number`/`title`; Grammar lesson/exercise eyebrows no longer hard-code Bài 01.  
- Tests: multi-lesson loader (5 published / 26 patterns); L2–5 golden DoD; course counts 26/780; revisions snapshot 26.  
- Branch: `feat/n2-l02-batch` (uncommitted until user asks).  
- Verification: `npm test` **15/15 pass**.  
- Note: still `agent_reviewed` only — not teacher-verified; target 4230 not complete.

### N2-E2E-001 (2026-09-16) — DONE

- Root cause: unfinished quiz answers opened “Nộp bài còn câu trống?” modal; spec never reached `.result-summary`.  
- Fixed `tests/app.spec.ts`: wait for `.answer.selected`, submit via `.quiz-controls`, handle confirm modal, use 5-question quiz.  
- Branch: `feat/fix-app-spec-e2e` @ `5ce2bde`; PR https://github.com/Zapkadz/JLPT_Learning_Pro_Cursor/pull/7.  
- Verification: `npm run test:e2e` **2/2 pass**.

### N2-TEST-001 (2026-09-15) — DONE

- Renamed Lesson 1 coverage test to golden template validators (examples / 10+10+10 / origin / hints).  
- Added `tests/grammar.spec.ts`: register → grammar course → lesson 1 → pattern → furigana + read → one exercise each mode → reload preserves 3/30 → SRS.  
- `playwright.config.ts`: `webServer` runs `npm run dev` with temp `DB_PATH` when CI.  
- Branch: `feat/n2-test-001` @ `1d04a9b`; PR https://github.com/Zapkadz/JLPT_Learning_Pro_Cursor/pull/6.  
- Verification: `npm test` **14/14**; `npx playwright test tests/grammar.spec.ts` **1 passed** (~6.6s).  
- Known: full `npm run test:e2e` still fails on legacy `tests/app.spec.ts` (quiz `.result-summary`); out of TEST-001 grammar scope.

### N2-L01-PROG-001 (2026-09-15) — DONE

- Course API exposes `progressDenominator` (= `targetGroups` 141, not `publishedGroups`).  
- `read` / `practiced` count only live published pattern IDs (orphan rows ignored; not deleted).  
- UI metrics use `progressDenominator` and label “mục tiêu khóa”.  
- `/api/export` includes `grammar.events` (XP/heatmap source).  
- ADR-008 documents denominator + `grammar:{patternId}` XP entity + no-reset on revision.  
- Tests: denominator contract; mark-read ≠ XP; orphan filter; re-check ≠ double XP; export events.  
- Branch: `feat/n2-l01-prog-001` @ `a3c171d`; PR https://github.com/Zapkadz/JLPT_Learning_Pro_Cursor/pull/5.  
- Verification: `npm test` **14/14 pass**.

### N2-L01-GOLD-002 (2026-09-15) — DONE

- Tagged all 150 Lesson 1 exercises with `origin: "authored"` + `sourceNote: "Lesson 1 pilot authored"`.  
- Bumped lesson/pattern revision **4 → 5**; updated provenance note.  
- Strengthened coverage validators: origin required; hints must not equal or contain full answers; public DTO strips origin/sourceNote.  
- QA audit: 0 hint↔answer leaks; short form hints (`Nの ＋ 際`) kept as structural cues.  
- Branch: `feat/n2-l01-gold-002` @ `4ab81a2`; PR https://github.com/Zapkadz/JLPT_Learning_Pro_Cursor/pull/4.  
- Verification: `npm test` **14/14 pass**.

### N2-L01-GOLD-001 (2026-09-15) — DONE

- Enriched Lesson 1 learning examples to **3 per group** with structured ruby.  
- Filled `variants` + `source.urls` from inventory; bumped lesson/pattern revision **3 → 4**.  
- UI: show variants on pattern detail.  
- Tests: ≥3 examples, no exact overlap with practice prompts/answers, ruby text joins to `ja`.  
- Merged via PR #3 into `main` (`a1a7bcb`).

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
| 2026-09-16 | N2-L02-BATCH Lessons 2–5 publish | **15/15 pass** | `npm test` |
| 2026-09-16 | N2-E2E-001 fix legacy app.spec | **2/2 pass** | `npm run test:e2e` |
| 2026-09-15 | N2-TEST-001 golden validators + grammar Playwright | **14/14** unit; grammar e2e **1/1** | `npm test`; `playwright test tests/grammar.spec.ts` |
| 2026-09-15 | N2-L01-PROG-001 progress denominator + XP export | **14/14 pass** | `npm test` |
| 2026-09-15 | N2-L01-GOLD-002 origin + hint validators + rev 5 | **14/14 pass** | `npm test` |
| 2026-09-15 | N2-L01-GOLD-001 examples/variants + rev 4 | **14/14 pass** | `npm test` (re-verified) |
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

- Furigana on JA→VI practice (**N2-L01-FURI-001** — needs decision).  
- Lessons 6–26 content import (**N2-L06-BATCH**+ — needs approval).  
- Commit/PR for `feat/n2-l02-batch` (awaiting user ask).

## Known Issues

- Dual trackers: `docs/grammar-n2/*` (history) vs root PLAN/PROGRESS (active).  
- UX-CONTRACT cites `server/index.ts` for CRUD; implementation is `server/app.ts`.  
- `premium-audit.json` stale `projectRoot` path.  
- L2–5 learning examples may use simplified single-span ruby after overlap fixes in some regenerated paths — structured ruby preferred on re-author.

## Blockers

1. Furigana JA→VI policy decision blocks **N2-L01-FURI-001**.  
2. Explicit approval required before **N2-L06-BATCH** lesson JSON import.
