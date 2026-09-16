# AI Handoff

## Last Updated

2026-09-16 (N2-L11-BATCH PR #10)

## Project

Kotoba — Japanese Learning (`kotoba-learning`)  
Remote: https://github.com/Zapkadz/JLPT_Learning_Pro_Cursor.git

## Current Branch

`feat/n2-l11-batch` @ `7cefe8f` — PR #10 open.

## Latest Relevant Commit

`feat/n2-l11-batch` @ `7cefe8f` — Lessons 11–15.  
PR: https://github.com/Zapkadz/JLPT_Learning_Pro_Cursor/pull/10  
`main` still at `63cc9c8` until merge.

## Current Objective

**N2-L11-BATCH** — PR #10 open. After merge → **N2-L16-BATCH** (needs approval).

## Current Phase

**Phase 1+** — Lessons 1–15 on feature branch / PR. L16–26 unpublished.

## Current Task

Await merge of PR #10; then start **N2-L16-BATCH** only with approval.

## Last Completed Work

- Authored Lessons 11–15: 27 groups × 30 = **810** exercises (+ 3 examples/group).  
- Commit `7cefe8f`; PR #10 opened.  
- Tests: 15 lessons / 77 patterns / 2310 exercises; `npm test` 15/15.

## Current State

- Published lessons: **15** (L1–L15) on PR branch.  
- Published groups: **77** / target 141.  
- Published exercises: **2310** / target 4230.  
- Furigana JA→VI practice policy still open (**N2-L01-FURI-001**).

## Verification State

| Check | State |
|-------|--------|
| `npm test` | **15/15 pass** |
| Commit | `7cefe8f` |
| PR | **#10 open** |

## Known Blockers

- Furigana JA→VI (**N2-L01-FURI-001**) needs product decision.  
- L11–15 content still `agent_reviewed` only (not teacher-verified).

## Exact Next Action

1. Merge PR #10 when ready.  
2. Start **N2-L16-BATCH** (Lessons 16–20) only with user approval.  
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
