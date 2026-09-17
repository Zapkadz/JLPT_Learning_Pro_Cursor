# KAI-002 — Continuous capture spike report

Date: 2026-09-17
Harness: `docs/kaiwa/evidence/kai-002/harness/index.html`
Runner: `npm run kaiwa:capture-spike` → `scripts/kaiwa/run-capture-spike.mjs`
ADR: ADR-016

## 1. Goal

Validate continuous full-video capture for Gate A: codec/MIME, mic path, video clock, latency/drift, EOF/interrupt hooks. **Do not** use chunk count as the timeline clock.

Target (PLAN §12): drift ≤ **100 ms** at head/mid/tail on supported environments (pilot up to 10 minutes).

## 2. Method

1. Synthetic lesson video = canvas `captureStream(30)` + Web Audio oscillator (CI mic path).
2. Record mic-only via `MediaRecorder` with `timeslice` for journal diagnostics only.
3. Markers: `head`, `mid` (`duration/2`), `tail_before_stop`.
4. Drift: `mappedSec = (perfNow - t0Perf)/1000 + t0Video`; `driftMs = (video.currentTime - mappedSec)*1000`.
5. Playwright Chromium + fake media flags; metrics JSON only (**no audio blobs**). Chunk arrays omitted from committed JSON.

## 3. Results (HeadlessChrome / Windows lab)

| Run | Duration | MIME | Chunks | head | mid | tail | ≤100 ms |
|-----|----------|------|--------|------|-----|------|---------|
| Lab A | 20 s | `audio/webm;codecs=opus` | 19 | ≈ −3 ms | ≈ −11 ms | ≈ −10 ms | **PASS** |
| Lab B | 120 s | same | 117 | ≈ 0 ms | ≈ −14 ms | ≈ +2 ms | **PASS** |
| Lab C | **600 s (10 min)** | same | 588 | ≈ 0 ms | ≈ 0 ms | ≈ +9 ms | **PASS** |

Evidence files: `metrics-20000ms-*.json`, `metrics-120000ms-*.json`, `metrics-600000ms-*.json`, `metrics-latest.json`.

### MIME support

Preferred: **`audio/webm;codecs=opus`**. Also `audio/webm`, `audio/mp4` reported supported; `audio/ogg;codecs=opus` false in this Chromium.

### Clock conclusions

- Video/perf mapping stayed within 100 ms through **10 minutes** in this synthetic lab.
- Chunk count tracks timeslice roughly; it is diagnostic only.
- Track-stop EOF and interrupt hooks are present in the harness.

### Still open (not Gate A blockers for stack choice)

- Real microphone / device-loss matrix (manual + KAI-004)
- Background-tab throttling across OS
- Partial WebM remux after crash (KAI-019/020)
- Non-Chromium recording claims

## 4. Decision → ADR-016

**MediaRecorder + Opus/WebM + video.currentTime/performance clock.** AudioWorklet PCM journal deferred.

## 5. Re-run

```bash
npm run kaiwa:capture-spike
npm run kaiwa:capture-spike -- --durationMs=120000
npm run kaiwa:capture-spike -- --durationMs=600000
```

## 6. Verification

- [x] Harness + runner
- [x] Head/mid/tail metrics including **10‑minute** PASS
- [x] ADR-016
- [x] No Grammar/FSRS behaviour change; no media blobs committed
