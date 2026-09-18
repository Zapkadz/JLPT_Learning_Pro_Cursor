/**
 * Segment clip progress helpers (KAI-037 / ADR-019).
 */

export type CaptureMode = "segment" | "continuous";

export type SegmentClipStatus =
  | "pending"
  | "recorded"
  | "skipped"
  | "partial";

export type SegmentClipProgress = {
  total: number;
  recorded: number;
  skipped: number;
  partial: number;
  pending: number;
};

export function isCaptureMode(v: unknown): v is CaptureMode {
  return v === "segment" || v === "continuous";
}

export function summarizeSegmentProgress(
  statuses: SegmentClipStatus[],
): SegmentClipProgress {
  const out: SegmentClipProgress = {
    total: statuses.length,
    recorded: 0,
    skipped: 0,
    partial: 0,
    pending: 0,
  };
  for (const s of statuses) {
    if (s === "recorded") out.recorded++;
    else if (s === "skipped") out.skipped++;
    else if (s === "partial") out.partial++;
    else out.pending++;
  }
  return out;
}

/** Merge planned segment ids with latest clip status per id. */
export function progressFromClips(
  segmentIds: string[],
  clips: Array<{ segmentId: string; status: SegmentClipStatus }>,
): SegmentClipProgress {
  const byId = new Map(clips.map((c) => [c.segmentId, c.status]));
  return summarizeSegmentProgress(
    segmentIds.map((id) => byId.get(id) ?? "pending"),
  );
}
