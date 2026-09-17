# KAI-013 — SRT/VTT parser + transcript editor

Date: 2026-09-17  
Status: DONE

## Delivered

- `shared/kaiwa/subtitles.ts` — parse SRT/VTT (BOM/CRLF), strip HTML/`script`, reject end≤start, outside duration, flag overlaps; split/merge helpers
- `GET /api/kaiwa/projects/:id/active-revision`
- UI `/kaiwa/projects/:id/edit` — import file, manual edit, seek, split/merge, save draft, publish

## Acceptance

| Criterion | Evidence |
|-----------|----------|
| BOM/CRLF/Unicode/markup/time | `tests/kaiwa/subtitles.test.ts` |
| No executable HTML | strip removes tags/scripts |
| end≤start / outside duration | rejected with issues |
| Overlap flagged | UI `.overlap` + parse issues |
| Split/merge | helpers + editor buttons |

## Verify

```text
npm test → 42/42
npm run build → OK
```
