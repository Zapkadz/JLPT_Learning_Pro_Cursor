# AI Handoff

## Last Updated

2026-09-15 (N2-ARCH-001 on `feat/n2-arch-001-loader`)

## Project

Kotoba — Japanese Learning (`kotoba-learning`)  
Remote: https://github.com/Zapkadz/JLPT_Learning_Pro_Cursor.git

## Current Branch

`feat/n2-arch-001-loader` (from `main` @ `6cdea59`)

## Latest Relevant Commit

See HEAD of this branch after merge; base `main` was `6cdea59`.

## Current Objective

N2-ARCH-001 complete. Next when approved: **N2-ARCH-002** (additive metadata via Zod) or commit/push this branch.

## Current Phase

**Phase 1** — N2-ARCH-001 **DONE** (multi-lesson loader).  
Content still Lesson 1 only; no L2–26 JSON imported.

## Current Task

**N2-ARCH-001** — **DONE**. Next: merge PR, then **N2-ARCH-002** or **N2-L01-UX-001**.

## Last Completed Work

- Multi-lesson loader in `server/modules/grammar/content.ts`: loads only `manifest.published` lessons; unpublished need no JSON file.  
- Router uses `getLesson` / `getPattern` / `allPatterns`.  
- Tests: unpublished `lesson-02` → 404; L1 regression kept.

## Current State

- 141/141 inventory mapped (MAP-002).  
- Published content: Lesson 1 only (5 groups / 150 exercises).  
- UI still hard-links Bài 01 in places (**N2-L01-UX-001** later).

## Verification State

| Check | State |
|-------|--------|
| `npm test` | **PASS** 13/13 after N2-ARCH-001 |

## Known Blockers

- Furigana on JA→VI practice — product decision still open.

## Exact Next Action

1. Merge PR for `feat/n2-arch-001-loader` into `main`.  
2. Then **N2-ARCH-002** (additive metadata) or **N2-L01-UX-001** if UI hardcoding should go sooner.  
3. Do **not** import Lessons 2–26 JSON until content batches.

## Files To Read Before Continuing

1. `server/modules/grammar/content.ts`  
2. `server/modules/grammar/router.ts`  
3. `tests/grammar/grammar.test.ts`  
4. `docs/requirements/GRAMMAR-N2-MASTER-REQUIREMENT.md`

## Safety Notes

- Do not remap L1 pattern IDs.  
- Do not hard-code 151→141.  
- Commit only when user asks.
