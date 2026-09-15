# AI Handoff

## Last Updated

2026-09-16 (app.spec e2e fix on `feat/fix-app-spec-e2e`)

## Project

Kotoba — Japanese Learning (`kotoba-learning`)  
Remote: https://github.com/Zapkadz/JLPT_Learning_Pro_Cursor.git

## Current Branch

`feat/fix-app-spec-e2e` (from `main` @ `bcc1f4c` — Merge PR #6 TEST-001)

## Latest Relevant Commit

`main` / `origin/main`: `bcc1f4c` — Merge PR #6 (N2-TEST-001).  
This branch: app.spec e2e fix (uncommitted until user asks).

## Current Objective

Legacy full Playwright suite greened after PR #6 merge. Await commit/PR for this fix. Next product choice: **N2-L02-BATCH** (needs approval) or **N2-L01-FURI-001** (needs decision).

## Current Phase

**Phase 1** — Lesson 1 quality gate + e2e regression **DONE** (fix uncommitted). Content still Lesson 1 only.

## Current Task

**app.spec e2e fix** — **DONE** (verified). Await commit/push/PR.

## Last Completed Work

- PR #6 (TEST-001) merged to `main`.  
- Fixed `tests/app.spec.ts`: wait for selected answer; submit via quiz-controls; handle empty-answer confirm modal; use 5-question quiz.  
- Full `npm run test:e2e` **2/2 pass**.

## Current State

- 141/141 inventory mapped.  
- Published content: Lesson 1 only (rev 5).  
- Furigana JA→VI practice policy still open.

## Verification State

| Check | State |
|-------|--------|
| `npm run test:e2e` | **PASS** 2/2 |
| Lesson revision | **5** |

## Known Blockers

- Furigana JA→VI (**N2-L01-FURI-001**) needs product decision.  
- **N2-L02-BATCH** requires explicit user approval before lesson JSON import.

## Exact Next Action

1. Commit (+ push/PR) `feat/fix-app-spec-e2e` when user asks.  
2. After merge: user chooses **N2-L02-BATCH** (approval) vs **N2-L01-FURI-001** (decision).  
3. Do **not** import Lessons 2–26 JSON until approved.

## Files To Read Before Continuing

1. `tests/app.spec.ts`  
2. `docs/PLAN.md`  
3. Master Requirement §71 if starting L02  
4. Furigana sections if starting FURI

## Safety Notes

- Do not remap L1 pattern IDs.  
- Do not hard-code 151→141.  
- Do not import L2–26 content without approval.  
- Commit only when user asks.
