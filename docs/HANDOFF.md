# AI Handoff

## Last Updated

2026-09-16 (N2-TEST-001 PR #6)

## Project

Kotoba — Japanese Learning (`kotoba-learning`)  
Remote: https://github.com/Zapkadz/JLPT_Learning_Pro_Cursor.git

## Current Branch

`feat/n2-test-001` (from `main` @ `fd3387e` — Merge PR #5 PROG-001)

## Latest Relevant Commit

`main` / `origin/main`: `fd3387e` — Merge PR #5 (N2-L01-PROG-001).  
This branch: `1d04a9b` — test: add grammar Playwright journey and golden validators.  
PR: https://github.com/Zapkadz/JLPT_Learning_Pro_Cursor/pull/6

## Current Objective

**N2-TEST-001** complete (verified). Awaiting merge of PR #6. Next: user chooses **N2-L02-BATCH** (needs approval), **N2-L01-FURI-001** (needs decision), or fix legacy `app.spec`.

## Current Phase

**Phase 1** — Golden validators + grammar Playwright **DONE** (in PR). Content still Lesson 1 only.

## Current Task

**N2-TEST-001** — **DONE**. PR #6 open.

## Last Completed Work

- PR #5 (PROG-001) merged to `main`.  
- `tests/grammar.spec.ts` + Playwright `webServer` (temp DB).  
- Golden template unit validators renamed.  
- Commit `1d04a9b` pushed; PR #6 opened.

## Current State

- 141/141 inventory mapped.  
- Published content: Lesson 1 only (rev 5).  
- Furigana JA→VI practice policy still open.

## Verification State

| Check | State |
|-------|--------|
| `npm test` | **PASS** 14/14 |
| `playwright tests/grammar.spec.ts` | **PASS** 1/1 |
| full `test:e2e` | **FAIL** — legacy `app.spec` |

## Known Blockers

- Furigana JA→VI (**N2-L01-FURI-001**) needs product decision.  
- **N2-L02-BATCH** requires explicit user approval before lesson JSON import.

## Exact Next Action

1. Merge PR #6 (`feat/n2-test-001`).  
2. Then user decides: **N2-L02-BATCH** vs **N2-L01-FURI-001** vs fix `app.spec`.  
3. Do **not** import Lessons 2–26 JSON until approved.

## Files To Read Before Continuing

1. `tests/grammar.spec.ts`  
2. `playwright.config.ts`  
3. `docs/PLAN.md`  
4. Master Requirement §§63 / §71 if starting L02 or FURI

## Safety Notes

- Do not remap L1 pattern IDs.  
- Do not hard-code 151→141.  
- Do not import L2–26 content without approval.  
- Commit only when user asks.
