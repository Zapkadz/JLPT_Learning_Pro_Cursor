# AI Handoff

## Last Updated

2026-09-17 (KAI-001 DONE → next: KAI-002)

## Project

Kotoba — Japanese Learning (`kotoba-learning`)
Remote: https://github.com/Zapkadz/JLPT_Learning_Pro_Cursor.git

## Current Branch

`feat/kaiwa-memory` (Kaiwa docs + KAI-001 audit; no Kaiwa app runtime yet).

## Latest Relevant Commit

See `git log -1` after push. Prior: `8391ada` KAI-MEM-001.

## Current Objective

**Kaiwa Studio** — Gate A → Gate B (full-video continuous dubbing first).

## Current Phase

Design / risk validation — capture spike.

## Current Task

**KAI-002** — continuous capture spike (codec, mic, video clock, latency, 10‑minute drift, EOF/device/background).

## Last Completed Work

- KAI-MEM-001: root memory + autonomous workflow (`8391ada`).
- **KAI-001 DONE:** integration audit + ADR-015 pilot/privacy/integration boundaries. Evidence: `docs/kaiwa/evidence/KAI-001-integration-audit.md`. No app behaviour change; no Kaiwa feature directories created.

## Current State

- Kaiwa application code: **not started**.
- Gate A / Gate B: not started.
- Grammar N2: 26/141/4230 on `main`; teacher review PENDING.
- Local unrelated dirty may remain: grammar lesson `revision` bumps + `tests/grammar/grammar.test.ts` — do not mix into Kaiwa commits.

## Verification State

| Check | State |
|-------|--------|
| KAI-001 audit | DONE (read-only survey + docs) |
| Kaiwa app tests | N/A |

## Known Blockers

- None for KAI-002 spike start (browser/device work; no external API required).
- OD-002 (scoring provider) open — does not block KAI-002; KAI-003 can proceed in parallel when staffing allows.

## Exact Next Action

Execute **KAI-002** per `docs/kaiwa/TASKS.md` + `IMPLEMENTATION-RULES.md`: build capture harness, measure head/mid/tail sync on ~10‑minute video, record codec/browser findings into ADR; do not use chunk count as timeline.

## Files To Read Before Continuing

1. `docs/kaiwa/PLAN.md` (§8 sync / state machine)
2. `docs/kaiwa/TASKS.md` (KAI-002 acceptance)
3. `docs/kaiwa/IMPLEMENTATION-RULES.md`
4. `docs/kaiwa/evidence/KAI-001-integration-audit.md`
5. `docs/DECISIONS.md` (ADR-010–015)

## Safety Notes

- Do not start KAI-035 before Gate B.
- Do not commit user recordings / large media.
- Do not stage unrelated grammar dirty files.
- Autonomous commit/push/continue after VERIFY PASS.
