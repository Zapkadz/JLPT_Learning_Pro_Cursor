# Kaiwa Gate A — release / rollback notes

Date: 2026-09-18  
Branch: `feat/kaiwa-memory`  
Automated verification at packaging: see `npm test` / KAI-032 evidence (**not** Gate A acceptance).

## What ships in Gate A (product claim)

- Private video upload, probe/proxy playback, manual transcript, prep snapshot
- Continuous full-video capture, journal resume, finalize (mic-only raw)
- Dual-gain review, take history, MP4 export (ffmpeg when configured; else synthetic container + mix snapshot)
- Soft-delete + media GC; optional media backup with MANIFEST
- Activity history without deck/grammar XP injection (ADR-018)
- Assessment: **not configured** — UI/docs must say so

## Out of scope / deferred

- ASR/auto-translate (KAI-015), pronunciation/prosody scoring (Gate B)
- Speaking XP / streak contribution (KAI-030b)
- Character role-play (KAI-035)
- Mobile recording claim

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
| `FFMPEG_PATH` / `KAIWA_FFMPEG_PATH` | Real export mix when set |
| `KAIWA_BACKUP_MEDIA=1` | Include media in `npm run backup` |

## Gate A acceptance gate

Fill and sign `docs/kaiwa/evidence/kai-033/CHECKLIST.md`. Until ACCEPTED there, do not market “Gate A shipped on all devices.”
