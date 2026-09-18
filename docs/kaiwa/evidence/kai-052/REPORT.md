# KAI-052 — Script-align engine spike

Date: 2026-09-18  
Status: **DONE** (measured on this machine)

Related: ADR-020, `AUTO-SUBTITLE-SPEC.md` §5.2, KAI-051 ingest; re-measure KAI-061 (`base`).

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
set KAIWA_WHISPER_MODEL=base
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

## 3. Timing measurements (TTS fixture, CPU int8)

Source: `results.json` (3 lines, 700 ms silence gaps).

### 3a. `tiny` (first spike)

| Metric | Value |
| --- | --- |
| measuredLines | 3 / 3 |
| median \|Δstart\| | **448 ms** |
| median \|Δend\| | **404 ms** |
| max \|Δstart\| | 780 ms |
| max \|Δend\| | 652 ms |

### 3b. `base` (KAI-061 re-measure, 2026-09-18)

| Metric | Value |
| --- | --- |
| measuredLines | 3 / 3 |
| median \|Δstart\| | **28 ms** |
| median \|Δend\| | **952 ms** |
| max \|Δstart\| | 112 ms |
| max \|Δend\| | 1092 ms |
| ASR hypothesis | `こんにちは今日はいい天気ですね一緒に散歩しませんか` |

**Interpretation:** `base` improves **start** alignment a lot on clean TTS. End times still drift (word envelope / trailing silence) — production sidecar adds ~120 ms pad and marks weak matches `timingUncertain`. **Not** a claim for anime/BGM quality; prefer script-align over ASR-only for drama.

Default product model: **`base`** (`KAIWA_WHISPER_MODEL=small` optional).

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
- Re-measure with `base` recorded under §3b after KAI-061.
