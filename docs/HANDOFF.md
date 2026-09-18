# AI Handoff

## Last Updated

2026-09-18 (KAI-059–062 quality/UX fixes after device feedback)

## Current Branch

`feat/kaiwa-memory`

## Current Task

**DONE:** KAI-059–062 (sync button, furigana/vi honesty, Whisper `base`, ASR empty fail).  
**Blocked human:** KAI-046 Gate A device.

## Exact Next Action

1. User re-test: Áp dụng lời → đồng bộ (không cần giữ paste); Furigana/Việt bật → thấy hint nếu chưa có reading/vi.
2. Prefer **Đồng bộ script** over ASR for anime; set `KAIWA_WHISPER_MODEL=small` if CPU allows.
3. Continue KAI-046 device checklist when ready.

## Last Completed

- Sync uses paste **or** existing segment JA; disabled-reason Status; larger checkbox.
- `ScriptHelpLayers` on prep/studio/continuous overlays.
- Default Whisper model `base`; align padding + prompt; ASR 422 when 0 segments.

## Blockers

- KAI-046 human device.
- Anime ASR will still often fail — honesty documented; not a scoring claim.

## Safety

- Do not invent Gate A PASS.
- Do not stage grammar dirty files.
