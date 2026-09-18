# AI Handoff

## Last Updated

2026-09-18 (KAI-068 stable-ts DONE; next KAI-069)

## Current Branch

`feat/kaiwa-memory`

## Current Task

**Next READY:** **KAI-069** — WhisperX JA CTC contrast + bake-off note.

## Exact Next Action

1. Spike WhisperX Japanese alignment on same KAI-066 fixtures (or document install blocker honestly).
2. Write comparison table greedy / Qwen / stable-ts / WhisperX; provisional engine recommendation.
3. Then KAI-070 integrate winner (only after ADR note).

## Last Completed

- **KAI-068:** stable-ts `align` — clean TTS median |Δstart| **28–53 ms**; faster than Qwen on CPU.
- **KAI-067:** Qwen FA — **21–68 ms**; load ~120 s CPU.
- **KAI-066:** harness + greedy baseline ~200 ms.

## Blockers

- Grammar dirty — exclude from Kaiwa commits.
- Anime/BGM still unmeasured.

## Safety

- Do not swap production engine yet.
- Do not invent numbers / commit private media.
