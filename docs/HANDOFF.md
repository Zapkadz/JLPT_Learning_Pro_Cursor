# AI Handoff

## Last Updated

2026-09-15 (N2-L01-PROG-001 on `feat/n2-l01-prog-001`)

## Project

Kotoba — Japanese Learning (`kotoba-learning`)  
Remote: https://github.com/Zapkadz/JLPT_Learning_Pro_Cursor.git

## Current Branch

`feat/n2-l01-prog-001` (from `main` @ `4ecf349` — Merge PR #4 GOLD-002)

## Latest Relevant Commit

`main` / `origin/main`: `4ecf349` — Merge PR #4 (N2-L01-GOLD-002).  
This branch: PROG-001 (uncommitted until user asks).

## Current Objective

**N2-L01-PROG-001** complete (verified). Await commit/PR. Next: **N2-L01-FURI-001** (needs product decision) or **N2-TEST-001**.

## Current Phase

**Phase 1** — Progress semantics **DONE** (uncommitted). Content still Lesson 1 only.

## Current Task

**N2-L01-PROG-001** — **DONE**. Await commit/push/PR.

## Last Completed Work

- PR #4 (GOLD-002) merged to `main`.  
- Course API: `progressDenominator = targetGroups` (141); `read`/`practiced` filtered to live pattern IDs (no orphan inflation; no row deletes).  
- UI metrics label denominator as course target; use `progressDenominator`.  
- Export includes `grammar.events`.  
- ADR-008 documents XP entity + denominator policy.  
- Tests: denominator contract, read≠XP, orphan filter, re-check≠double XP, export events.

## Current State

- 141/141 inventory mapped.  
- Published content: Lesson 1 only (5×30 exercises + 3 examples/group, rev 5).  
- Furigana on JA→VI practice — product decision still open.

## Verification State

| Check | State |
|-------|--------|
| `npm test` | **PASS** 14/14 after PROG-001 |
| Lesson revision | **5** |

## Known Blockers

- Furigana JA→VI practice policy (**N2-L01-FURI-001**) needs product decision.

## Exact Next Action

1. Commit (+ push/PR) `feat/n2-l01-prog-001` when user asks.  
2. Then **N2-TEST-001** (or **N2-L01-FURI-001** after furigana decision).  
3. Do **not** import Lessons 2–26 JSON until content batches.

## Files To Read Before Continuing

1. `server/modules/grammar/router.ts`  
2. `server/app.ts` (`/api/stats`, `/api/export`)  
3. `docs/DECISIONS.md` ADR-008  
4. Master Requirement §§38–42 if revisiting progress

## Safety Notes

- Do not remap L1 pattern IDs.  
- Do not hard-code 151→141.  
- Do not switch progress denominator to published-only without product decision.  
- Commit only when user asks.
