# AI Handoff

## Last Updated

2026-09-18 (KAI-051 untimed script ingest DONE)

## Current Branch

`feat/kaiwa-memory`

## Current Task

**DONE:** KAI-051 untimed script ingest.  
**Blocked human:** KAI-046 device.  
**Next code:** **KAI-052** align spike (ffmpeg and/or provider decision).

## Exact Next Action

1. Start **KAI-052** spike brief: pick engine A/B/C from AUTO-SUBTITLE-SPEC §5.2; run on short JA fixture if ffmpeg/local or cloud key available.
2. If spike blocked (no ffmpeg/credential): record BLOCKED in TASKS; keep manual + untimed ingest path working.
3. Do **not** implement full `align_script` job (KAI-053) until spike report exists.

## Last Completed

- KAI-051: `parseUntimedScript` + paste/`.txt` UI; tests; build OK.
- Prior: KAI-050 ADR-020 / AUTO-SUBTITLE-SPEC (docs).

## Blockers

- KAI-046 human device for Gate A ACCEPTED.
- KAI-052 may need ffmpeg path and/or speech provider credentials.
- Grammar local dirty files — do not stage with Kaiwa commits.

## Safety

- Do not stage grammar dirty files.
- Do not auto-publish machine drafts (ADR-012/014).
