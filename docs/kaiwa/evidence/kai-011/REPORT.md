# KAI-011 — Upload UI / library / Range playback

Date: 2026-09-17  
Status: DONE

## Delivered

- Sidebar **Kaiwa** → `/kaiwa` (after Grammar)
- Library `/kaiwa` — empty/loading/error + project cards with status
- Upload `/kaiwa/new` — chunked upload, progress, cancel, resume via `sessionStorage`, prepare-media
- Project hub `/kaiwa/projects/:id` — cookie-auth `<video src=/api/kaiwa/assets/:proxyId/content>` (Range-capable)
- Backend: `proxy_asset_id` (kaiwa-004), create with `sourceAssetId`, `POST /projects/:id/prepare-media` (reuses ready proxy)

## Acceptance map

| Criterion | Evidence |
|-----------|----------|
| Tải video tới xem được | Upload → prepare-media → project video |
| Reload đúng trạng thái | Project list/detail from SQLite |
| Không upload lại toàn bộ khi resume | `uploadClient` skips `receivedIndexes` |
| URL không đoán được công khai | UUID asset id + auth cookie; anon → 401/403 |

## Verify

```text
npm test → 34/34
npm run build → OK
```

## Files

- `src/features/kaiwa/*`, `src/App.tsx`, `src/main.tsx`
- `server/modules/kaiwa/{module,repository}.ts`, `shared/kaiwa/types.ts`
- `tests/kaiwa/ui-slice.test.ts`
