# AI Handoff

## Last Updated

2026-09-16 (N2-L06-BATCH authored on `feat/n2-l06-batch`)

## Project

Kotoba — Japanese Learning (`kotoba-learning`)  
Remote: https://github.com/Zapkadz/JLPT_Learning_Pro_Cursor.git

## Current Branch

`feat/n2-l06-batch` (uncommitted) — N2-L06-BATCH Lessons 6–10 content.

## Latest Relevant Commit

`feat/n2-l06-batch` @ `4e312c1` — Lessons 6–10.  
PR: https://github.com/Zapkadz/JLPT_Learning_Pro_Cursor/pull/9  
`main` still at `962a4d6` until merge.

## Current Objective

**N2-L06-BATCH** — PR #9 open. After merge → **N2-L11-BATCH**.

## Current Phase

**Phase 1+** — Lessons 1–10 on feature branch / PR. L11–26 unpublished.

## Current Task

Await merge of PR #9; then start **N2-L11-BATCH**.

## Last Completed Work

- Authored Lessons 6–10: 24 groups × 30 = **720** exercises (+ 3 examples/group).  
- Commit `4e312c1`; PR #9 opened.  
- Tests: 10 lessons / 50 patterns / 1500 exercises; `npm test` 15/15; build OK.

## Current State

- Published lessons: **10** (L1–L10) on PR branch.  
- Published groups: **50** / target 141.  
- Published exercises: **1500** / target 4230.  
- Furigana JA→VI practice policy still open (**N2-L01-FURI-001**).

## Verification State

| Check | State |
|-------|--------|
| `npm test` | **15/15 pass** |
| `npm run build` | **OK** |
| Commit | `4e312c1` |
| PR | **#9 open** |

## Known Blockers

- Furigana JA→VI (**N2-L01-FURI-001**) needs product decision.  
- L6–10 content still `agent_reviewed` only (not teacher-verified).

## Exact Next Action

1. Merge PR #9 when ready.  
2. Start **N2-L11-BATCH** (Lessons 11–15) — user-approved.  
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
