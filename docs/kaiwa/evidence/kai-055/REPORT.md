# KAI-055 — Script-align honesty + USAGE v1

Date: 2026-09-18  
Status: **DONE**

## Delivered

- `docs/kaiwa/USAGE-GATE-A.md` — v1 sync flow, capability honesty, no auto-publish, manual fallback
- `docs/kaiwa/evidence/kai-033/RELEASE-NOTES.md` — ships / deferred / env knobs for script-align
- Capability surface already exposes `scriptAlign` (`ready` | `not_configured`) from KAI-053; tests assert presence + 503 transcription stub unchanged

## Honesty guarantees (verified by product rules + tests)

| Guarantee | Where |
| --- | --- |
| Manual SRT/VTT/paste when align not ready | UI + USAGE + `scriptAlign.messageVi` |
| Machine output is draft | `source_json.source=script_align`; banner in editor |
| No auto-publish | Align only writes draft; publish is separate user action |
| Keep user script text | Sidecar / mock keep `ja` from input lines |
| Transcription v2 still stub | `POST …/transcriptions` → 503 `speech_not_configured` |

## Verification

- `npm test` (includes speech-capability + script-align)
- `npm run build`
- Content: USAGE mentions Đồng bộ / bản nháp máy / not_configured fallback

## Next

KAI-056+ = v2 ASR (separate milestone). Gate A device = KAI-046 (human).
