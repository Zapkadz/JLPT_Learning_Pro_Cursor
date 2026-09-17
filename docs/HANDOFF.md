# AI Handoff

## Last Updated

2026-09-18 (KAI-022 DONE → next: KAI-030a)

## Current Branch

`feat/kaiwa-memory`

## Current Task

**KAI-030a** — Kaiwa take history / progress for Gate A (no fake XP/speaking metrics).

## Exact Next Action

Ship attempt/activity history UI + events without changing deck/grammar XP meanings; ADR for separate Kaiwa streak/XP (defer active speaking XP to 030b).

## Last Completed

**KAI-022** — Export MP4 job, mix snapshot, private download; ffmpeg when available else synthetic. Evidence: `docs/kaiwa/evidence/kai-022/REPORT.md`. Verify: **64/64**.

## Safety

- Do not stage grammar dirty files.
- Do not commit user media / large derived outputs.
