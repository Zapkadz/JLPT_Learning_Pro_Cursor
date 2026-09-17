# AI Handoff

## Last Updated

2026-09-16 (N2-L01-FURI-001 PR #14)

## Project

Kotoba — Japanese Learning (`kotoba-learning`)  
Remote: https://github.com/Zapkadz/JLPT_Learning_Pro_Cursor.git

## Current Branch

`feat/n2-l01-furi-001` @ `d9f1448` — PR #14 open.

## Latest Relevant Commit

`feat/n2-l01-furi-001` @ `d9f1448` — optional JA→VI furigana (ADR-009).  
PR: https://github.com/Zapkadz/JLPT_Learning_Pro_Cursor/pull/14  
`main` still at `902e0f0` until merge.

## Current Objective

**N2-L01-FURI-001** — PR #14 open. After merge: teacher review still open; no further FURI coding unless product asks.

## Current Phase

**Phase 1+** — 26/141/4230 on `main`; optional JA→VI furigana on PR branch.

## Current Task

Await merge of PR #14.

## Last Completed Work

- ADR-009 policy B; `promptRuby` on 1410 ja-vi; practice toggle; Kuroshiro generator.  
- Commit `d9f1448`; PR #14 opened.  
- `npm test` 16/16; build OK.

## Current State

- Published: **26 / 141 / 4230**.  
- JA→VI furigana: structured (agent readings).  
- Teacher review: PENDING.

## Verification State

| Check | State |
|-------|--------|
| `npm test` | **16/16 pass** |
| Commit | `d9f1448` |
| PR | **#14 open** |

## Known Blockers

- Independent teacher review of readings/language.

## Exact Next Action

1. Merge PR #14 when ready.  
2. Do **not** claim teacher-verified furigana.

## Files To Read Before Continuing

1. `docs/DECISIONS.md` (ADR-009)  
2. `docs/PLAN.md`  
3. `docs/PROGRESS.md`

## Safety Notes

- Do not embed furigana in raw `prompt`.  
- Do not remap L1 IDs / hard-code 151→141.  
- Commit only when user asks.
