# AI Handoff

## Last Updated

2026-09-17 (KAI-002 DONE → next: KAI-003)

## Project

Kotoba — Japanese Learning (`kotoba-learning`)
Remote: https://github.com/Zapkadz/JLPT_Learning_Pro_Cursor.git

## Current Branch

`feat/kaiwa-memory`

## Latest Relevant Commit

See `git log -1` after push.

## Current Objective

**Kaiwa Studio** — Gate A → Gate B.

## Current Phase

Design / risk validation — Japanese scoring spike.

## Current Task

**KAI-003** — Japanese scoring provider capability spike (no fake scores; document UNAVAILABLE if no credentials).

**Also READY:** KAI-004 (UX wireflows; depends KAI-001+002).

## Last Completed Work

- KAI-MEM-001, KAI-001 (ADR-015), **KAI-002** (ADR-016; MediaRecorder+video clock; 10‑min drift PASS in synthetic Chromium lab).

## Current State

- Kaiwa product UI/API still **not shipped**.
- Capture stack decision locked (ADR-016).
- Scoring provider **not** locked (must not assume Azure prosody for JA intonation).

## Verification State

| Check | State |
|-------|--------|
| Capture spike 20s/120s/600s | PASS (≤100 ms drift) |
| `npm run kaiwa:capture-spike` | Available |

## Known Blockers

- Live ja-JP provider samples need credentials — if missing, KAI-003 records gap and continues with capability map / fallback design (does not block KAI-004 or later foundation tasks that do not need scoring).

## Exact Next Action

Execute **KAI-003** per TASKS: capability map for ja-JP, allowed/forbidden conclusions, fallback, benchmark outline; no fabricated scores.

## Files To Read

1. `docs/kaiwa/PLAN.md` §10
2. `docs/kaiwa/TASKS.md` (KAI-003)
3. `docs/kaiwa/evidence/kai-002/REPORT.md`
4. `docs/DECISIONS.md` ADR-014, ADR-016

## Safety Notes

- Do not commit audio blobs or API secrets.
- Do not start KAI-035 before Gate B.
- Do not mix unrelated grammar dirty files into Kaiwa commits.
