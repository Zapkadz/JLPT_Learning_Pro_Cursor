# KAI-070 — Integrate stable-ts as default script-align engine

Date: 2026-09-18  
Status: **DONE**

## Decision

ADR-021a: default `KAIWA_SCRIPT_ALIGN_ENGINE=stable_ts`; optional `qwen_fa`; legacy `whisper`; tests `mock`.

## Code

| Piece | Role |
| --- | --- |
| `scripts/kaiwa/align_stable_ts_sidecar.py` | Production stable-ts align → same segment JSON |
| `scripts/kaiwa/align_qwen_fa_sidecar.py` | Optional Qwen ForcedAligner |
| `scripts/kaiwa/align_line_map.py` | Shared word→line mapping |
| `server/modules/kaiwa/scriptAlign.ts` | Dispatch by engine; put ffmpeg dir on PATH for stable-ts |
| `server/modules/kaiwa/speechCapability.ts` | Capability per engine (import check) |

## Verify

- `npm test` **122/122**
- `npm run build` OK
- `npm run kaiwa:speech-env` → `scriptAlign: ready | stable-ts:base`
- Sidecar smoke on `tts-clean-01`: 3× `proposed` (e.g. starts ~200/2740/5820 ms)

## Honesty

- Still draft-only; anime/BGM not claimed.
- Unmatched → no fake success (KAI-065).
- Preserve id/vi/tokens on re-align.

## Next

- KAI-071 windowing for long video
- KAI-072 editor unmatched filter / banners
