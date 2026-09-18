# AI Handoff

## Last Updated

2026-09-18 (KAI-052 spike DONE — next KAI-053)

## Current Branch

`feat/kaiwa-memory`

## Current Task

**DONE:** KAI-052 align spike (Engine A Whisper+match; measured).  
**Next code:** **KAI-053** `align_script` job → draft revision.  
**Blocked human:** KAI-046 device.

## Exact Next Action

1. Implement **KAI-053**: enqueue `align_script`, ffmpeg extract mono WAV, run Whisper+script-match (sidecar), write draft with `source: script_align` + uncertain flags; 409 on stale draft.
2. Do not auto-publish; keep manual path when `scriptAlign` not ready.
3. KAI-046 remains human Chrome/Edge Gate A.

## Last Completed

- KAI-052: ffmpeg installed; TTS fixture; median |Δstart| 448 ms / |Δend| 404 ms (`docs/kaiwa/evidence/kai-052/`).
- KAI-051: untimed script ingest.

## Blockers

- KAI-046 human device for Gate A ACCEPTED.
- Grammar local dirty files — do not stage with Kaiwa commits.

## Safety

- Do not stage grammar dirty files.
- Do not auto-publish machine drafts (ADR-012/014).
- Do not invent timing accuracy numbers.
