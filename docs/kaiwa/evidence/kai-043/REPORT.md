# KAI-043 — Subset / skip / resume for long scripts

Date: 2026-09-18

## Delivered

- Filters: Tất cả / Còn thiếu / Đánh dấu luyện
- Subset marks in `localStorage` (`kaiwa-subset:<attemptId>`)
- Resume to first pending on studio open
- Prev/Next navigate within active filter
- Skip already supported (KAI-038); progress shows còn thiếu

## Verification

- `tests/kaiwa/segment-studio-ui.test.ts` asserts filters + resume hooks
- `npm test` **109/109**
- `npm run build` OK
