# AI Handoff

## Last Updated

2026-09-16 (N2-L02-BATCH on `feat/n2-l02-batch`)

## Project

Kotoba — Japanese Learning (`kotoba-learning`)  
Remote: https://github.com/Zapkadz/JLPT_Learning_Pro_Cursor.git

## Current Branch

`feat/n2-l02-batch` (from `main` @ `da945b3` — Merge PR #7)

## Latest Relevant Commit

`main` / `origin/main`: `da945b3` — Merge PR #7 (N2-E2E-001).  
This branch: L02-BATCH content (uncommitted until user asks).

## Current Objective

**N2-L02-BATCH** complete (verified). Await commit/PR. Next: **N2-L06-BATCH** (needs approval) or **N2-L01-FURI-001** (needs decision).

## Current Phase

**Phase 1+** — Lessons 1–5 published. Content still not full course (L6–26 unpublished).

## Current Task

**N2-L02-BATCH** — **DONE**. Await commit/push/PR.

## Last Completed Work

- PR #7 merged.  
- Published `lesson-02`…`lesson-05` (21 groups / 630 exercises, rev 1, `agent_reviewed`).  
- Manifest published L2–5; inventory `imported` for those 21 IDs.  
- Lesson API returns `number`/`title`; Grammar UI no longer hard-codes Bài 01 eyebrow.  
- Generators under `scripts/` (+ `fix-overlaps.mjs`).  
- Verification: `npm test` **15/15**.

## Current State

- Published lessons: **5** (L1–L5).  
- Published groups: **26** / target 141.  
- Published exercises: **780** / target 4230.  
- Furigana JA→VI practice policy still open.

## Verification State

| Check | State |
|-------|--------|
| `npm test` | **PASS** 15/15 |
| L1 revision | **5** |
| L2–5 revision | **1** |

## Known Blockers

- Furigana JA→VI (**N2-L01-FURI-001**) needs product decision.  
- **N2-L06-BATCH** requires explicit approval before more lesson JSON.

## Exact Next Action

1. Commit (+ push/PR) `feat/n2-l02-batch` when user asks.  
2. After merge: user chooses **N2-L06-BATCH** vs **N2-L01-FURI-001**.  
3. Do **not** import Lessons 6–26 until approved.

## Files To Read Before Continuing

1. `content/grammar/n2/lesson-02.json` (sample)  
2. `scripts/gen-n2-l02-batch.mjs`  
3. `tests/grammar/grammar.test.ts`  
4. Master §71 if starting L06

## Safety Notes

- Do not remap L1 pattern IDs (`sai`, …).  
- Do not hard-code 151→141.  
- Do not treat 4230 as completed.  
- Commit only when user asks.
