# KAI-010 — Proxy playback / timeline mapping

Date: 2026-09-17  
Status: DONE (passthrough foundation; ffmpeg normalize deferred)

## Scope delivered

- `POST /api/kaiwa/assets/:id/prepare-playback`
- Passthrough proxy copy under a new `proxy` storage key (source bytes untouched)
- Identity timeline mapping (`durationScale: 1`, `sourceStartMs/proxyStartMs: 0`, rotation from probe)
- Gate: probe must succeed before proxy is marked ready; fake/corrupt media → 422
- `LocalMediaStorage.copyFile` creates destination shard dirs (fixes Windows ENOENT on copy)

## Not yet (explicit)

- Full VFR remux / rotation bake-in when `FFMPEG_PATH` / `KAIWA_FFMPEG_PATH` is set (engine field reserved; still copies today)
- Binary thumbnail generation (placeholder id only in response)
- Dedicated reference-audio extract job

These do **not** block KAI-011 UI upload/library; studio clock should treat proxy timeline as authoritative once ffmpeg normalize lands.

## Verification

```text
npx tsc --noEmit
npx tsx --test tests/kaiwa/*.test.ts
→ 17/17 pass (includes tests/kaiwa/proxy.test.ts)
```

## Key files

- `server/modules/kaiwa/proxy.ts`
- `server/modules/kaiwa/storage.ts` (`copyFile`)
- `server/modules/kaiwa/module.ts` (route)
- `tests/kaiwa/proxy.test.ts`
