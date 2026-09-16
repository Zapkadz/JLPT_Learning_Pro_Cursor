# AI Handoff

## Last Updated

2026-09-16 (N2-L21-BATCH on `feat/n2-l21-batch`)

## Project

Kotoba — Japanese Learning (`kotoba-learning`)  
Remote: https://github.com/Zapkadz/JLPT_Learning_Pro_Cursor.git

## Current Branch

`feat/n2-l21-batch` — N2-L21-BATCH Lessons 21–26 (uncommitted).

## Latest Relevant Commit

`main` / `origin/main`: `80c6da9` — Merge PR #11 (Lessons 16–20).  
This branch: L21–26 authored; **not committed** (per user).

## Current Objective

**N2-L21-BATCH** — Lessons 21–26 authored, published in content, tests green. Awaiting user commit / PR.  
This completes published content scale: **26 / 141 / 4230** (still `agent_reviewed` only — not teacher FULL-ACC).

## Current Phase

**Phase 1+** — All 26 lessons published in content (on this branch).

## Current Task

N2-L21-BATCH — **implementation complete**; verification **15/15**; commit pending user request.

## Last Completed Work

- Merged PR #11 into `main`.  
- Authored Lessons 21–26: 36 groups × 30 = **1080** exercises (+ 3 examples/group).  
- Generators: `scripts/gen-n2-l21-batch.mjs`, `scripts/n2-batch/lesson21.mjs`…`lesson26.mjs`.  
- Manifest published L21–26; inventory `imported` / `agent_reviewed` for 36 IDs.  
- Tests: 26 lessons / 141 patterns / 4230 exercises; DoD L2–26.

## Current State

- Published lessons: **26** / target 26.  
- Published groups: **141** / target 141.  
- Published exercises: **4230** / target 4230.  
- Independent teacher review: **not done**.  
- Furigana JA→VI practice policy still open (**N2-L01-FURI-001**).  
- **N2-FULL-ACC** still TODO (teacher verification + §73 evidence).

## Verification State

| Check | State |
|-------|--------|
| `node scripts/gen-n2-l21-batch.mjs` | **OK** |
| `node scripts/fix-overlaps.mjs` | **OK** |
| `npm test` | **15/15 pass** |
| `npm run build` | **OK** |
| Commit / PR | **Not done** (awaiting user) |

## Known Blockers

- Furigana JA→VI (**N2-L01-FURI-001**) needs product decision.  
- Full-course teacher review still open (**N2-FULL-ACC**).

## Exact Next Action

1. Commit + PR for `feat/n2-l21-batch` (shipping).  
2. After merge: **N2-FULL-ACC** and/or **N2-L01-FURI-001** (need decisions).  
3. Do not declare teacher-verified completion.

## Files To Read Before Continuing

1. `docs/PLAN.md`  
2. `docs/PROGRESS.md` (N2-L21-BATCH entry)  
3. Master Requirement §73 for FULL-ACC

## Safety Notes

- Do not remap L1 pattern IDs (`sai`, …).  
- Do not hard-code 151→141.  
- Do not treat 4230 as teacher-verified complete.  
- Commit only when user asks.
