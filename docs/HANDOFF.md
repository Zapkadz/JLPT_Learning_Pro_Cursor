# AI Handoff

## Last Updated

2026-09-17 (KAI-003 DONE → next: KAI-004)

## Project

Kotoba — Japanese Learning (`kotoba-learning`)
Remote: https://github.com/Zapkadz/JLPT_Learning_Pro_Cursor.git

## Current Branch

`feat/kaiwa-memory`

## Current Objective

**Kaiwa Studio** — Gate A → Gate B.

## Current Phase

Design / risk validation — UX specification.

## Current Task

**KAI-004** — detailed screens, recorder states, error flows, browser/device matrix (no mandatory character select; no per-sentence auto-stop).

## Last Completed Work

- KAI-001 audit (ADR-015)
- KAI-002 capture spike (ADR-016; 10‑min drift PASS)
- KAI-003 scoring capability map (ADR-017; live samples UNAVAILABLE — missing credentials)

## Exact Next Action

Execute **KAI-004** per `docs/kaiwa/TASKS.md`: wireflow/spec for desktop/mobile, keyboard, loading/empty/error/offline, data-loss messaging; align with PLAN §4 and ADR-016 recorder states.

## Files To Read

1. `docs/kaiwa/PLAN.md` §4, §8.2
2. `docs/kaiwa/TASKS.md` (KAI-004)
3. `docs/kaiwa/evidence/kai-002/REPORT.md`
4. `docs/kaiwa/evidence/kai-003/REPORT.md`
5. `DESIGN.md`, `UX-CONTRACT.md`

## Safety Notes

- Do not implement full Kaiwa UI app code in KAI-004 unless the task’s acceptance is docs/spec only — TASKS says wireflow/spec.
- Do not commit secrets or user media.
- Do not mix unrelated grammar dirty files.
