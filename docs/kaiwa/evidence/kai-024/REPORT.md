# KAI-024 — Audio quality gate (provisional)

Date: 2026-09-18  
Updated: 2026-09-18 (reference leakage heuristic)

## Delivered

- `shared/kaiwa/audioQuality.ts` — PCM Int16 silence/clipping/too-short gate
- **Reference leakage (NCC):** optional `referencePcm` → peak |normalized cross-corr| over ±80 ms; ≥0.85 → `reference_leakage` / `not_assessable` (never pronunciation `0`)
- `pronunciationScore` always `null`
- WebM mic without decode → `unavailable` + `decode_unavailable` (honest); leakage stays `reference_leakage_unverified`
- `POST/GET /kaiwa/attempts/:id/audio-quality`; stored on `clocks_json.audioQuality`
- Review UI «Kiểm tra chất lượng thu»
- Export remains independent (ADR-014)

## Thresholds

DSP cutoffs remain provisional pending KAI-023 corpus calibration (`PROVISIONAL_THRESHOLDS`). Gate B *feedback* rates are locked separately (ADR-022).

Leakage: `leakageCorrMin=0.85`, `leakageMaxLagMs=80` — conservative; API does not yet pass lesson reference PCM (needs decoded reference track). Callers/tests may supply `referencePcm` to `analyzePcmInt16Le`.

## Verification

- Leakage unit tests + full `npm test`
- Earlier baseline: **76/76** + build OK
