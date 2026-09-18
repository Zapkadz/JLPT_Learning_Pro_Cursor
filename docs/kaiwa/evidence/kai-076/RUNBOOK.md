# KAI-076 — Held-out / anime user evaluation runbook

Date: 2026-09-18  
Status: **Scaffold READY** — evidence rows stay empty until you run clips **outside git**.

## Hard rules

1. **Never** commit anime, personal recordings, or private WAVs/MP4s into this repo.
2. Put media under a local folder, e.g. `%USERPROFILE%\kaiwa-held-out\` (or `$env:KAIWA_HELD_OUT_DIR`).
3. Results JSON may be copied into `docs/kaiwa/evidence/kai-076/` **only if** they contain metrics + paths as strings — **no** embedded audio/base64.
4. Do **not** average heavy-BGM clips into the “clean dialogue” median. Report BGM separately.

## What to measure

For each clip:

| Field | How |
|-------|-----|
| `editMinutes` | Wall-clock minutes you spent fixing timings in the editor (waveform / lock / realign) |
| `videoMinutes` | Clip duration in minutes |
| `editPerVideoMin` | `editMinutes / videoMinutes` |
| `linesTotal` / `linesOkWithoutEdit` | After auto-align, how many lines you left alone |
| `category` | `clean_dialogue` \| `light_bgm` \| `heavy_bgm` \| `overlap` \| `other` |

Acceptance discussion target (not a ship claim): usable if clean-dialogue edit burden is tolerable for you — record the number; do not invent marketing %.

## Steps

1. Prepare media locally (script text + video/audio). Prefer **script sync (v1)** over ASR for anime.
2. `npm run kaiwa:speech-env` — confirm smoke `ready` (or note `degraded`).
3. In Kaiwa: create project → upload → prepare media → paste script → sync → fix with waveform/locks.
4. Fill one row per clip in `RESULTS.template.json` (copy to your private folder as `results.json`).
5. Optional: `npm run kaiwa:held-out` — validates JSON schema locally and prints a summary table (reads `KAIWA_HELD_OUT_DIR`).
6. If you want metrics in-repo: copy **only** the summary JSON (no media) to `docs/kaiwa/evidence/kai-076/results.user.json` and tell the agent to mark KAI-076 DONE.

## Suggested private layout

```text
%USERPROFILE%\kaiwa-held-out\
  clips\
    01-show-ep1\
      video.mp4          # private
      script.txt
  results.json           # metrics only OK to copy later
```

## Out of scope

- Committing copyrighted video
- Claiming “anime fixed”
- Mixing heavy BGM into clean-dialogue averages
