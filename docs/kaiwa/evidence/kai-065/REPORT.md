# KAI-065 — Phase 1: stop harmful script-align behaviors

Date: 2026-09-18  
Status: **DONE** (honesty / regression; engine bake-off = KAI-066+)

## Changes

1. Removed end-stretch toward next line (`align_script_sidecar.py`).
2. Unmatched lines keep null times in sidecar; backend maps to `timingStatus=unmatched` + `assessable=false` (schema still requires numbers — UI warns; not presented as successful sync windows).
3. Whisper path fails with 422 if **zero** proposed lines (no silent fake success).
4. Re-align merges previous revision `id` / `vi` / `tokens` by JA match.
5. Regression: `scripts/kaiwa/test_align_regression.py` (30s gap; mismatch; null unmatched).
6. Unit: `tests/kaiwa/script-align-preserve.test.ts`.

## Verify

- `python scripts/kaiwa/test_align_regression.py` → `align_regression_ok`
- `npm test` → **121/121** pass

## Not in this task

- Qwen / stable-ts / WhisperX bake-off (KAI-067–069)
- Waveform editor / lock-and-realign (KAI-073)
- Honest 30-clip benchmark harness (KAI-066)
