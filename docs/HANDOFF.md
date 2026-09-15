# AI Handoff

## Last Updated

2026-09-15 (N2-MAP-002 DONE 141/141)

## Project

Kotoba — Japanese Learning (`kotoba-learning`)  
Remote: https://github.com/Zapkadz/JLPT_Learning_Pro_Cursor.git

## Current Branch

`main` (tracks `origin/main`)

## Latest Relevant Commit

`c886a00` — `feat: complete N2-MAP-002 grammar inventory (141/141)`  
Branch ahead of `origin/main` by 1 (not pushed).

## Current Objective

N2-MAP-002 complete. Next coding task when approved: **N2-ARCH-001** (multi-lesson loader). Do not import L2–26 JSON until then.

## Current Phase

**Phase 1** — N2-MAP-002 **DONE** (141/141 mapped).  
N2-ARCH-001 **not started** (needs user priority / approval for coding tasks per PLAN phase gate).

## Current Task

**N2-MAP-002** — **DONE**. Await user direction for **N2-ARCH-001**.

## Last Completed Work

- **N2-MAP-002 L21–26:** 36 groups — L22–26 from 3A TOC; L21 from Quizlet/mylittlewordland (3A site jumps 20→22); TNĐG URLs.  
- Prior batches: L16–20 (28), L11–15 (27), L6–10 (24), L2–5 (21), L1 (5).

## Current State

- **141/141** groups with titles + TNĐG URLs.  
- Content still only Lesson 1 imported (5 groups / 150 exercises).  
- partial-match: `l04-g05`, `l04-g06`, `l13-g02`, `l13-g05`, `l18-g03`, `l23-g06`, `l26-g02`.

## Verification State

| Check | State |
|-------|--------|
| `npm test` | **PASS** 12/12 after MAP-002 L21–26 |

## Known Blockers

- PLAN phase gate: N2-* coding (ARCH) needs explicit user approval.  
- Furigana on JA→VI practice — product decision still open.

## Exact Next Action

Ask user / wait for approval to start **N2-ARCH-001** (multi-lesson content loader). Do **not** import lesson JSON before that.

## Files To Read Before Continuing

1. `content/grammar/n2/inventory.json`  
2. `docs/grammar-n2/SOURCE-MAPPING.md`  
3. `server/modules/grammar/content.ts` (for ARCH-001)  
4. `docs/requirements/GRAMMAR-N2-MASTER-REQUIREMENT.md`

## Safety Notes

- Do not remap L1 pattern IDs.  
- Do not hard-code 151→141.  
- Commit only when user asks.
