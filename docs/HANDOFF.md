# AI Handoff

## Last Updated

2026-09-16 (N2-E2E-001 PR #7)

## Project

Kotoba — Japanese Learning (`kotoba-learning`)  
Remote: https://github.com/Zapkadz/JLPT_Learning_Pro_Cursor.git

## Current Branch

`feat/fix-app-spec-e2e` (from `main` @ `bcc1f4c` — Merge PR #6 TEST-001)

## Latest Relevant Commit

`main` / `origin/main`: `bcc1f4c` — Merge PR #6 (N2-TEST-001).  
This branch: `5ce2bde` — test: fix legacy app.spec quiz submit under Playwright.  
PR: https://github.com/Zapkadz/JLPT_Learning_Pro_Cursor/pull/7

## Current Objective

**N2-E2E-001** complete (verified). Awaiting merge of PR #7. Next: user chooses **N2-L02-BATCH** (needs approval) or **N2-L01-FURI-001** (needs decision).

## Current Phase

**Phase 1** — Lesson 1 quality gate + e2e regression **DONE** (in PR). Content still Lesson 1 only.

## Current Task

**N2-E2E-001** — **DONE**. PR #7 open.

## Last Completed Work

- PR #6 (TEST-001) merged to `main`.  
- Fixed `tests/app.spec.ts` quiz submit / confirm modal flow.  
- Full `npm run test:e2e` **2/2 pass**.  
- Commit `5ce2bde` pushed; PR #7 opened.

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

1. Merge PR #7 (`feat/fix-app-spec-e2e`).  
2. Then user chooses **N2-L02-BATCH** (approval) vs **N2-L01-FURI-001** (decision).  
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
