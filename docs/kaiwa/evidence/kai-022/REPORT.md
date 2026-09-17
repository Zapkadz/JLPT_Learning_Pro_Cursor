# KAI-022 — Export MP4 + private download

Date: 2026-09-18

## Delivered

- `kaiwa_exports` table; mix snapshot + fingerprint uniqueness
- `POST /kaiwa/attempts/:id/exports` — create/reuse export (idempotent per mix)
- `GET /kaiwa/exports/:id` + `GET /kaiwa/exports/:id/download` (owner cookie, attachment)
- Engine: `ffmpeg` dual-gain mix when `FFMPEG_PATH` / `KAIWA_FFMPEG_PATH` set; else `passthrough-synthetic` playable MP4 with mix metadata in free box
- Independent of scoring/assessment jobs
- Review UI «Xuất MP4» + download link

## Verification

- `npm test` **64/64** (includes `tests/kaiwa/export.test.ts`)
- `npm run build` OK
