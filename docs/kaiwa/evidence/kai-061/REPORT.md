# KAI-061 — Align quality follow-up

Date: 2026-09-18  
Status: **DONE**

## Changes

- Default Whisper model `tiny` → **`base`** (env `KAIWA_WHISPER_MODEL` override)
- Sidecar: beam=5, VAD silence 350ms, script `initial_prompt`, ±120ms pad, stricter uncertain
- Spike re-run on TTS fixture — see `../kai-052/REPORT.md` §3b

## Honesty

Anime/BGM still hard; USAGE tells users to prefer script-sync over ASR-only.
