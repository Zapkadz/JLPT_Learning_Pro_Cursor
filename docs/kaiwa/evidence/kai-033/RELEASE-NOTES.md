# Kaiwa Gate A — release / rollback notes

Date: 2026-09-18  
Branch: `feat/kaiwa-memory`  
Automated verification at packaging: see `npm test` / KAI-032 evidence (**not** Gate A acceptance).

## What ships in Gate A (product claim)

- Private video upload, probe/proxy playback, manual transcript, prep snapshot
- **Segment practice (default, ADR-019):** on-video script overlay, per-clip record/skip/re-record, subset filters, assemble → `assembly=segment_timeline` (never labeled continuous)
- **Continuous (advanced):** full-video capture + live current/next overlay; journal resume; finalize (mic-only raw)
- Dual-gain review with per-segment status + seek A/B, take history, MP4 export (ffmpeg when configured; else synthetic container + mix snapshot)
- Soft-delete + media GC; optional media backup with MANIFEST
- Activity history without deck/grammar XP injection (ADR-018)
- Assessment: **not configured** — UI/docs must say so
- **Script sync v1 (ADR-020 / KAI-051–055):** paste/`.txt` untimed script → optional `POST …/script-align` (ffmpeg + local Whisper) → **editable draft only** (`source=script_align`); manual SRT/VTT always remains; capability `scriptAlign` honest when not configured

## Out of scope / deferred

- Video-only ASR / auto-translate (KAI-015 / KAI-056–058 v2)
- Pronunciation/prosody scoring (Gate B)
- Speaking XP / streak contribution (KAI-030b)
- Character role-play (KAI-035)
- Mobile recording claim
- OCR hardsubs / PDF script import
- Gate A **device** ACCEPTED until CHECKLIST Chrome+Edge segment flow signed (KAI-046)

## Rollback

1. Stop app / workers.
2. Restore previous SQLite via `better-sqlite3` backup file (never overwrite live DB in place without a second copy).
3. If media was backed up with `--with-media`, restore the `.media` tree beside DB and point `KAIWA_MEDIA_ROOT` / default `data/kaiwa-media` accordingly; verify `MANIFEST.json` checksums (`verifyKaiwaMediaBackup`).
4. Redeploy previous known-good commit of `feat/kaiwa-memory` or `main` as appropriate.
5. Do **not** force-push shared history as part of rollback.

## Config knobs (pilot)

| Env | Purpose |
| --- | --- |
| `DB_PATH` | SQLite path |
| `KAIWA_MEDIA_ROOT` | Private media root |
| `KAIWA_QUOTA_BYTES` | Per-user quota |
| `KAIWA_MAX_UPLOAD_BYTES` | Max upload |
| `FFMPEG_PATH` / `KAIWA_FFMPEG_PATH` | Real export mix + script-align audio extract when set |
| `KAIWA_PYTHON` / `KAIWA_WHISPER_MODEL` | Local Whisper sidecar for script-align (default model `tiny`) |
| `KAIWA_SCRIPT_ALIGN_ENGINE=mock` | Test-only equal-slot aligner (not a production claim) |
| `KAIWA_BACKUP_MEDIA=1` | Include media in `npm run backup` |

## Gate A acceptance gate

Fill and sign `docs/kaiwa/evidence/kai-033/CHECKLIST.md`. Until ACCEPTED there, do not market “Gate A shipped on all devices.”
