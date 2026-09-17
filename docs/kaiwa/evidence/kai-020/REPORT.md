# KAI-020 — Finalize take (decode / duration / mic-only)

Date: 2026-09-18  
Status: DONE

## Delivered

- `finalizeTake.ts`: idempotent finalize; auto-assemble; mic `kind=mic` only (no video/reference mix)
- Duration required for completed/partial; completed rejects tiny duration
- Head/mid/tail Range readability smoke on mic asset
- Missing chunk gaps → 409; interrupted without audio → `tailMissing` + `record_state=interrupted` (honest, not fake saved)
- `assemble: false` still blocks saved without prior audio

## Verify

```text
npm test → 62/62
npm run build → OK (prior)
tests/kaiwa/finalize-take.test.ts
```

## Note

Full ffmpeg remux when `FFMPEG_PATH` set remains optional enhancement; concatenate+validate is the pilot path.
