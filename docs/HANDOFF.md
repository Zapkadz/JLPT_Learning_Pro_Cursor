# AI Handoff

## Last Updated

2026-09-15 (N2-L01-GOLD-001 on `feat/n2-l01-gold-001`)

## Project

Kotoba — Japanese Learning (`kotoba-learning`)  
Remote: https://github.com/Zapkadz/JLPT_Learning_Pro_Cursor.git

## Current Branch

`feat/n2-l01-gold-001` (from `main` @ `953f2d5`)

## Latest Relevant Commit

`main` / `origin/main`: `953f2d5` — Merge PR #2 (ARCH-002 + UX-001).  
This branch: GOLD-001 (see HEAD after push).

## Current Objective

N2-L01-GOLD-001 complete (verified). Next: commit/PR this branch, then **N2-L01-GOLD-002** (exercise bank QA + origin).

## Current Phase

**Phase 1** — Lesson 1 golden examples **DONE** (uncommitted). Content still Lesson 1 only.

## Current Task

**N2-L01-GOLD-001** — **DONE**. Await commit; next **N2-L01-GOLD-002**.

## Last Completed Work

- PR #2 merged to `main`.  
- Lesson 1: 3 learning examples/group, `variants` + `source.urls` from inventory, pattern/lesson **revision 4**.  
- UI shows variants on pattern detail.  
- Tests assert ≥3 examples, no practice overlap, ruby joins to `ja`.

## Current State

- 141/141 inventory mapped.  
- Published content: Lesson 1 only (5×30 exercises + 3 examples/group).  
- Furigana on JA→VI practice — product decision still open.

## Verification State

| Check | State |
|-------|--------|
| `npm test` | **PASS** 14/14 after GOLD-001 (re-verified this session) |
| Lesson revision | **4** |

## Known Blockers

- Furigana JA→VI practice policy (**N2-L01-FURI-001**) needs product decision.

## Exact Next Action

1. Merge PR for `feat/n2-l01-gold-001` into `main`.  
2. Then **N2-L01-GOLD-002** — exercise bank QA (substantive 10/10/10 + `origin` metadata).  
3. Do **not** import Lessons 2–26 JSON until content batches.

## Files To Read Before Continuing

1. `content/grammar/n2/lesson-01.json`  
2. `tests/grammar/grammar.test.ts`  
3. Master Requirement §§29–34 (exercise origin / validation)  
4. `docs/requirements/GRAMMAR-N2-MASTER-REQUIREMENT.md`

## Safety Notes

- Do not remap L1 pattern IDs.  
- Do not hard-code 151→141.  
- Commit only when user asks.
