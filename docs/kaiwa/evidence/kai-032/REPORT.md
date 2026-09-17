# KAI-032 — Security / ownership / a11y QA

Date: 2026-09-18

## Automated evidence

| Check | Evidence |
| --- | --- |
| Cross-account project/attempt/export/history isolation | `tests/kaiwa/security.test.ts` |
| Unauthenticated `/kaiwa/*` rejected | same |
| Path traversal blocked | `tests/kaiwa/storage.test.ts` |
| Asset Range owner-only | `tests/kaiwa/storage.test.ts` / `ui-slice.test.ts` |
| Fake MIME / probe gate | `tests/kaiwa/probe.test.ts`, vertical-slice corrupt |
| Quota / reservation | `tests/kaiwa/storage.test.ts` |
| Subtitle HTML stripped (no executable markup) | `tests/kaiwa/subtitles.test.ts` + security.test |
| Schema owner isolation | `tests/kaiwa/schema.test.ts` |

## Manual Gate A checklist (device matrix)

- [ ] Desktop Chrome: keyboard Space play/pause on review (when not in input); Tab order on mix sliders; focus visible
- [ ] Desktop Edge: same as Chrome for capture claim
- [ ] Ruby / furigana wrap without horizontal overflow on mobile viewport
- [ ] Offline / network drop mid-upload shows recoverable message (no silent data loss claim)
- [ ] Mobile: UI readable; recording not claimed until device matrix PASS (ADR-015)

## Verification

- `npm test` includes security suite
- `npm run build` OK

Manual rows remain for Gate A device sign-off (KAI-033).
