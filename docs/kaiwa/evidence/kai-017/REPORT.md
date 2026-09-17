# KAI-017 — Mic preflight

Date: 2026-09-18  
Status: DONE

## Delivered

- `src/features/kaiwa/micPreflight.ts` — getUserMedia, device list, meter (no speaker loopback), local test clip
- `MicPreflightPanel` on studio route — denied / no_device / disconnect paths; stop tracks on leave
- Explicit copy: test audio stays local, never sent to external providers
- Static tests assert no fetch/provider hooks + cleanup present

## Verify

```text
npm test → 52/52
npm run build → OK
```

## Note

Live permission/device QA on real hardware remains for KAI-033 device matrix.
