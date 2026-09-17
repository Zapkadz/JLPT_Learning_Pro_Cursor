# KAI-016 — Prep screen / immutable take snapshot

Date: 2026-09-18  
Status: DONE

## Delivered

- `/kaiwa/projects/:id/prep` — synced transcript, click → seek, independent furigana/romaji/VI toggles
- `POST /projects/:id/start-practice` — publish draft → create attempt pinning reviewed revision
- `GET /attempts/:id` enriched with revision snapshot + `assessableReady` / message
- `/kaiwa/projects/:id/studio?attempt=` — shows immutable snapshot (recorder shell deferred to KAI-017+)
- Empty transcript: still startable with “chưa đủ chuẩn để chấm” copy

## Verify

```text
npm test → 50/50
npm run build → OK
tests/kaiwa/prep.test.ts
```
