# KAI-052 — Script-align engine spike

Date: 2026-09-18  
Status: **DONE** (measured on this machine)

Related: ADR-020, `AUTO-SUBTITLE-SPEC.md` §5.2, KAI-051 ingest.

---

## 1. Environment (after unblock)

| Check | Result |
| --- | --- |
| ffmpeg | **Installed** via winget `Gyan.FFmpeg` 9.0.1 → `%LOCALAPPDATA%\Microsoft\WinGet\Links\ffmpeg.exe` |
| `faster-whisper` + `edge-tts` | Installed for user Python 3.12 |
| Fixture | **Legal synthetic JA TTS** (Microsoft Edge neural `ja-JP-NanamiNeural`), not copyrighted anime |
| Cloud ASR keys | Not required for this spike |

Re-run:

```bat
set FFMPEG_PATH=%LOCALAPPDATA%\Microsoft\WinGet\Links\ffmpeg.exe
set KAIWA_WHISPER_MODEL=tiny
python scripts/kaiwa/spike_script_align.py
```

Artifacts: `fixtures/spike_ja.wav`, `fixtures/script.txt`, `fixtures/ground_truth.json`, `results.json`.

---

## 2. Engine decision

| ID | Approach | Spike result |
| --- | --- | --- |
| **A** | Whisper word timestamps + match; **keep user script text** | **SELECTED** for KAI-053 |
| B | Forced aligner (MFA) | Not run — higher install cost; keep as fallback if A fails on drama/music |
| C | Cloud STT | Not required for pilot if local Whisper works |

**Vendor not locked:** adapter interface should allow swap; default implementation path = `faster-whisper` (local) via worker/sidecar.

Product rule confirmed in code path: aligned payload `ja` = script lines, not ASR hypothesis.

---

## 3. Timing measurements (`tiny` model, CPU int8)

Source: `results.json` (3 lines, 700 ms silence gaps).

| Metric | Value |
| --- | --- |
| measuredLines | 3 / 3 |
| median \|Δstart\| | **448 ms** |
| median \|Δend\| | **404 ms** |
| max \|Δstart\| | 780 ms (line 1 — VAD/trim vs TTS onset) |
| max \|Δend\| | 652 ms |
| ASR hypothesis (reference only) | `こんにちは 今日はいい天気ですね一緒に散歩しませんか` |

Per-line deltas are in `results.json` → `deltas`.

**Interpretation:** ~0.4 s median error on clean TTS + `tiny` is **good enough to proceed** to a draft-only job with editor review and `timingUncertain` when match is weak. Expect better with `base`/`small` and optional edge padding in KAI-053. Not a claim of anime/drama production quality.

---

## 4. KAI-053 implications

1. Require `FFMPEG_PATH` (or WinGet Links fallback) to extract mono 16 kHz WAV from project proxy.
2. Run align via local Whisper sidecar (or future cloud adapter); write **draft only** with `source: script_align`.
3. Prefer script text; mark uncertain windows; never auto-publish.
4. Capability `scriptAlign`: `ready` when ffmpeg + model present, else `not_configured` + manual fallback.

---

## 5. Verification

- Spike script exit 0; `results.json` written with real numbers (not invented).
- Fixture is TTS-generated (reproducible, legal).
- Manual SRT / KAI-051 ingest paths unchanged.
