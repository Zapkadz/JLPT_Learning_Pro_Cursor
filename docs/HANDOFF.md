# AI Handoff

## Last Updated

2026-09-17 (KAI-009 DONE → next: KAI-010)

## Current Branch

`feat/kaiwa-memory`

## Current Task

**KAI-010** — proxy playback, reference audio, thumbnail, timeline mapping (VFR/rotation/start offset).

## Exact Next Action

Implement KAI-010 per TASKS after reading PLAN §8 and KAI-009 probe contracts. Prefer job-based transcode when `ffmpeg` available; keep source asset immutable.

## Safety

- Do not stage grammar dirty files.
- Do not commit user media / large derived outputs.
