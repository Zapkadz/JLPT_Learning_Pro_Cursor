# AI Handoff

## Last Updated

2026-09-18 (KAI-066 DONE; next KAI-067)

## Current Branch

`feat/kaiwa-memory`

## Current Task

**Next READY:** **KAI-067** — spike Qwen3-ForcedAligner-0.6B on KAI-066 fixtures (CPU).

## Exact Next Action

1. Install/run Qwen ForcedAligner on `docs/kaiwa/evidence/kai-066/fixtures` via shared score path.
2. Write evidence numbers (latency/RAM/Δ vs GT); no anime claim.
3. Then KAI-068 stable-ts on same set.

## Last Completed

- **KAI-066:** `bench_align.py`, speech-window GT, corpus plan, greedy baseline (`baseline_greedy.json`).
- Prior: Gate A ACCEPTED; KAI-065 honesty.

## Blockers

- Grammar dirty files — do not stage with Kaiwa.
- Full 30-clip corpus mostly pending (private media outside git).

## Safety

- Do not invent bake-off numbers.
- Do not commit private anime audio.
