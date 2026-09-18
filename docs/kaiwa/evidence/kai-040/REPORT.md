# KAI-040 — Studio mode preference

Date: 2026-09-18

## Delivered

- `localStorage` key `kaiwa-capture-mode:<userId>` — default **segment**
- Prep `start-practice` sends saved preference
- Studio mode picker saves preference; attempt `device_json` still wins for that session
- Canonical VI copy for segment vs continuous (ADR-019 / SEGMENT-STUDIO-SPEC §8)

## Verification

- `tests/kaiwa/segment-studio-ui.test.ts` updated
- `npm run build` OK
