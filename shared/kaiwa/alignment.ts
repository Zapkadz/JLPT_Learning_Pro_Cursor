/**
 * Utterance / timeline alignment against attempt capture (KAI-025).
 * Video/proxy clock is authoritative. Never invents phoneme-level errors.
 */

export type AlignmentStatus =
  | "aligned"
  | "uncertain"
  | "missing_speech"
  | "data_gap"
  | "out_of_range"
  | "skipped";

export type AlignableSegment = {
  id: string;
  startMs: number;
  endMs: number;
  ja?: string;
  assessable?: boolean;
};

export type AlignedSegment = {
  segmentId: string;
  /** Inclusive start on attempt/video timeline (ms). */
  alignedStartMs: number;
  /** Exclusive-ish end on attempt timeline (ms). */
  alignedEndMs: number;
  /** Padding kept around edges — do not trim for “neat” scores. */
  padBeforeMs: number;
  padAfterMs: number;
  status: AlignmentStatus;
  reason: string | null;
  /** Seek targets for A/B listen on review. */
  listen: {
    referenceStartMs: number;
    referenceEndMs: number;
    learnerStartMs: number;
    learnerEndMs: number;
  };
  /** Never populated with fake phoneme errors from weak alignment. */
  phonemeClaimsAllowed: false;
};

export type AlignmentReport = {
  engine: "kaiwa-align-v1";
  attemptDurationMs: number;
  completion: string | null;
  tailMissing: boolean;
  offsetMs: number;
  segments: AlignedSegment[];
  coverage: {
    plannedMs: number;
    alignedMs: number;
    missingSpeechMs: number;
    dataGapMs: number;
    uncertainCount: number;
  };
  messageVi: string;
};

export type AlignOptions = {
  attemptDurationMs: number;
  completion?: string | null;
  tailMissing?: boolean;
  /** System capture latency compensation only — not learner lateness. */
  offsetMs?: number;
  edgePadMs?: number;
  /** Segments longer than this get split markers (not hard-cut syllables). */
  maxUtteranceMs?: number;
};

const DEFAULT_PAD = 80;
const DEFAULT_MAX_UTTERANCE = 12_000;

export function alignSegmentsToAttempt(
  segments: AlignableSegment[],
  opts: AlignOptions,
): AlignmentReport {
  const duration = Math.max(0, Math.floor(opts.attemptDurationMs));
  const offset = Math.round(opts.offsetMs ?? 0);
  const pad = Math.max(0, opts.edgePadMs ?? DEFAULT_PAD);
  const maxUtt = opts.maxUtteranceMs ?? DEFAULT_MAX_UTTERANCE;
  const completion = opts.completion ?? null;
  const tailMissing = Boolean(opts.tailMissing);

  const out: AlignedSegment[] = [];
  let plannedMs = 0;
  let alignedMs = 0;
  let missingSpeechMs = 0;
  let dataGapMs = 0;
  let uncertainCount = 0;

  for (const seg of segments) {
    const rawStart = seg.startMs;
    const rawEnd = seg.endMs;
    const planned = Math.max(0, rawEnd - rawStart);
    plannedMs += planned;

    if (!(rawEnd > rawStart) || seg.assessable === false) {
      out.push(
        makeRow(seg, rawStart, rawEnd, pad, "skipped", "Đoạn không assessable hoặc timeline lỗi.", false),
      );
      continue;
    }

    // Apply system offset only.
    let start = rawStart + offset;
    let end = rawEnd + offset;

    if (start >= duration) {
      const status: AlignmentStatus =
        completion === "interrupted" || tailMissing ? "data_gap" : "missing_speech";
      const gap = planned;
      if (status === "data_gap") dataGapMs += gap;
      else missingSpeechMs += gap;
      out.push(
        makeRow(
          seg,
          duration,
          duration,
          pad,
          status,
          status === "data_gap"
            ? "Ngoài phần đã ghi (gián đoạn/thiếu đuôi) — khoảng trống dữ liệu, không kết luận người học bỏ câu."
            : "Ngoài thời lượng đã thu — thiếu lời nói trên bản thu (không bịa lỗi âm vị).",
          false,
        ),
      );
      continue;
    }

    if (end > duration) {
      // Partial capture of this segment
      const clippedEnd = duration;
      const lost = Math.max(0, end - duration);
      end = clippedEnd;
      if (completion === "interrupted" || tailMissing) {
        dataGapMs += lost;
        uncertainCount++;
        const row = makeRow(
          seg,
          Math.max(0, start),
          end,
          pad,
          "uncertain",
          "Đoạn bị cắt bởi EOF/interruption — alignment không chắc; không khẳng định lỗi âm vị.",
          true,
        );
        alignedMs += Math.max(0, row.alignedEndMs - row.alignedStartMs);
        out.push(row);
        continue;
      }
      missingSpeechMs += lost;
    }

    start = Math.max(0, start);
    end = Math.min(duration, end);

    if (end - start < 40) {
      uncertainCount++;
      out.push(
        makeRow(
          seg,
          start,
          end,
          pad,
          "uncertain",
          "Khoảng căn chỉnh quá ngắn — không đủ tin cậy để kết luận.",
          false,
        ),
      );
      continue;
    }

    if (planned > maxUtt) {
      uncertainCount++;
      const row = makeRow(
        seg,
        start,
        end,
        pad,
        "uncertain",
        "Câu quá dài so với ngưỡng tạm — giữ nguyên biên; tách ngữ cảnh ở bước sau, không time-warp che lỗi.",
        true,
      );
      alignedMs += Math.max(0, row.alignedEndMs - row.alignedStartMs);
      out.push(row);
      continue;
    }

    const row = makeRow(seg, start, end, pad, "aligned", null, true);
    alignedMs += Math.max(0, row.alignedEndMs - row.alignedStartMs);
    out.push(row);
  }

  return {
    engine: "kaiwa-align-v1",
    attemptDurationMs: duration,
    completion,
    tailMissing,
    offsetMs: offset,
    segments: out,
    coverage: {
      plannedMs,
      alignedMs,
      missingSpeechMs,
      dataGapMs,
      uncertainCount,
    },
    messageVi:
      uncertainCount > 0 || dataGapMs > 0
        ? "Căn chỉnh có vùng uncertain/data_gap — không sinh lỗi âm vị khẳng định trên vùng yếu."
        : "Căn chỉnh theo đồng hồ video/attempt (offset hệ thống). Đây không phải điểm phát âm.",
  };
}

function makeRow(
  seg: AlignableSegment,
  start: number,
  end: number,
  pad: number,
  status: AlignmentStatus,
  reason: string | null,
  withPad: boolean,
): AlignedSegment {
  const padBefore = withPad ? pad : 0;
  const padAfter = withPad ? pad : 0;
  const alignedStartMs = Math.max(0, start - padBefore);
  const alignedEndMs = Math.max(alignedStartMs, end + padAfter);
  return {
    segmentId: seg.id,
    alignedStartMs,
    alignedEndMs,
    padBeforeMs: padBefore,
    padAfterMs: padAfter,
    status,
    reason,
    listen: {
      referenceStartMs: alignedStartMs,
      referenceEndMs: alignedEndMs,
      learnerStartMs: alignedStartMs,
      learnerEndMs: alignedEndMs,
    },
    phonemeClaimsAllowed: false,
  };
}

/** Split a long segment into contiguous windows without inventing word boundaries. */
export function splitLongSegment(
  seg: AlignableSegment,
  maxMs: number,
): AlignableSegment[] {
  if (seg.endMs - seg.startMs <= maxMs) return [seg];
  const parts: AlignableSegment[] = [];
  let cursor = seg.startMs;
  let i = 0;
  while (cursor < seg.endMs) {
    const end = Math.min(seg.endMs, cursor + maxMs);
    parts.push({
      id: `${seg.id}~${i}`,
      startMs: cursor,
      endMs: end,
      ja: seg.ja,
      assessable: seg.assessable,
    });
    cursor = end;
    i++;
  }
  return parts;
}
