# KAI-039 — Assemble segment clips → learner timeline

Date: 2026-09-18

## Delivered

- `shared/kaiwa/segmentAssemble.ts` — timeline plan (gaps, overlap flags, silent WAV)
- `server/modules/kaiwa/segmentAssemble.ts` — `POST /attempts/:id/assemble-segments`
  - Learner mic track duration = max segment end (or attempt duration)
  - Gaps = silence on learner track; optional ffmpeg adelay overlay when `FFMPEG_PATH` set
  - Finalizes attempt; metadata `assembly=segment_timeline`, `captureMode=segment` (never continuous)
- SegmentStudio **Kết thúc phiên** calls assemble then navigates to review
- Export works off assembled `audio_asset_id`

## Honesty

Assembled takes are labeled `segment_timeline`. Continuous mode attempts reject this route (409).

## Verification

- `tests/kaiwa/segment-assemble.test.ts` — gap/overlap + API honesty + export
- `npm test` **106/106**
- `npm run build` OK
