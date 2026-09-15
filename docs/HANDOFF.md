# AI Handoff

## Last Updated

2026-09-15 (N2-TEST-001 on `feat/n2-test-001`)

## Project

Kotoba — Japanese Learning (`kotoba-learning`)  
Remote: https://github.com/Zapkadz/JLPT_Learning_Pro_Cursor.git

## Current Branch

`feat/n2-test-001` (from `main` @ `fd3387e` — Merge PR #5 PROG-001)

## Latest Relevant Commit

`main` / `origin/main`: `fd3387e` — Merge PR #5 (N2-L01-PROG-001).  
This branch: TEST-001 (uncommitted until user asks).

## Current Objective

**N2-TEST-001** complete (verified for grammar scope). Await commit/PR. Next milestone gate: **N2-L02-BATCH** needs user approval before lesson JSON import. **N2-L01-FURI-001** still needs product decision.

## Current Phase

**Phase 1** — Golden validators + representative grammar Playwright **DONE** (uncommitted). Content still Lesson 1 only.

## Current Task

**N2-TEST-001** — **DONE**. Await commit/push/PR.

## Last Completed Work

- PR #5 (PROG-001) merged to `main`.  
- Renamed/locked Lesson 1 golden template unit validators.  
- Added `tests/grammar.spec.ts` representative journey (lesson → pattern → furigana/read → VI/JA/order check → reload → SRS).  
- Playwright `webServer` starts `npm run dev` with temp `DB_PATH` when `CI=1`.  
- Verification: `npm test` 14/14; `npx playwright test tests/grammar.spec.ts` **1 passed**.  
- Note: legacy `tests/app.spec.ts` fails under new webServer/temp DB (pre-existing quiz journey; not required for TEST-001 acceptance).

## Current State

- 141/141 inventory mapped.  
- Published content: Lesson 1 only.  
- Furigana JA→VI practice policy still open.

## Verification State

| Check | State |
|-------|--------|
| `npm test` | **PASS** 14/14 |
| `playwright tests/grammar.spec.ts` | **PASS** 1/1 |
| `playwright` full (`app.spec` + grammar) | **FAIL** — `app.spec` result-summary step |

## Known Blockers

- Furigana JA→VI (**N2-L01-FURI-001**) needs product decision.  
- **N2-L02-BATCH** requires explicit user approval (PLAN phase gate + no lesson JSON import yet).

## Exact Next Action

1. Commit (+ push/PR) `feat/n2-test-001` when user asks.  
2. After merge: user decides **N2-L02-BATCH** vs **N2-L01-FURI-001** vs fix legacy `app.spec`.  
3. Do **not** import Lessons 2–26 JSON until approved.

## Files To Read Before Continuing

1. `tests/grammar.spec.ts`  
2. `tests/grammar/grammar.test.ts`  
3. `playwright.config.ts`  
4. `docs/PLAN.md`

## Safety Notes

- Do not remap L1 pattern IDs.  
- Do not hard-code 151→141.  
- Do not import L2–26 content without approval.  
- Commit only when user asks.
