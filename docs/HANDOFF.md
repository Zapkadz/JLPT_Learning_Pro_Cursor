# AI Handoff

## Last Updated

2026-09-16 (N2-L11-BATCH on `feat/n2-l11-batch`)

## Project

Kotoba — Japanese Learning (`kotoba-learning`)  
Remote: https://github.com/Zapkadz/JLPT_Learning_Pro_Cursor.git

## Current Branch

`feat/n2-l11-batch` — N2-L11-BATCH Lessons 11–15 content (uncommitted).

## Latest Relevant Commit

`main` / `origin/main`: `63cc9c8` — Merge PR #9 (Lessons 6–10).  
This branch: L11–15 authored; **not committed** (per user).

## Current Objective

**N2-L11-BATCH** — Lessons 11–15 authored, published in content, tests green. Awaiting user commit / PR.

## Current Phase

**Phase 1+** — Lessons 1–15 published in content (on this branch). L16–26 unpublished.

## Current Task

N2-L11-BATCH — **implementation complete**; verification **15/15**; commit pending user request.

## Last Completed Work

- Merged PR #9 into `main`.  
- Authored Lessons 11–15: 27 groups × 30 = **810** exercises (+ 3 examples/group).  
- Generators: `scripts/gen-n2-l11-batch.mjs`, `scripts/n2-batch/lesson11.mjs`…`lesson15.mjs`.  
- Manifest published L11–15; inventory `imported` / `agent_reviewed` for 27 IDs.  
- Tests: 15 lessons / 77 patterns / 2310 exercises; DoD L2–15; unpublished = lesson-16.

## Current State

- Published lessons: **15** (L1–L15) on this branch.  
- Published groups: **77** / target 141.  
- Published exercises: **2310** / target 4230.  
- Furigana JA→VI practice policy still open (**N2-L01-FURI-001**).

## Verification State

| Check | State |
|-------|--------|
| `node scripts/gen-n2-l11-batch.mjs` | **OK** |
| `node scripts/fix-overlaps.mjs` | **OK** |
| `npm test` | **15/15 pass** |
| `npm run build` | **OK** |
| Commit / PR | **Not done** (awaiting user) |

## Known Blockers

- Furigana JA→VI (**N2-L01-FURI-001**) needs product decision.  
- L11–15 content still `agent_reviewed` only (not teacher-verified).

## Exact Next Action

1. Commit + PR for `feat/n2-l11-batch` (shipping).  
2. After merge: start **N2-L16-BATCH** only with user approval.  
3. Do **not** import Lessons 16–26 until approved. FURI-001 still needs product decision.

## Files To Read Before Continuing

1. `docs/PLAN.md`  
2. `docs/PROGRESS.md` (N2-L11-BATCH entry)  
3. `content/grammar/n2/inventory.json` (L16+ still not-imported)  
4. Furigana sections if starting FURI

## Safety Notes

- Do not remap L1 pattern IDs (`sai`, …).  
- Do not hard-code 151→141.  
- Do not treat 4230 as completed.  
- Commit only when user asks.
