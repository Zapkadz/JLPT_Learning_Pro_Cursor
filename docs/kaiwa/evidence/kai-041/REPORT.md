# KAI-041 — Continuous live overlay

Date: 2026-09-18

## Delivered

- `shared/kaiwa/liveOverlay.ts` — current + next by video clock
- `ContinuousRecorder` — on-video `kaiwa-script-overlay` (current JA/VI + next line); does not auto-stop per sentence
- Studio passes `segments` + help prefs; list below video marked secondary

## Verification

- `tests/kaiwa/live-overlay.test.ts`
- `npm test` **108/108**
- `npm run build` OK
