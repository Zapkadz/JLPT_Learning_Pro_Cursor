# KAI-027 — Relative F0 / timing prosody (provisional)

Date: 2026-09-18

## Delivered

- `shared/kaiwa/prosody.ts` — autocorrelation F0, voiced ratio, median-centered relative contour, timing drift vs plan
- Weak alignment (`data_gap` / `uncertain` / …) → `not_assessable` (no rhythm claims)
- `pitchAccentLabel` and `abilityScore` always `null`
- `calibrated: false`, `teacherCompared: false`
- No time-warp of audio to fit plan
- `POST/GET /kaiwa/attempts/:id/prosody`; WebM without PCM → `unavailable`

## Honesty bounds

Provisional local DSP only. Teacher/benchmark calibration is **KAI-023**. Drawing an F0 contour alone does not complete Gate B intonation.

## Verification

- `npm test` **95/95**
- `npm run build` OK
