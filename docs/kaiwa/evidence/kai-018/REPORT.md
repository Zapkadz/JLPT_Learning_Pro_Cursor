# KAI-018 — Continuous recorder state machine

Date: 2026-09-18  
Status: DONE (capture axis + studio wire; durable chunk journal → KAI-019)

## Delivered

- Pure capture machine `recorderMachine.ts` (idle→…→saved; illegal events ignored)
- `ContinuousRecorder`: countdown, MediaRecorder mic, video.currentTime+perf clock samples, lock controls/rate while recording, EOF→completed / early stop→partial
- `POST /attempts/:id/finalize` idempotent metadata (completion, duration, clocks)
- Studio shows recorder after mic preflight ready

## Verify

```text
npm test → 56/56
npm run build → OK
```

## Deferred to KAI-019

IndexedDB journal, background chunk upload/resume, buffer quota recovery.
