# AI Handoff

## Last Updated

2026-09-16 (N2-L01-FURI-001 on `feat/n2-l01-furi-001`)

## Project

Kotoba — Japanese Learning (`kotoba-learning`)  
Remote: https://github.com/Zapkadz/JLPT_Learning_Pro_Cursor.git

## Current Branch

`feat/n2-l01-furi-001` — JA→VI optional furigana (ADR-009 policy B); uncommitted.

## Latest Relevant Commit

`main` / `origin/main`: `902e0f0` — Merge PR #13 (N2-FULL-ACC).  
This branch: FURI-001 implementation; **not committed** (per user).

## Current Objective

**N2-L01-FURI-001** — Policy B applied to all 26 lessons. Awaiting commit/PR.

## Current Phase

**Phase 1+** — 26/141/4230 on `main` + optional JA→VI furigana on this branch.

## Current Task

N2-L01-FURI-001 — **implementation complete**; verification **16/16**; commit pending user request.

## Last Completed Work

- Merged PR #13.  
- ADR-009: optional `promptRuby` on ja-vi; same toggle as learning examples.  
- Schema + public DTO + practice UI toggle.  
- Generated `promptRuby` for **1410** ja-vi exercises (`scripts/gen-n2-ja-vi-prompt-ruby.mjs` via Kuroshiro).  
- Tests: new FURI validator; `npm test` 16/16; build OK.

## Current State

- Published: **26 / 141 / 4230**.  
- JA→VI furigana: structured `promptRuby` (agent-generated readings).  
- Teacher review: still PENDING.  

## Verification State

| Check | State |
|-------|--------|
| `npm test` | **16/16 pass** |
| `npm run build` | **OK** |
| Commit / PR | **Not done** |

## Known Blockers

- Independent teacher review of readings/language.  

## Exact Next Action

1. Commit + PR for `feat/n2-l01-furi-001` (shipping).  
2. Do **not** claim teacher-verified furigana.

## Files To Read Before Continuing

1. `docs/DECISIONS.md` (ADR-009)  
2. `docs/PLAN.md`  
3. `shared/grammar/types.ts` (`promptRuby`)

## Safety Notes

- Do not embed furigana in raw `prompt`.  
- Do not remap L1 IDs / hard-code 151→141.  
- Commit only when user asks.
