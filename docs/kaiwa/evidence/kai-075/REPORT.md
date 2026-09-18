# KAI-075 — Capability ready requires smoke inference

Date: 2026-09-18  
Status: **DONE**

## Delivered

1. `scripts/kaiwa/smoke_align_engine.py` — silence WAV + one JA line for stable_ts / qwen_fa / whisper.
2. `runAlignEngineSmoke` + gate in `speechCapability.ts`: **ready** only after smoke (or mock); **degraded** if smoke skipped; **not_configured** if smoke fails.
3. `npm run kaiwa:speech-env` forces smoke and prints `alignSmoke` + capability (must match).
4. UI treats `degraded` like ready for sync CTA (packages present); message still warns.
5. CPU notes: `docs/kaiwa/evidence/kai-075/CPU-NOTES.md`.

## Verification

- Unit: `tests/kaiwa/align-smoke.test.ts`
- Full `npm test` (smoke auto-skipped via `npm_lifecycle_event=test`)
- `npm run build`

## Note

Live `kaiwa:speech-env` with smoke may take minutes on first model download — run on the host machine, not claimed in unit tests.
