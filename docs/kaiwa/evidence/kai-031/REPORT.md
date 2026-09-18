# KAI-031 — Media backup / soft-delete / GC / ops snapshot

Date: 2026-09-18

## Delivered

- `DELETE /kaiwa/projects/:id` — soft tombstone, cancel related jobs, tombstone+GC unreferenced assets (no revive after delete)
- `GET /kaiwa/ops/snapshot` — usage/queue warnings; `POST /kaiwa/ops/gc`
- `npm run backup -- path.sqlite --with-media` (or `KAIWA_BACKUP_MEDIA=1`) copies media + `MANIFEST.json` and verifies checksums
- `redactForLog` — no tokens/binary in log-shaped objects
- Project hub «Xóa dự án» CTA

## Retention (ops note)

- Soft-delete sets `deleted_at`; media GC only when no live project/attempt/export references the asset.
- DB-only backup does **not** include private media — use `--with-media`.
- Upload reservations expire via existing TTL purge.

## Verification

- `npm test` **68/68** (includes `tests/kaiwa/ops.test.ts`)
- `npm run build` OK
