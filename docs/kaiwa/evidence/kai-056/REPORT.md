# KAI-056 / 057 / 058 — Auto subtitle v2 (ASR)

Date: 2026-09-18  
Status: **DONE** (local Whisper pilot path)

## Delivered

### KAI-056
- `POST /kaiwa/projects/:id/transcriptions` live when `transcription.status=ready`
- `createTranscriptionService` + `scripts/kaiwa/transcribe_sidecar.py`
- Draft `source=asr`, all segments `timingUncertain`
- 503 + `speech_not_configured` when ffmpeg/Whisper missing
- Mock engine `KAIWA_ASR_ENGINE=mock` for tests

### KAI-057
- Editor CTA 「Tự tạo phụ đề từ video (ASR)」 + consent + stronger ASR draft banner

### KAI-058
- USAGE-GATE-A + RELEASE-NOTES updated for v1+v2 honesty

## Verification

- `npm test` (transcription + speech-capability + script-align)
- `npm run build`

## Honesty

- No auto-publish
- Manual path always available
- ASR text is hypothesis — UI warns strongly
