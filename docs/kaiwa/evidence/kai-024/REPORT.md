# KAI-024 — Audio quality gate (provisional)

Date: 2026-09-18

## Delivered

- `shared/kaiwa/audioQuality.ts` — PCM Int16 silence/clipping/too-short gate
- `pronunciationScore` always `null` (never invent 0)
- WebM mic without decode → `unavailable` + `decode_unavailable` (honest)
- `POST/GET /kaiwa/attempts/:id/audio-quality`; stored on `clocks_json.audioQuality`
- Review UI «Kiểm tra chất lượng thu»
- Export remains independent (ADR-014)

## Thresholds

Provisional until KAI-023 locks benchmark (`PROVISIONAL_THRESHOLDS`). Reference leakage not claimed without correlation.

## Verification

- `npm test` **76/76**
- `npm run build` OK
