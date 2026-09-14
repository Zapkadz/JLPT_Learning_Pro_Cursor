# AI Handoff

## Last Updated

2026-09-14 (git initialized + pushed to GitHub)

## Project

Kotoba — Japanese Learning (`kotoba-learning`)  
Workspace path note: `JLPT_Learning Pro - Copy`  
Remote: https://github.com/Zapkadz/JLPT_Learning_Pro_Cursor.git

## Current Branch

`main` (tracks `origin/main`)

## Latest Relevant Commit

`ddae70d` — `docs: sync HANDOFF with pushed commits and clear git blocker`  
Prior: `5d43ea8` (git remote notes), `0c7012e` (initial import)

## Current Objective

Await user approval, then execute Grammar N2 plan against `docs/requirements/GRAMMAR-N2-MASTER-REQUIREMENT.md`.

## Current Phase

**M-MEM complete.** **N2-GIT-000 complete.** Next: Grammar N2 Phase 0/1 **after user approval**.  
Grammar N2 coding phase: **not started**.

## Current Task

`No active implementation task confirmed.`

Next queued (not started): **N2-AUDIT-001** after user approves N2 implementation work.

## Last Completed Work

- Repository context audit; Grammar N2 Master Requirement analysis + plan (no feature code).  
- Metrics verified: L1 = 5×30 / 10+10+10; manifest 26 / 141 sum.  
- `npm test`: **11/11 pass** (2026-09-14).  
- **MEM-001 DONE:** root project memory docs + `project-memory.mdc` rule.  
- **N2-GIT-000 DONE:** git init, push to `origin/main` on GitHub.

## Current State

- Core learning app operational in codebase.  
- Grammar N2 Lesson 1 published; lessons 2–26 unpublished placeholders in manifest.  
- Master Requirement is formal SoT for N2 scope.  
- Proposed next engineering tasks listed in `docs/PLAN.md` (N2-AUDIT-001 onward) but **not authorized to code yet**.

## Important Findings

- **151 samples:** Not shown by current Kotoba UI code; comes from NhatKanji reference counts in older `docs/grammar-n2/PLAN.md`. Kotoba uses **141**.  
- **Scale:** Content loader hardcodes `lesson-01.json`; must generalize before publishing more lessons.  
- **IDs:** Lesson 1 pattern IDs are short strings (`sai`, …); remapping would break progress/SRS — preserve unless approved migration.  
- **Learning examples:** Only **1** example per L1 pattern (Master suggests richer set for golden template).  
- **Furigana:** Present on learning-example ruby; JA→VI practice prompts are plain Japanese (no structured furigana).  
- **SOURCE-MAPPING.md:** Missing.

## Important Decisions

See `docs/DECISIONS.md` (ADR-001 …). Summary:

- Reuse architecture; do not rebuild Grammar module.  
- Canonical structure = Shinkanzen 26/141; content primary source per Master = Tiếng Nhật Đơn Giản; UX reference = NhatKanji (function only).  
- Translation grading stays non-binary wrong.  
- Targets ≠ completed counts.  
- Repository (not chat) is long-term memory.

## Verification State

| Check | State |
|-------|--------|
| `npm test` | **PASS** (11/11) — 2026-09-14 |
| `npm run build` | **NOT RUN** this session |
| `npm run test:e2e` | **NOT RUN** this session |
| `npm run format:check` | **NOT RUN** this session |
| Data validation (L1 counts) | **PASS** via content JSON inspection |
| Docker | **NOT RUN** (historically unused in prior notes) |

## Known Blockers

- Awaiting user approval before Grammar N2 implementation.  
- Unresolved product decisions: practice furigana scope; commit-only-when-asked vs workflow auto-commit — follow latest user instruction.

## Exact Next Action

1. User: confirm whether to **approve Grammar N2 implementation**.  
2. If approved: execute **N2-AUDIT-001** then **N2-MAP-001** per `docs/PLAN.md`.  
3. Do **not** author Lessons 2–26 or change app business logic until that approval.  
4. New AI sessions: run `docs/AI-BOOTSTRAP.md` and stop at `CONTEXT RESTORED — READY TO CONTINUE`.

## Files To Read Before Continuing

1. `docs/AI-BOOTSTRAP.md` (procedure)  
2. `docs/HANDOFF.md` (this file)  
3. `docs/PLAN.md`  
4. `docs/PROGRESS.md`  
5. `docs/PROJECT-CONTEXT.md`  
6. `docs/DECISIONS.md`  
7. `docs/requirements/GRAMMAR-N2-MASTER-REQUIREMENT.md` (before any N2 coding)  
8. `docs/grammar-n2/IMPLEMENTATION-RULES.md`  
9. For N2 work: `content/grammar/n2/*`, `server/modules/grammar/*`, `src/features/grammar/Grammar.tsx`, `tests/grammar/grammar.test.ts`  
10. `.cursor/rules/project-memory.mdc` + `development-workflow.mdc` + Karpathy guidelines  

## Safety Notes

- Do not reset user SQLite data or remap grammar IDs.  
- Do not expose answers to the client.  
- Do not report 141/4230 as done.  
- Do not start N2 feature coding without user approval.  
- Do not discard unrelated user changes.  
- Do not invent git commits/branches.  
- Prefer updating these docs after every verified logical task.
