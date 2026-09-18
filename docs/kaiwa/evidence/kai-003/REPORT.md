# KAI-003 — Japanese scoring capability spike

Date: 2026-09-17
Status: DONE (research + contracts; **no live provider call** — credentials absent)
Related: ADR-014, ADR-017; PLAN §10

## 1. Credential / live-sample status

| Item | State |
|------|--------|
| `AZURE_SPEECH_KEY` / region | **Not set** in environment |
| Other speech keys / GCP creds / `.env` | **Not present** |
| Live ja-JP pronunciation API sample | **NOT RUN** — would be fabricated if invented |
| Live result artifact | **UNAVAILABLE** — reason: `missing_credentials` |

When credentials exist later: store redacted JSON samples under `docs/kaiwa/evidence/kai-003/live/` (no audio blobs; strip subscription identifiers). Re-run checklist at end of this doc.

## 2. Capability map (documentation-backed, locale `ja-JP`)

Sources (checked 2026-09-17):

- [Azure pronunciation assessment how-to](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-pronunciation-assessment) — **Prosody assessment is only available in `en-US`.**
- [Azure language support — pronunciation assessment locales](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support?tabs=pronunciation-assessment) — **`ja-JP` is listed** among pronunciation-assessment locales.
- Azure GitHub issue #2237 (community): Japanese phoneme/syllable strings may be empty; Microsoft note points at phoneme-alphabet locale limits (IPA/SAPI primarily `en-US` / `zh-CN` for names).

### Candidate: Azure Speech Pronunciation Assessment (`ja-JP`)

| Capability | Claim for ja-JP | Kotoba may expose as |
|------------|-----------------|----------------------|
| Scripted assessment vs reference text | Documented locale support | Optional provider adapter after live verify |
| Accuracy / fluency / completeness style scores | Documented for PA generally; **must verify live JSON fields for ja-JP** | Only fields present in live response |
| `ProsodyScore` / EnableProsodyAssessment | **Docs: en-US only** | **FORBIDDEN as Japanese intonation** |
| Phoneme / syllable labels | Often empty / limited for ja-JP | Do not invent mora errors from empty phonemes |
| ASR confidence | Available on STT paths | **FORBIDDEN as pronunciation score** |
| Content assessment (vocab/grammar/topic) | Docs: content+prosody en-US oriented | Not used for Kaiwa JA speaking |

**Azure is a candidate, not a locked vendor** (ADR-014 / product decisions).

### Candidate: In-house signal features (no cloud)

| Capability | Notes | Allowed conclusion |
|------------|-------|--------------------|
| Silence / clipping / noise gate | Local DSP (KAI-024) | `NOT_ASSESSABLE` + reason |
| Alignment / coverage vs transcript | Forced align or DTW after ASR/text | Missing speech vs data gap |
| Timing / mora duration proxies | Relative to reference take | Rhythm hints only with confidence |
| F0 contour (relative) | Voiced frames only; gender-normalized relative shape | Contour similarity / direction — **not** “wrong pitch accent word X” unless lexicon+teacher rubric exists |
| Waveform amplitude similarity | Easy to compute | **FORBIDDEN as intonation/ability** |

### Candidate: Other cloud STT/LLM

| Capability | Notes |
|------------|-------|
| STT transcript only | Useful for coverage; confidence ≠ pronunciation |
| LLM text critique of STT | May explain evidence; **must not invent phonetics from text alone** (IMPLEMENTATION-RULES §4) |

## 3. Allowed vs forbidden conclusions

### Allowed (when evidence exists)

- Audio quality insufficient → ask re-record / skip segment (`UNAVAILABLE` / `NOT_ASSESSABLE` + reason).
- Coverage: which segments appear spoken vs skipped (with alignment uncertainty flag).
- Provider-reported accuracy/fluency/completeness **only if** live ja-JP payload contains those fields and benchmark passes Gate B thresholds.
- Relative timing / pause issues vs reference when alignment confidence is high.
- Relative F0 contour notes (up/down / flat vs reference) with explicit “not pitch-accent diagnosis” wording.
- Qualitative Vietnamese coaching text that **only restates structured evidence**.

### Forbidden

- ASR confidence → pronunciation score.
- Waveform / MFCC similarity → intonation or “speaking ability”.
- Absolute pitch / timbre / gender → ability score.
- Azure `ProsodyScore` (or enabling prosody) presented as **Japanese** intonation quality.
- Phoneme error labels when provider returns empty phonemes.
- Fake `0` / `100` / random fill when evidence missing.
- Blocking export/playback on scoring failure (ADR-014).

## 4. Fallback design (Gate A without scoring)

1. Manual / imported transcript + continuous record + playback + export **fully usable** with assessment status `not_configured` / `UNAVAILABLE`.
2. UI shows separate **Export ready** vs **Feedback ready**.
3. If provider errors/timeouts: keep take; queue assessment job failed with reason; user can retry assessment later.
4. Optional local-only quality gate (silence/clipping) may run without cloud.

## 5. Evidence schema (draft for KAI-026+)

```ts
// Conceptual — implement in shared/kaiwa later
type AssessmentStatus =
  | "pending"
  | "ready"
  | "unavailable"
  | "not_assessable"
  | "failed";

type SegmentAssessment = {
  attemptId: string;
  segmentId: string;
  status: AssessmentStatus;
  reason?: string; // e.g. missing_credentials | empty_audio | low_alignment | provider_timeout
  provider?: { id: string; modelVersion: string; locale: "ja-JP" };
  metrics: {
    accuracy?: number | null;
    fluency?: number | null;
    completeness?: number | null;
    // prosody intentionally omitted unless locale-verified
    coverage?: number | null;
    timingDriftMs?: number | null;
    f0ContourScore?: number | null; // relative only; nullable
  };
  confidence?: number | null;
  evidence?: { startMs: number; endMs: number; notes?: string[] };
  rubricVersion: string;
};
```

## 6. Benchmark outline (Gate B / KAI-023+)

From PLAN §10.3 — **design only** here:

| Item | Pilot proposal |
|------|----------------|
| Items | ~30 utterances covering 長音/促音/节奏/疑問 vs 平叙 |
| Takes | ≥150 licensed/own recordings; multi speaker (VN learners + natural JA refs) |
| Splits | Train/calibration vs held-out **by speaker** |
| Raters | 2 Japanese-competent reviewers; adjudicate disagreements |
| Metrics | Precision of concrete error flags; false-flag rate on acceptable speech; coverage; latency; cost |
| Trial thresholds | ≥90% confirmed-correct flags; ≤5% false flags on “acceptable” set — adjustable only via recorded decision |
| Freeze | Held-out frozen before final scoring algorithm peek |

Until benchmark exists: show per-dimension evidence / qualitative feedback; **no** marketing overall “JLPT speaking score”.

## 7. Rubric dimensions (product)

| Dimension | Gate | Engine path |
|-----------|------|-------------|
| Audio quality | A helpful / B required | Local |
| Completion / coverage | B | Align + optional STT |
| Pronunciation | B | Cloud PA **after** live field verify + benchmark |
| Rhythm / timing | B | Local + optional provider fluency |
| Intonation (relative) | B research | Local F0; **not** Azure Prosody for ja-JP |
| Pitch-accent word errors | Later | Only with lexicon + teacher labels |

## 8. Open decisions

| ID | Decision | Blocker? |
|----|----------|----------|
| OD-002a | Which cloud PA vendor to integrate first after live spike | Blocks KAI-026 adapter choice, **not** Gate A |
| OD-002b | Budget / region / data-retention disclosure copy | Before first external send |
| OD-002c | Whether in-house F0 ships in Gate B v1 | KAI-027 |

## 9. Live verify checklist (when keys appear)

1. Set keys via env (never commit).
2. Scripted ja-JP utterance vs known reference WAV (fixture with license).
3. Dump redacted JSON: list actual score fields, phoneme arrays, prosody presence.
4. Confirm ProsodyScore absent or ignored for ja-JP.
5. Append `docs/kaiwa/evidence/kai-003/live/README.md` + sample; update this report.
6. Only then implement production adapter (KAI-026).

## 10. Verification of this task

- [x] Capability map for ja-JP from current vendor docs
- [x] Allowed/forbidden conclusions listed
- [x] Fallback without API documented
- [x] Benchmark outline captured
- [x] Missing credentials explicit; **no fake live scores**
- [x] ADR-017 records durable scoring-contract rules (no vendor lock)
