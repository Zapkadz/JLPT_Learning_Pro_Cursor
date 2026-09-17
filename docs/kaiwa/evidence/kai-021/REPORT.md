# KAI-021 — Review playback / dual gain / take history

Date: 2026-09-18

## Delivered

- Route `/kaiwa/attempts/:id` — `KaiwaReview`: video (original gain) + mic audio (learner gain), synced play/pause/seek
- Only two mix sliders (no fake music track)
- `PATCH /kaiwa/attempts/:id/mix` persists `{ originalGain, learnerGain, keep }` in `device_json.mix`
- `GET /kaiwa/projects/:id/attempts` lists takes (newest first)
- Project hub shows attempt history; «Thu lại» creates a **new** attempt (never overwrites)
- Studio navigates to review after successful finalize

## Verification

- `npm test` **63/63** (includes `tests/kaiwa/review-mix.test.ts`)
- `npm run build` OK
