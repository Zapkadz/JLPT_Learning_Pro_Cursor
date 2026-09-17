# KAI-014 — Furigana / romaji / VI layers

Date: 2026-09-18  
Status: DONE

## Delivered

- Segment `tokens[]` + `readingStale` in `shared/kaiwa/types.ts`
- Hepburn romaji from kana: `shared/kaiwa/romaji.ts` (particles は/へ/を, っ, ん assimilation)
- Editor toggles (furigana default on, romaji default off, VI independent) persisted per user in `localStorage`
- Ruby preview with wrap; JA change marks stale / clears non-manual tokens
- Manual reading/romaji fields; overrides survive draft reload

## Acceptance map

| Criterion | Evidence |
|-----------|----------|
| Reading/romaji exception tests | `tests/kaiwa/romaji.test.ts` |
| Override survives reload | `tests/kaiwa/readings.test.ts` |
| JA change → dependent review | `markReadingStaleOnJaChange` + UI banner |
| Ruby no overflow | `.kaiwa-ruby-preview { overflow-wrap }` |
| Romaji default off | `loadHelpPrefs` defaults |

## Verify

```text
npm test → 48/48
npm run build → OK
```
