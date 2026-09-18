# AI Handoff

## Last Updated

2026-09-18 (KAI-055 DONE — auto-subtitle **v1.0** complete)

## Current Branch

`feat/kaiwa-memory`

## Current Task

**Milestone DONE:** Auto phụ đề **v1** (KAI-050–055).  
**Next optional:** **KAI-056** v2 ASR (needs product go-ahead / keys) **or** **KAI-046** Gate A device.  
**Blocked human:** KAI-046.

## Exact Next Action

1. Human: run **KAI-046** Gate A device checklist (Chrome/Edge segment), **or**
2. Approve starting **KAI-056** video-only ASR (v2) — otherwise leave `transcription` as `not_configured`.
3. Do not market Gate A as device-accepted until CHECKLIST signed.

## Last Completed

- KAI-055: USAGE + release notes honesty for script sync; capability `scriptAlign` documented/tested.
- Prior: KAI-051–054 ingest, spike, job, UI.

## Blockers

- KAI-046 human device for Gate A ACCEPTED.
- KAI-056+ needs ASR provider decision / credentials for live path.
- Grammar local dirty files — do not stage with Kaiwa commits.

## Safety

- Do not stage grammar dirty files.
- Do not auto-publish machine drafts (ADR-012/014).
