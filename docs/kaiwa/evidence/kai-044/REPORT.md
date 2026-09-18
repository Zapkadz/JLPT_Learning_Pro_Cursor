# KAI-044 — Review per-segment status + seek A/B

Date: 2026-09-18

## Delivered

- Review panel **Trạng thái từng đoạn**: recorded/skipped/pending + version
- Chip click seeks video+assembled mic to segment window (A→B)
- **Nghe clip** plays that segment's clip asset when present
- Shows honest `captureMode` / `assembly` labels

## Verification

- `tests/kaiwa/feedback-ui.test.ts`
- `npm test` **110/110**
- `npm run build` OK
