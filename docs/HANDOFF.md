# AI Handoff

## Last Updated

2026-09-15 (N2-ARCH-002 + N2-L01-UX-001 on `feat/n2-arch-002-metadata`)

## Project

Kotoba — Japanese Learning (`kotoba-learning`)  
Remote: https://github.com/Zapkadz/JLPT_Learning_Pro_Cursor.git

## Current Branch

`feat/n2-arch-002-metadata` (from `main` @ `15a77e0`) — contains **N2-ARCH-002** + **N2-L01-UX-001**

## Latest Relevant Commit

`main` / `origin/main`: `15a77e0` — Merge PR #1 (N2-ARCH-001).  
This branch: ARCH-002 + UX-001 (see HEAD after push).

## Current Objective

Commit/PR current branch. Next coding: **N2-L01-GOLD-001** (richer Lesson 1 examples).

## Current Phase

**Phase 1** — ARCH-002 + UX-001 **DONE** (uncommitted). Content still Lesson 1 only.

## Current Task

**N2-L01-UX-001** — **DONE**. Await commit; next **N2-L01-GOLD-001**.

## Last Completed Work

- Additive Zod metadata (variants / source.urls / exercise origin).  
- Removed Grammar UI hard-coded `lesson-01` CTA and back-link; pattern API returns lesson metadata.

## Current State

- 141/141 inventory mapped.  
- Published content: Lesson 1 only.  
- Unpublished lessons still show “Đang biên soạn” from manifest `published` flag.

## Verification State

| Check | State |
|-------|--------|
| `npm test` | **PASS** 14/14 after UX-001 |
| `lesson-01` in Grammar.tsx | **none** |

## Known Blockers

- Furigana on JA→VI practice — product decision still open.

## Exact Next Action

1. Merge PR for `feat/n2-arch-002-metadata` into `main`.  
2. Then **N2-L01-GOLD-001** — richer Lesson 1 theory/examples (revision bump if semantic).  
3. Do **not** import Lessons 2–26 JSON until content batches.

## Files To Read Before Continuing

1. `content/grammar/n2/lesson-01.json`  
2. `shared/grammar/types.ts`  
3. Master Requirement §11 (grammar detail / examples)  
4. `docs/requirements/GRAMMAR-N2-MASTER-REQUIREMENT.md`

## Safety Notes

- Do not remap L1 pattern IDs.  
- Do not hard-code 151→141.  
- Commit only when user asks.
