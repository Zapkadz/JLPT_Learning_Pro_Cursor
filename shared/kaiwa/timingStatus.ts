/**
 * KAI-072 — timing status helpers for editor / studio honesty.
 */

import type { KaiwaSegment } from "./types";

export function isUnmatchedSegment(
  seg: Pick<
    KaiwaSegment,
    "timingStatus" | "assessable" | "assessableReason" | "startMs" | "endMs"
  >,
): boolean {
  if (seg.timingStatus === "unmatched") return true;
  if (seg.assessable === false && seg.assessableReason) {
    // Backend maps unmatched to assessable=false + 0–1 ms placeholder
    if (seg.startMs === 0 && seg.endMs <= 1) return true;
  }
  return false;
}

/** Usable for segment practice / overlay seek (not unmatched). */
export function isSpeakableSegment(seg: KaiwaSegment): boolean {
  if (isUnmatchedSegment(seg)) return false;
  if (!(seg.endMs > seg.startMs)) return false;
  return true;
}

export function isNeedsReviewSegment(seg: KaiwaSegment): boolean {
  if (isUnmatchedSegment(seg)) return false;
  return (
    seg.timingStatus === "needs_review" || Boolean(seg.timingUncertain)
  );
}

export type TimingStatusCounts = {
  total: number;
  proposed: number;
  needsReview: number;
  unmatched: number;
  speakable: number;
};

export function countTimingStatuses(segments: KaiwaSegment[]): TimingStatusCounts {
  let proposed = 0;
  let needsReview = 0;
  let unmatched = 0;
  for (const s of segments) {
    if (isUnmatchedSegment(s)) unmatched += 1;
    else if (isNeedsReviewSegment(s)) needsReview += 1;
    else proposed += 1;
  }
  return {
    total: segments.length,
    proposed,
    needsReview,
    unmatched,
    speakable: proposed + needsReview,
  };
}

export function speakableIndices(segments: KaiwaSegment[]): number[] {
  return segments
    .map((s, i) => (isSpeakableSegment(s) ? i : -1))
    .filter((i) => i >= 0);
}

export function summarizeAlignResultVi(segments: KaiwaSegment[]): string {
  const c = countTimingStatuses(segments);
  const parts = [
    `${c.speakable}/${c.total} đoạn có mốc dùng được`,
  ];
  if (c.needsReview) parts.push(`${c.needsReview} cần kiểm tra`);
  if (c.unmatched) parts.push(`${c.unmatched} chưa khớp (không dùng để thu)`);
  return parts.join(" · ");
}
