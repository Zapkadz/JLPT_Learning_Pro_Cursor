# KAI-037 — Segment clips schema/API

Date: 2026-09-18

## Delivered

- Table `kaiwa_segment_clips` (migration `kaiwa-006`)
- `captureMode` on attempt (`device_json`; default `segment` via start-practice)
- APIs:
  - `PATCH /attempts/:id/capture-mode`
  - `GET /attempts/:id/segment-clips` (progress N/M + latest version per segment)
  - `POST /attempts/:id/segment-clips/:segmentId` `{ action: record|skip }`
- Re-record increments `version`; peer account → 404
- Shared helpers: `shared/kaiwa/segmentClips.ts`

## Verification

- `npm test` **102/102**
- `npm run build` OK
