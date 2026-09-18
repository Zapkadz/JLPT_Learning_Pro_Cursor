# AI Handoff

## Last Updated

2026-09-18 (ADR-020 / KAI-050 auto-subtitle plan; awaiting approve to code)

## Current Branch

`feat/kaiwa-memory`

## Current Task

**Planning DONE:** Auto phụ đề v1/v2 (ADR-020, KAI-050).  
**Blocked human:** KAI-046 device.  
**Next code (needs your go-ahead):** **KAI-051** untimed script ingest.

## Exact Next Action

1. Read `docs/kaiwa/evidence/kai-050/AUTO-SUBTITLE-SPEC.md` + ADR-020.
2. Approve starting **KAI-051** (v1) — or continue KAI-046 device testing first.
3. Do **not** start KAI-052 spike without ffmpeg and/or provider decision from the spike brief.

## Last Completed

- KAI-050: ADR-020 + AUTO-SUBTITLE-SPEC + PLAN/TASKS updates (docs only).
- Prior: speakable studio KAI-036–049; Gate A automated preflight.

## Blockers

- KAI-046 human device for Gate A ACCEPTED.
- Auto subtitle **implementation** waits explicit approve (new milestone).
- Live align/ASR needs credentials and/or local model (KAI-052).

## Safety

- Do not stage grammar dirty files.
- Do not implement auto-subtitle until user approves KAI-051+.
