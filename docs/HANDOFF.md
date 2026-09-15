# AI Handoff

## Last Updated

2026-09-16 (N2-L06-BATCH authored on `feat/n2-l06-batch`)

## Project

Kotoba — Japanese Learning (`kotoba-learning`)  
Remote: https://github.com/Zapkadz/JLPT_Learning_Pro_Cursor.git

## Current Branch

`feat/n2-l06-batch` (uncommitted) — N2-L06-BATCH Lessons 6–10 content.

## Latest Relevant Commit

`main` / `origin/main`: `962a4d6` — Merge PR #8 (Lessons 2–5).  
This branch: working tree has L6–10 import; **not committed** (per user).

## Current Objective

**N2-L06-BATCH** — Lessons 6–10 authored, published in content, tests green. Awaiting user commit / PR.

## Current Phase

**Phase 1+** — Lessons 1–10 published in content (on this branch). L11–26 unpublished.

## Current Task

N2-L06-BATCH — **implementation complete**; verification **15/15**; commit pending user request.

## Last Completed Work

- Authored Lessons 6–10: 24 groups × 30 = **720** exercises (+ 3 examples/group).  
- Generators: `scripts/gen-n2-l06-batch.mjs`, `scripts/n2-batch/lesson06.mjs`…`lesson10.mjs`.  
- Manifest published L6–10; inventory `imported` / `agent_reviewed` for 24 IDs.  
- Tests updated: 10 lessons / 50 patterns / 1500 exercises; DoD L2–10; unpublished = lesson-11.

## Current State

- Published lessons: **10** (L1–L10) on this branch.  
- Published groups: **50** / target 141.  
- Published exercises: **1500** / target 4230.  
- Furigana JA→VI practice policy still open (**N2-L01-FURI-001**).

## Verification State

| Check | State |
|-------|--------|
| `node scripts/gen-n2-l06-batch.mjs` | **OK** |
| `node scripts/fix-overlaps.mjs` | **OK** |
| `npm test` | **15/15 pass** |
| Commit / PR | **Not done** (user: do not commit) |

## Known Blockers

- Furigana JA→VI (**N2-L01-FURI-001**) needs product decision.  
- L6–10 content still `agent_reviewed` only (not teacher-verified).

## Exact Next Action

1. Commit + PR for `feat/n2-l06-batch` (in progress / awaiting merge).  
2. After merge: start **N2-L11-BATCH** (Lessons 11–15) — user-approved next.  
3. Do **not** import Lessons 16–26 until approved. FURI-001 still needs product decision.

## Files To Read Before Continuing

1. `docs/PLAN.md`  
2. `docs/PROGRESS.md` (N2-L06-BATCH entry)  
3. `content/grammar/n2/inventory.json` (L11+ still not-imported)  
4. Furigana sections if starting FURI

## Safety Notes

- Do not remap L1 pattern IDs (`sai`, …).  
- Do not hard-code 151→141.  
- Do not treat 4230 as completed.  
- Commit only when user asks.
