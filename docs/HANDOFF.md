# AI Handoff

## Last Updated

2026-09-16 (N2-L16-BATCH on `feat/n2-l16-batch`)

## Project

Kotoba — Japanese Learning (`kotoba-learning`)  
Remote: https://github.com/Zapkadz/JLPT_Learning_Pro_Cursor.git

## Current Branch

`feat/n2-l16-batch` — N2-L16-BATCH Lessons 16–20 (uncommitted).  
Based on `origin/feat/n2-l11-batch` (`c3881ad`). **PR #10 merged** to `main` (`e7898f2`).

## Latest Relevant Commit

`main` / `origin/main`: `e7898f2` — Merge PR #10 (Lessons 11–15).  
This branch: L16–20 authored on top of L11; **not committed** (per user).

## Current Objective

**N2-L16-BATCH** — Lessons 16–20 authored, published in content, tests green. Awaiting user commit / PR.  
**Also:** PR #10 is merged to `main`.

## Current Phase

**Phase 1+** — Lessons 1–20 published in content (on this branch). L21–26 unpublished.

## Current Task

N2-L16-BATCH — **implementation complete**; verification **15/15**; commit pending user request.

## Last Completed Work

- Authored Lessons 16–20: 28 groups × 30 = **840** exercises (+ 3 examples/group).  
- Generators: `scripts/gen-n2-l16-batch.mjs`, `scripts/n2-batch/lesson16.mjs`…`lesson20.mjs`.  
- Manifest published L16–20; inventory `imported` / `agent_reviewed` for 28 IDs.  
- Tests: 20 lessons / 105 patterns / 3150 exercises; DoD L2–20; unpublished = lesson-21.

## Current State

- Published lessons: **20** (L1–L20) on this branch.  
- Published groups: **105** / target 141.  
- Published exercises: **3150** / target 4230.  
- Furigana JA→VI practice policy still open (**N2-L01-FURI-001**).

## Verification State

| Check | State |
|-------|--------|
| `node scripts/gen-n2-l16-batch.mjs` | **OK** |
| `node scripts/fix-overlaps.mjs` | **OK** |
| `npm test` | **15/15 pass** |
| `npm run build` | **OK** |
| Commit / PR | **Not done** (awaiting user) |
| PR #10 merge to main | **Merged** (`e7898f2`) |

## Known Blockers

- Furigana JA→VI (**N2-L01-FURI-001**) needs product decision.  
- L16–20 content still `agent_reviewed` only.

## Exact Next Action

1. Commit + PR for `feat/n2-l16-batch` (shipping).  
2. After merge: **N2-L21-BATCH** (Lessons 21–26) needs approval. Do not start until approved.

## Files To Read Before Continuing

1. `docs/PLAN.md`  
2. `docs/PROGRESS.md` (N2-L16-BATCH entry)  
3. `content/grammar/n2/inventory.json` (L21+ still not-imported)

## Safety Notes

- Do not remap L1 pattern IDs (`sai`, …).  
- Do not hard-code 151→141.  
- Do not treat 4230 as completed.  
- Commit only when user asks.
