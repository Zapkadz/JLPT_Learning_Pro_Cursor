# KAI-052 — Script-align engine spike

Date: 2026-09-18  
Status: **BLOCKED** (environment) — provisional engine pick documented; **no timing measurements** on this machine.

Related: ADR-020, `AUTO-SUBTITLE-SPEC.md` §5.2, KAI-051 (ingest DONE).

---

## 1. Environment probe (this workspace)

| Check | Result |
| --- | --- |
| `FFMPEG_PATH` / `KAIWA_FFMPEG_PATH` | **unset** |
| `ffmpeg` on PATH / common Win paths | **not found** |
| `.env` speech / Whisper / Azure / Google keys | **no `.env`** |
| Legal short JA video+audio fixture in repo | **none** (media fixtures are generate-only / synthetic) |

Conclusion: cannot extract WAV or run Whisper/MFA/cloud STT here. Field timing delta (**đo lệch thời gian**) is **not possible** until ffmpeg + fixture (and optionally API key) are available.

---

## 2. Engine candidates (from SPEC) — decision for when unblocked

| ID | Approach | JA fit | Fits “keep user script text” | Ops burden | Spike verdict |
| --- | --- | --- | --- | --- | --- |
| **A** | Whisper (word timestamps) + DTW/Needleman vs script | Good ecosystem for JA | **Yes** — take **times only**, discard ASR wording | Medium (local GPU or API) | **Provisional primary** |
| **B** | Forced aligner (MFA / aeneas-like) | JA model pack heavy / uneven | Exact text by design | High install | Secondary if A quality fails on anime/drama |
| **C** | Cloud STT + phrase hints | Managed JA | Depends on vendor display-form | Cost + privacy opt-in | Only if A/B blocked and user accepts opt-in |

**Provisional choice for KAI-053 design:** **Engine A** (Whisper word timestamps + script match).  
**Vendor not locked** — adapter interface must allow swap to B/C without changing draft/revision contract.

Product rule (unchanged): displayed `ja` = user script; engine supplies boundaries; weak windows → `timingUncertain` (schema additive in KAI-053).

---

## 3. Recommended adapter contract (for KAI-053 — do not implement until unblocked)

```ts
// Sketch only — not shipped
type AlignScriptInput = {
  audioPath: string; // mono WAV/PCM from ffmpeg
  scriptLines: string[]; // from parseUntimedScript
  language?: "ja" | "vi";
};

type AlignScriptResult = {
  engine: string;
  segments: Array<{
    ja: string; // === scriptLines[i] (or merge map)
    startMs: number;
    endMs: number;
    timingUncertain?: boolean;
    confidence?: number | null;
  }>;
  provider?: string;
};
```

Pipeline when unblocked:

1. `ffmpeg -i <proxy> -ac 1 -ar 16000 align.wav`
2. Whisper (local `whisper.cpp` / `faster-whisper` **or** API) → word times
3. Align words → script lines (prefer longest common / DTW; never rewrite `ja`)
4. Write **draft** revision only (`source: script_align`)

Honest capability: `scriptAlign.status = not_configured` until adapter + ffmpeg present (KAI-055).

---

## 4. Unblock checklist (owner / machine)

1. Install ffmpeg; set `FFMPEG_PATH` (or `KAIWA_FFMPEG_PATH`).
2. Add a **short legal** JA speech clip under `docs/kaiwa/evidence/kai-052/fixtures/` (or local-only path documented, not committed if copyrighted).
3. Choose runtime: local Whisper **or** cloud key in `.env` (never commit secrets).
4. Re-run spike: measure median |Δstart| / |Δend| vs hand-timed SRT on ≥5 lines; attach numbers to this report.
5. Then mark KAI-052 **DONE** and start KAI-053 job.

---

## 5. What is NOT claimed

- No measured timing accuracy on this date.
- No vendor lock-in.
- No production `align_script` job (KAI-053).
- Manual SRT/VTT + KAI-051 untimed ingest remain the working paths.

## Verification (this task slice)

- Env probe recorded above.
- Docs/TASKS updated to **BLOCKED** with unblock steps.
- `npm test` / build not required for docs-only blocker report (no app code).
