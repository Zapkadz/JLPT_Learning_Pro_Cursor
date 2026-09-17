# AI Handoff

## Last Updated

2026-09-17 (Kaiwa memory integration → next: KAI-001)

## Project

Kotoba — Japanese Learning (`kotoba-learning`)
Remote: https://github.com/Zapkadz/JLPT_Learning_Pro_Cursor.git

## Current Branch

`feat/kaiwa-memory` (memory/docs/rules integration).

## Latest Relevant Commit

See `git log -1` after push. Base: `main` @ `7b1e324` (PR #14 N2-L01-FURI-001 merged).

## Current Objective

**Kaiwa Studio** — full-video continuous dubbing (Gate A → Gate B).

## Current Phase

Design / risk validation (pre-implementation spikes).

## Current Task

**KAI-001** — integration / architecture / pilot-limits / privacy audit (see `docs/kaiwa/TASKS.md`).

## Last Completed Work

- Grammar N2: 26/141/4230 published; N2-FULL-ACC automated PASS; N2-L01-FURI-001 merged (PR #14); teacher review still PENDING.
- Kaiwa planning docs: DOC-001 / DOC-002 / DOC-003 DONE (`docs/kaiwa/`).
- Root project memory + autonomous workflow rules updated for Kaiwa (this session). Documentation completion ≠ product implementation.

## Current State

- Kaiwa application code: **not started** (no `src/features/kaiwa`, no `server/modules/kaiwa`).
- Gate A: not started. Gate B: not started. No Kaiwa feature accepted.
- Local WIP (unrelated, do not mix into Kaiwa commits unless fixing): grammar lesson `revision` bumps + `tests/grammar/grammar.test.ts` dirty in working tree.

## Verification State

| Check | State |
|-------|--------|
| Memory consistency audit | Pending until commit of this handoff |
| Kaiwa app tests | N/A (no app code yet) |

## Known Blockers

- None for KAI-001 (docs/audit task; no external API required).
- Grammar: independent teacher review still PENDING (does not block Kaiwa).

## Exact Next Action

Execute **KAI-001** according to `docs/kaiwa/TASKS.md` and `docs/kaiwa/IMPLEMENTATION-RULES.md` (integration-point survey + ADR candidates; no behaviour change to existing modules beyond documented decisions).

## Files To Read Before Continuing

1. `docs/kaiwa/PLAN.md`
2. `docs/kaiwa/TASKS.md`
3. `docs/kaiwa/IMPLEMENTATION-RULES.md`
4. `docs/DECISIONS.md`
5. Source files identified during the KAI-001 audit (`server/app.ts`, `server/schema.sql`, auth/nav/stats/backup, upload/middleware patterns).

## Safety Notes

- Do not start KAI-035 (character role-play) before Gate B.
- Do not invent Kaiwa as shipped.
- Do not stage unrelated grammar dirty files into Kaiwa commits.
- Do not commit secrets, user media, or local DB.
- Autonomous commit/push/continue after VERIFY PASS (see `.cursor/rules/development-workflow.mdc`).
