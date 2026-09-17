import type { KaiwaSegment } from "./types";

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `seg-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export type SubtitleParseIssue = {
  code:
    | "bad_timestamp"
    | "end_before_start"
    | "empty_cue"
    | "outside_duration"
    | "overlap"
    | "markup_stripped";
  message: string;
  cueIndex?: number;
};

export type ParsedSubtitles = {
  format: "srt" | "vtt" | "unknown";
  segments: KaiwaSegment[];
  issues: SubtitleParseIssue[];
};

/** Strip HTML-like tags so cue text never executes markup. */
export function stripSubtitleMarkup(text: string): {
  text: string;
  stripped: boolean;
} {
  const stripped = /<[^>]+>/.test(text);
  const clean = text
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/\r/g, "")
    .trim();
  return { text: clean, stripped };
}

function parseTimestampToMs(raw: string): number | null {
  const s = raw.trim().replace(",", ".");
  // HH:MM:SS.mmm or MM:SS.mmm
  const m = /^(?:(\d{1,2}):)?(\d{1,2}):(\d{1,2})(?:[.](\d{1,3}))?$/.exec(s);
  if (!m) return null;
  const h = m[1] ? Number(m[1]) : 0;
  const min = Number(m[2]);
  const sec = Number(m[3]);
  const ms = m[4] ? Number(m[4].padEnd(3, "0")) : 0;
  if (![h, min, sec, ms].every((n) => Number.isFinite(n))) return null;
  return ((h * 60 + min) * 60 + sec) * 1000 + ms;
}

function normalizeNewlines(input: string): string {
  // Strip UTF-8 BOM
  const noBom = input.replace(/^\uFEFF/, "");
  return noBom.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function detectFormat(text: string): "srt" | "vtt" | "unknown" {
  const head = text.slice(0, 32).trimStart().toUpperCase();
  if (head.startsWith("WEBVTT")) return "vtt";
  if (/\d+\s*\n\d{1,2}:\d{2}:\d{2}[,.]\d{1,3}\s*-->/.test(text)) return "srt";
  if (/\d{1,2}:\d{2}:\d{2}[,.]\d{1,3}\s*-->/.test(text)) return "srt";
  return "unknown";
}

type RawCue = { startMs: number; endMs: number; text: string; index: number };

function parseCueBlocks(text: string, format: "srt" | "vtt"): {
  cues: RawCue[];
  issues: SubtitleParseIssue[];
} {
  const issues: SubtitleParseIssue[] = [];
  let body = text;
  if (format === "vtt") {
    body = body.replace(/^WEBVTT[^\n]*\n+/i, "");
    // Drop NOTE / STYLE blocks (best-effort)
    body = body.replace(/^(NOTE|STYLE)[\s\S]*?(?:\n\n|$)/gm, "\n");
  }
  const blocks = body
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);
  const cues: RawCue[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const lines = blocks[i].split("\n").map((l) => l.trimEnd());
    let timeLineIdx = lines.findIndex((l) => l.includes("-->"));
    if (timeLineIdx < 0) continue;
    // Skip optional numeric index line for SRT
    if (
      timeLineIdx === 1 &&
      /^\d+$/.test(lines[0].trim()) &&
      format === "srt"
    ) {
      /* ok */
    }
    const timeLine = lines[timeLineIdx].replace(/-->/g, "-->");
    const parts = timeLine.split("-->");
    if (parts.length < 2) {
      issues.push({
        code: "bad_timestamp",
        message: "Dòng thời gian không hợp lệ.",
        cueIndex: i,
      });
      continue;
    }
    const startMs = parseTimestampToMs(parts[0]);
    const endRaw = parts[1].trim().split(/\s+/)[0];
    const endMs = parseTimestampToMs(endRaw);
    if (startMs == null || endMs == null) {
      issues.push({
        code: "bad_timestamp",
        message: "Không đọc được mốc thời gian.",
        cueIndex: i,
      });
      continue;
    }
    if (endMs <= startMs) {
      issues.push({
        code: "end_before_start",
        message: "end≤start — bỏ qua cue.",
        cueIndex: i,
      });
      continue;
    }
    const textLines = lines.slice(timeLineIdx + 1);
    const joined = textLines.join("\n");
    const { text: clean, stripped } = stripSubtitleMarkup(joined);
    if (stripped) {
      issues.push({
        code: "markup_stripped",
        message: "Đã gỡ markup HTML khỏi lời thoại.",
        cueIndex: i,
      });
    }
    if (!clean) {
      issues.push({
        code: "empty_cue",
        message: "Cue trống sau khi làm sạch.",
        cueIndex: i,
      });
      continue;
    }
    cues.push({ startMs, endMs, text: clean, index: i });
  }
  return { cues, issues };
}

export function findOverlaps(
  segments: { startMs: number; endMs: number }[],
): number[] {
  const flagged = new Set<number>();
  const sorted = segments
    .map((s, i) => ({ ...s, i }))
    .sort((a, b) => a.startMs - b.startMs || a.endMs - b.endMs);
  for (let a = 0; a < sorted.length; a++) {
    for (let b = a + 1; b < sorted.length; b++) {
      if (sorted[b].startMs >= sorted[a].endMs) break;
      flagged.add(sorted[a].i);
      flagged.add(sorted[b].i);
    }
  }
  return [...flagged];
}

export function parseSubtitles(
  input: string,
  opts: { durationMs?: number | null } = {},
): ParsedSubtitles {
  const text = normalizeNewlines(input);
  const format = detectFormat(text);
  if (format === "unknown") {
    return {
      format,
      segments: [],
      issues: [
        {
          code: "bad_timestamp",
          message: "Không nhận diện được SRT hoặc VTT.",
        },
      ],
    };
  }
  const { cues, issues } = parseCueBlocks(text, format);
  const durationMs = opts.durationMs ?? null;
  const segments: KaiwaSegment[] = [];

  for (const cue of cues) {
    if (
      durationMs != null &&
      (cue.startMs > durationMs || cue.endMs > durationMs + 250)
    ) {
      issues.push({
        code: "outside_duration",
        message: "Cue nằm ngoài thời lượng video.",
        cueIndex: cue.index,
      });
      continue;
    }
    segments.push({
      id: newId(),
      startMs: cue.startMs,
      endMs: cue.endMs,
      ja: cue.text.slice(0, 4000),
      reviewState: "draft",
      assessable: true,
    });
  }

  const overlapIdx = findOverlaps(segments);
  for (const i of overlapIdx) {
    issues.push({
      code: "overlap",
      message: `Đoạn #${i + 1} chồng thời gian với đoạn khác.`,
      cueIndex: i,
    });
  }

  return { format, segments, issues };
}

export function splitSegment(
  segment: KaiwaSegment,
  atMs: number,
): [KaiwaSegment, KaiwaSegment] | null {
  if (atMs <= segment.startMs || atMs >= segment.endMs) return null;
  const left: KaiwaSegment = {
    ...segment,
    id: newId(),
    endMs: atMs,
  };
  const right: KaiwaSegment = {
    ...segment,
    id: newId(),
    startMs: atMs,
  };
  return [left, right];
}

export function mergeSegments(
  a: KaiwaSegment,
  b: KaiwaSegment,
): KaiwaSegment | null {
  const first = a.startMs <= b.startMs ? a : b;
  const second = first === a ? b : a;
  if (second.startMs > first.endMs + 1) return null;
  return {
    id: newId(),
    startMs: first.startMs,
    endMs: Math.max(first.endMs, second.endMs),
    ja: [first.ja, second.ja].filter(Boolean).join("\n").slice(0, 4000),
    vi: [first.vi, second.vi].filter(Boolean).join("\n").slice(0, 4000) || undefined,
    reviewState: "draft",
    assessable: first.assessable && second.assessable,
    speakerLabel: first.speakerLabel ?? second.speakerLabel ?? null,
  };
}
