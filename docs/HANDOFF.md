# AI Handoff

## Last Updated

2026-09-18 (KAI-069 DONE; next KAI-070)

## Current Branch

`feat/kaiwa-memory`

## Current Task

**Next READY:** **KAI-070** — integrate stable-ts as default align engine (ADR-021a); optional Qwen flag.

## Exact Next Action

1. Adapter behind env (e.g. `KAIWA_SCRIPT_ALIGN_ENGINE=stable_ts|qwen_fa|whisper`).
2. Worker/progress/timeout; draft-only; preserve meta (KAI-065).
3. Do not claim anime fixed.

## Last Completed

- Bake-off KAI-066–069: greedy ~200 ms → stable-ts/Qwen/WhisperX ~13–114 ms on clean TTS.
- **ADR-021a:** default **stable-ts**, optional Qwen, WhisperX contrast-only.

## Blockers

- Grammar dirty — exclude from Kaiwa commits.
- Broader corpus / anime still pending (KAI-076).

## Safety

- Do not invent numbers; no private media in git.
