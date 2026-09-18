# KAI-042 — Re-record segment without wiping others

Date: 2026-09-18

## Delivered

- Versioned takes already from KAI-037; confirmed other segments untouched on re-record
- `GET /attempts/:id/segment-clips/:segmentId/history` — full take history
- SegmentStudio shows `vN` + note that older takes are kept

## Verification

- `tests/kaiwa/segment-clips.test.ts` — re-record keeps peer clip + history assets
- `npm test` **109/109**
- `npm run build` OK
