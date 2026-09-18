# AI Handoff

## Last Updated

2026-09-18 (auto-subtitle **v1+v2** DONE — next KAI-046 device)

## Current Branch

`feat/kaiwa-memory`

## Current Task

**DONE:** Auto phụ đề KAI-050–058 (script sync + ASR).  
**Blocked human:** **KAI-046** Gate A device (Chrome/Edge segment).  
No further auto-subtitle code without a new approved milestone.

## Exact Next Action

1. Human: run **KAI-046** Gate A device checklist (`docs/kaiwa/evidence/kai-033/CHECKLIST.md` + DEVICE-RUNBOOK).
2. Do not start Gate B scoring (KAI-023) without approval.
3. Do not stage grammar dirty files with Kaiwa commits.

## Last Completed

- KAI-056: `POST …/transcriptions` Whisper/mock → draft `source=asr`
- KAI-057: ASR CTA + strong risk banner
- KAI-058: USAGE + release notes v1/v2

## Blockers

- KAI-046 human device for Gate A ACCEPTED.
- Grammar local dirty files — do not stage with Kaiwa commits.

## Safety

- Do not stage grammar dirty files.
- Do not auto-publish machine drafts (ADR-012/014).
- Do not invent Gate A device PASS.
