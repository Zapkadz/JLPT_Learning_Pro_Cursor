# PROGRESS — factual completion log

Last updated: 2026-09-14  
Rule: **never** write targets as completed counts.

## Current Status

- Product core (auth, decks, FSRS review, kana, JLPT practice, stats/export): **shipped in repo** (see README).  
- Grammar N2 Lesson 1 pilot: **shipped** (5 groups / 150 exercises, `agent_reviewed`).  
- Grammar N2 Master Requirement: **present**; implementation plan analyzed; **coding not started** pending user approval.  
- Persistent project memory files: **established** (MEM-001 DONE).  
- Git: **AVAILABLE** — `main` → `origin/main` (`https://github.com/Zapkadz/JLPT_Learning_Pro_Cursor.git`).

## TARGET vs ACTUAL (Grammar N2)

| Metric | TARGET | ACTUAL (verified 2026-09-14 from content JSON) |
|--------|--------|-----------------------------------------------|
| Lessons in manifest | 26 | 26 rows in `manifest.json` |
| Lessons published / learnable | 26 | **1** (`lesson-01` published) |
| Canonical groups | 141 | Manifest `sum(groupCount)=141`; **implemented content: 5** |
| Exercises | 4230 | **150** validated in `lesson-01.json` (5×30; 50+50+50 modes) |
| SOURCE-MAPPING.md | 141 mapped | **MISSING** |
| Independent teacher review | desired | **Not done** (`agent_reviewed` only) |

Lesson 1 pattern IDs: `sai`, `saishite`, `totan`, `omouto`, `kanai`. Content revision: **3**.

## Completed Work (evidence-based)

### Core product 1.0 (pre-existing)

Result: Local full-stack app as described in `README.md`, `DESIGN.md`, `docs/PRODUCT.md`.  
Important areas: `src/`, `server/app.ts`, `shared/domain.ts`, `tests/api.test.ts`, `tests/app.spec.ts`.  
Verification: see Verification History (re-run 2026-09-14 unit/API/grammar).

### Grammar N2 Lesson 1 pilot (documented 2026-09-13 in `docs/grammar-n2/PROGRESS.md`)

| Legacy ID | Result |
|-----------|--------|
| G04–G10 | Lesson 1 content, API, UI, practice modes, progress/SRS/export, acceptance for pilot scope |

Important files: `content/grammar/n2/*`, `server/modules/grammar/*`, `shared/grammar/types.ts`, `src/features/grammar/*`, `tests/grammar/grammar.test.ts`.

### Audit / planning (2026-09-14, conversation + repo read; no app code changes)

- Read Master Requirement; compared to implementation.  
- Confirmed L1 **5×30** and **10/10/10** per group; **0** learning↔practice exact overlap in current JSON.  
- **151 vs 141:** Kotoba UI/API use **141** (`targetGroups`). **151** is the NhatKanji reference site count recorded in `docs/grammar-n2/PLAN.md` — not a Kotoba displayed total in current source.  
- Proposed implementation task IDs (N2-*) captured in `docs/PLAN.md`; **awaiting user approval to implement**.

### MEM-001 (2026-09-14) — DONE

Created/updated: `docs/PROJECT-CONTEXT.md`, `docs/PLAN.md`, `docs/PROGRESS.md`, `docs/HANDOFF.md`, `docs/DECISIONS.md`, `docs/AI-BOOTSTRAP.md`, `.cursor/rules/project-memory.mdc`; pointers in `docs/grammar-n2/PLAN.md` + `PROGRESS.md`.  
No application business logic changes.

## Verification History

| When | What | Result | Evidence |
|------|------|--------|----------|
| 2026-09-14 | `npm test` | **11/11 pass** | Local run this session |
| 2026-09-14 | Content metric script on `manifest.json` + `lesson-01.json` | 26 / 141 sum / 5 patterns / 150 ex | Node one-liner |
| 2026-09-14 | `npm run build` | **NOT RUN** this session | — |
| 2026-09-14 | `npm run test:e2e` | **NOT RUN** this session | — |
| 2026-09-14 | `npm run format:check` | **NOT RUN** this session | — |
| 2026-09-13 | Documented in grammar-n2 PROGRESS: test/build/format/browser/backup | Claimed pass (historical) | `docs/grammar-n2/PROGRESS.md`, screenshots under `docs/grammar-n2/` |

## Known Incomplete Work

- Full Grammar N2 content (lessons 2–26).  
- SOURCE-MAPPING for 141 groups.  
- Multi-lesson loader (hardcoded Lesson 1).  
- Lesson 1 golden-template polish vs Master Requirement (examples depth, metadata, optional practice furigana).  
- Root `docs/PLAN.md` / memory system (in progress).  
- Git initialization for this copy.

## Known Issues

- Workspace is **not a git repository** — commit/push/handoff-by-commit hash unavailable.  
- Dual trackers: `docs/grammar-n2/PROGRESS.md` (module history) vs root `docs/PROGRESS.md` (canonical going forward) — prefer root for *current* status.  
- UX-CONTRACT still cites `server/index.ts` for CRUD ownership; implementation is `server/app.ts`.  
- `premium-audit.json` references another projectRoot path (`C:\JLPT_Learning Pro`) — stale metadata, not app runtime.

## Blockers

1. **User approval** — Grammar N2 implementation tasks must not start until approved.  
2. **Open product decisions** (from plan): furigana on JA→VI practice; confirm keep L1 pattern IDs; commit-only-when-asked vs auto-commit workflow — follow **latest user instruction**.

### N2-GIT-000 (2026-09-14) — DONE

Initialized git, initial commit `0c7012e`, pushed to `origin/main`.
