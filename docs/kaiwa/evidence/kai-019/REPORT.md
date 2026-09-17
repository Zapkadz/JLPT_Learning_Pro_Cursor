# KAI-019 — IndexedDB journal + chunk upload/resume

Date: 2026-09-18  
Status: DONE

## Delivered

- Client journal: `chunkJournal.ts` (IndexedDB + in-memory for tests), 80 MB buffer limit
- Background sync/resume: `attemptUpload.ts` skips server `receivedIndexes`
- Server: `PUT /attempts/:id/chunks/:index`, `GET …/upload-state`, `POST …/assemble-audio`
- Finalize requires assembled `audio_asset_id` for completed/partial — garbage/undecodable → 422, never “saved”
- `ContinuousRecorder` journals each MediaRecorder blob, syncs, assembles, then finalizes

## Verify

```text
npm test → 59/59
npm run build → OK
```
