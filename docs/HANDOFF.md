# AI Handoff

## Last Updated

2026-09-18 (KAI-067 Qwen FA DONE; next KAI-068)

## Current Branch

`feat/kaiwa-memory`

## Current Task

**Next READY:** **KAI-068** — stable-ts direct alignment on same KAI-066 fixtures.

## Exact Next Action

1. Spike stable-ts `align` on `tts-clean-*` / `tts-longgap-01`; score via shared harness.
2. Compare table vs greedy + Qwen in evidence.
3. Then KAI-069 WhisperX contrast.

## Last Completed

- **KAI-067:** Qwen3-ForcedAligner-0.6B on CPU — clean TTS median |Δstart| **21–68 ms** (greedy was ~200 ms). See `evidence/kai-067/REPORT.md`.
- **KAI-066:** benchmark harness + greedy baseline.

## Blockers

- Grammar dirty files — do not stage with Kaiwa.
- Anime/BGM still unmeasured.

## Safety

- Do not invent bake-off numbers.
- Do not commit private anime audio.
- Do not swap production align engine until bake-off + ADR amend.
