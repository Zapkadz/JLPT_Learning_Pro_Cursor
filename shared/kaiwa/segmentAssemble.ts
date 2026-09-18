/**
 * Segment → learner timeline assembly plan (KAI-039 / ADR-019).
 * Gaps are silence on the learner track; never labeled continuous.
 */

export type SegmentWindow = {
  id: string;
  startMs: number;
  endMs: number;
};

export type ClipForAssemble = {
  segmentId: string;
  status: string;
  audioAssetId: string | null;
};

export type AssemblyPlacement = {
  segmentId: string;
  startMs: number;
  endMs: number;
  status: string;
  audioAssetId: string | null;
  /** True when this window overlaps the previous sorted window. */
  overlapWithPrevious: boolean;
  gapBeforeMs: number;
};

export type SegmentTimelinePlan = {
  durationMs: number;
  placements: AssemblyPlacement[];
  gapTotalMs: number;
  hasOverlap: boolean;
  recordedOrPartial: number;
  skipped: number;
  pending: number;
};

export function buildSegmentTimeline(
  segments: SegmentWindow[],
  clips: ClipForAssemble[],
  preferredDurationMs?: number | null,
): SegmentTimelinePlan {
  const byId = new Map(clips.map((c) => [c.segmentId, c]));
  const sorted = [...segments]
    .filter((s) => Number.isFinite(s.startMs) && Number.isFinite(s.endMs))
    .sort((a, b) => a.startMs - b.startMs || a.endMs - b.endMs);

  const placements: AssemblyPlacement[] = [];
  let gapTotalMs = 0;
  let hasOverlap = false;
  let recordedOrPartial = 0;
  let skipped = 0;
  let pending = 0;
  let prevEnd = 0;

  for (const seg of sorted) {
    const startMs = Math.max(0, Math.round(seg.startMs));
    const endMs = Math.max(startMs, Math.round(seg.endMs));
    const clip = byId.get(seg.id);
    const status = clip?.status || "pending";
    if (status === "recorded" || status === "partial") recordedOrPartial++;
    else if (status === "skipped") skipped++;
    else pending++;

    const gapBeforeMs = Math.max(0, startMs - prevEnd);
    gapTotalMs += gapBeforeMs;
    const overlapWithPrevious = startMs < prevEnd;
    if (overlapWithPrevious) hasOverlap = true;

    placements.push({
      segmentId: seg.id,
      startMs,
      endMs,
      status,
      audioAssetId: clip?.audioAssetId ?? null,
      overlapWithPrevious,
      gapBeforeMs,
    });
    prevEnd = Math.max(prevEnd, endMs);
  }

  const fromPref =
    preferredDurationMs != null && Number.isFinite(preferredDurationMs)
      ? Math.max(0, Math.round(preferredDurationMs))
      : 0;
  const durationMs = Math.max(fromPref, prevEnd, 1);

  return {
    durationMs,
    placements,
    gapTotalMs,
    hasOverlap,
    recordedOrPartial,
    skipped,
    pending,
  };
}

/** PCM mono 16-bit WAV filled with silence — duration matches timeline. */
export function buildSilentWav(
  durationMs: number,
  sampleRate = 48_000,
): Buffer {
  const ms = Math.max(1, Math.round(durationMs));
  const nSamples = Math.max(1, Math.ceil((ms / 1000) * sampleRate));
  const dataBytes = nSamples * 2;
  const buf = Buffer.alloc(44 + dataBytes);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + dataBytes, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(1, 22); // mono
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * 2, 28); // byte rate
  buf.writeUInt16LE(2, 32); // block align
  buf.writeUInt16LE(16, 34); // bits
  buf.write("data", 36);
  buf.writeUInt32LE(dataBytes, 40);
  // samples already zero = silence
  return buf;
}
