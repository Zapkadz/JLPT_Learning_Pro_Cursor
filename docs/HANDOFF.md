# AI Handoff

## Last Updated

2026-09-15 (N2-L01-GOLD-002 on `feat/n2-l01-gold-002`)

## Project

Kotoba — Japanese Learning (`kotoba-learning`)  
Remote: https://github.com/Zapkadz/JLPT_Learning_Pro_Cursor.git

## Current Branch

`feat/n2-l01-gold-002` (from `main` @ `a1a7bcb` — Merge PR #3 GOLD-001)

## Latest Relevant Commit

`main` / `origin/main`: `a1a7bcb` — Merge PR #3 (N2-L01-GOLD-001).  
This branch: GOLD-002 content + validators (uncommitted until user asks).

## Current Objective

**N2-L01-GOLD-002** complete (verified). Await commit/PR, then next unfinished PLAN item (**N2-L01-PROG-001** or **N2-L01-FURI-001** after product decision).

## Current Phase

**Phase 1** — Lesson 1 exercise bank QA **DONE** (uncommitted). Content still Lesson 1 only.

## Current Task

**N2-L01-GOLD-002** — **DONE**. Await commit/push/PR.

## Last Completed Work

- PR #3 (GOLD-001) merged to `main`.  
- All 150 Lesson 1 exercises tagged `origin: "authored"` + `sourceNote`.  
- Lesson/pattern **revision 5**.  
- Validators: origin required; hints must not equal/contain full answers; public DTO still strips private fields.

## Current State

- 141/141 inventory mapped.  
- Published content: Lesson 1 only (5×30 exercises + 3 examples/group).  
- Furigana on JA→VI practice — product decision still open.

## Verification State

| Check | State |
|-------|--------|
| `npm test` | **PASS** 14/14 after GOLD-002 |
| Lesson revision | **5** |

## Known Blockers

- Furigana JA→VI practice policy (**N2-L01-FURI-001**) needs product decision.

## Exact Next Action

1. Commit (+ push/PR) `feat/n2-l01-gold-002` when user asks.  
2. Then **N2-L01-PROG-001** (progress semantics) — or **N2-L01-FURI-001** after decision.  
3. Do **not** import Lessons 2–26 JSON until content batches.

## Files To Read Before Continuing

1. `content/grammar/n2/lesson-01.json`  
2. `tests/grammar/grammar.test.ts`  
3. `docs/PLAN.md`  
4. Master Requirement progress / furigana sections if starting FURI/PROG

## Safety Notes

- Do not remap L1 pattern IDs.  
- Do not hard-code 151→141.  
- Commit only when user asks.
