import { openSync, readSync, closeSync, fstatSync } from "node:fs";
import type { MediaProbe, MediaProbeResult } from "./types";

function readPrefix(path: string, max = 256 * 1024): Buffer {
  const fd = openSync(path, "r");
  try {
    const size = fstatSync(fd).size;
    if (size <= 0) return Buffer.alloc(0);
    const buf = Buffer.alloc(Math.min(size, max));
    readSync(fd, buf, 0, buf.length, 0);
    return buf;
  } finally {
    closeSync(fd);
  }
}

function findBox(buf: Buffer, type: string, start = 0): { offset: number; size: number } | null {
  let i = start;
  while (i + 8 <= buf.length) {
    let size = buf.readUInt32BE(i);
    const box = buf.toString("ascii", i + 4, i + 8);
    if (size === 1) {
      if (i + 16 > buf.length) return null;
      size = Number(buf.readBigUInt64BE(i + 8));
    } else if (size === 0) size = buf.length - i;
    if (size < 8 || i + size > buf.length) return null;
    if (box === type) return { offset: i, size };
    i += size;
  }
  return null;
}

/** Best-effort ISO-BMFF duration from moov/mvhd in the first chunk of the file. */
function probeMp4(buf: Buffer): MediaProbeResult {
  if (buf.length < 12) {
    return {
      ok: false,
      code: "corrupt",
      message: "Tệp MP4 quá ngắn hoặc bị cắt.",
      probeEngine: "sniff",
    };
  }
  const ftyp = findBox(buf, "ftyp");
  if (!ftyp) {
    return {
      ok: false,
      code: "corrupt",
      message: "Thiếu hộp ftyp — không phải MP4 hợp lệ.",
      probeEngine: "sniff",
    };
  }
  const moov = findBox(buf, "moov");
  if (!moov) {
    // moov may be at end (not in prefix) — container looks like mp4 but incomplete metadata in window
    return {
      ok: true,
      container: "mp4",
      durationMs: null,
      hasVideo: true,
      hasAudio: false,
      videoCodec: null,
      audioCodec: null,
      width: null,
      height: null,
      rotation: null,
      probeEngine: "sniff",
    };
  }
  const mvhd = findBox(buf, "mvhd", moov.offset + 8);
  let durationMs: number | null = null;
  if (mvhd) {
    const ver = buf[mvhd.offset + 8];
    if (ver === 0 && mvhd.offset + 32 <= buf.length) {
      const timescale = buf.readUInt32BE(mvhd.offset + 20);
      const duration = buf.readUInt32BE(mvhd.offset + 24);
      if (timescale > 0) durationMs = Math.round((duration / timescale) * 1000);
    } else if (ver === 1 && mvhd.offset + 44 <= buf.length) {
      const timescale = buf.readUInt32BE(mvhd.offset + 28);
      const duration = Number(buf.readBigUInt64BE(mvhd.offset + 32));
      if (timescale > 0) durationMs = Math.round((duration / timescale) * 1000);
    }
  }
  const hasVideo = Boolean(findBox(buf, "trak", moov.offset + 8));
  return {
    ok: true,
    container: "mp4",
    durationMs,
    hasVideo,
    hasAudio: Boolean(buf.includes(Buffer.from("mp4a")) || buf.includes(Buffer.from("sowt"))),
    videoCodec: buf.includes(Buffer.from("avc1"))
      ? "h264"
      : buf.includes(Buffer.from("hvc1"))
        ? "hevc"
        : null,
    audioCodec: buf.includes(Buffer.from("mp4a")) ? "aac" : null,
    width: null,
    height: null,
    rotation: null,
    probeEngine: "sniff",
  };
}

function probeWebm(buf: Buffer): MediaProbeResult {
  // EBML header
  if (buf.length < 4 || buf[0] !== 0x1a || buf[1] !== 0x45 || buf[2] !== 0xdf || buf[3] !== 0xa3) {
    return {
      ok: false,
      code: "corrupt",
      message: "Thiếu EBML header — không phải WebM/Matroska hợp lệ.",
      probeEngine: "sniff",
    };
  }
  const docType = buf.includes(Buffer.from("webm"))
    ? "webm"
    : buf.includes(Buffer.from("matroska"))
      ? "webm"
      : null;
  if (!docType) {
    return {
      ok: false,
      code: "unsupported",
      message: "Matroska không phải WebM được hỗ trợ ở pilot.",
      probeEngine: "sniff",
    };
  }
  return {
    ok: true,
    container: "webm",
    durationMs: null,
    hasVideo: buf.includes(Buffer.from("V_VP8")) || buf.includes(Buffer.from("V_VP9")) || buf.includes(Buffer.from("V_AV1")),
    hasAudio: buf.includes(Buffer.from("A_OPUS")) || buf.includes(Buffer.from("A_VORBIS")),
    videoCodec: buf.includes(Buffer.from("V_VP9"))
      ? "vp9"
      : buf.includes(Buffer.from("V_VP8"))
        ? "vp8"
        : null,
    audioCodec: buf.includes(Buffer.from("A_OPUS")) ? "opus" : null,
    width: null,
    height: null,
    rotation: null,
    probeEngine: "sniff",
  };
}

/**
 * Header/magic sniffer used when ffprobe is unavailable.
 * Distinguishes fake extensions (wrong magic → corrupt) from unknown formats (unsupported).
 */
export function createSniffProbe(): MediaProbe {
  return {
    async probeFile(path: string): Promise<MediaProbeResult> {
      let buf: Buffer;
      try {
        buf = readPrefix(path);
      } catch {
        return {
          ok: false,
          code: "corrupt",
          message: "Không đọc được tệp media.",
          probeEngine: "sniff",
        };
      }
      if (buf.length === 0) {
        return {
          ok: false,
          code: "corrupt",
          message: "Tệp rỗng.",
          probeEngine: "sniff",
        };
      }
      // ISO BMFF / MP4 family
      if (buf.length >= 8 && buf.toString("ascii", 4, 8) === "ftyp") {
        return probeMp4(buf);
      }
      // EBML / WebM
      if (buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3) {
        return probeWebm(buf);
      }
      // RIFF/AVI or others → unsupported for pilot
      if (buf.toString("ascii", 0, 4) === "RIFF") {
        return {
          ok: false,
          code: "unsupported",
          message: "Định dạng RIFF/AVI chưa được hỗ trợ ở bản pilot (chỉ MP4/WebM).",
          probeEngine: "sniff",
        };
      }
      return {
        ok: false,
        code: "unsupported",
        message: "Không nhận diện được container media được hỗ trợ (MP4/WebM).",
        probeEngine: "sniff",
      };
    },
  };
}
