# KAI-012 — Media fixtures + first vertical-slice integration

Date: 2026-09-17  
Status: DONE

## Fixtures (synthetic, in-memory)

Generator: `tests/kaiwa/fixtures/generate.ts` — **no private user media committed**.

| Kind | Purpose |
|------|---------|
| short | ~3s OK |
| long | ~8 min metadata (within pilot) |
| too_long | >10 min → pilot reject |
| vertical | companion portrait intent 1080×1920 / rot90 |
| silent | no audio track |
| weird | ftyp-only / late-moov style |
| corrupt | fake extension / garbage bytes |

## Integration evidence

1. Probe + pilot limits per fixture (`vertical-slice.test.ts`)
2. Upload **resume mid-chunk** → complete → `prepare-media` → Range 206 playback
3. Corrupt → prepare 422 → project `failed`, no proxy
4. Job mid-lease reclaim already covered by KAI-007 `jobs.test.ts` (not duplicated)

## Verify

```text
npx tsx --test tests/kaiwa/vertical-slice.test.ts → 4/4
npm test → (full suite)
```
