import { spawn } from "node:child_process";
import type { MediaProbe, MediaProbeResult } from "./types";

export type FfprobeOptions = {
  bin: string;
  timeoutMs: number;
  maxBufferBytes: number;
};

function runFfprobe(
  bin: string,
  filePath: string,
  timeoutMs: number,
  maxBufferBytes: number,
): Promise<{ stdout: string; stderr: string; code: number | null }> {
  return new Promise((resolve) => {
    const args = [
      "-v",
      "error",
      "-show_format",
      "-show_streams",
      "-print_format",
      "json",
      filePath,
    ];
    const child = spawn(bin, args, {
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    let settled = false;
    const finish = (code: number | null) => {
      if (settled) return;
      settled = true;
      resolve({ stdout, stderr, code });
    };
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      finish(null);
    }, timeoutMs);
    child.stdout.on("data", (chunk: Buffer) => {
      if (stdout.length < maxBufferBytes) stdout += chunk.toString("utf8");
    });
    child.stderr.on("data", (chunk: Buffer) => {
      if (stderr.length < maxBufferBytes) stderr += chunk.toString("utf8");
    });
    child.on("error", () => {
      clearTimeout(timer);
      finish(1);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      finish(code);
    });
  });
}

export function createFfprobeProbe(opts: FfprobeOptions): MediaProbe {
  return {
    async probeFile(path: string): Promise<MediaProbeResult> {
      const { stdout, stderr, code } = await runFfprobe(
        opts.bin,
        path,
        opts.timeoutMs,
        opts.maxBufferBytes,
      );
      if (code === null) {
        return {
          ok: false,
          code: "timeout",
          message: "Probe media vượt thời gian cho phép.",
          probeEngine: "ffprobe",
        };
      }
      if (code !== 0) {
        const corrupt =
          /Invalid data|EBML|moov atom not found|End of file|Failed to open/i.test(
            stderr,
          );
        return {
          ok: false,
          code: corrupt ? "corrupt" : "unsupported",
          message: corrupt
            ? "Tệp media hỏng hoặc không giải mã được."
            : "Định dạng/codec không được ffprobe hỗ trợ hoặc không đọc được.",
          probeEngine: "ffprobe",
        };
      }
      let json: {
        format?: { duration?: string; format_name?: string };
        streams?: {
          codec_type?: string;
          codec_name?: string;
          width?: number;
          height?: number;
          tags?: { rotate?: string };
          side_data_list?: { rotation?: number }[];
        }[];
      };
      try {
        json = JSON.parse(stdout);
      } catch {
        return {
          ok: false,
          code: "corrupt",
          message: "ffprobe trả JSON không hợp lệ.",
          probeEngine: "ffprobe",
        };
      }
      const streams = json.streams || [];
      const video = streams.find((s) => s.codec_type === "video");
      const audio = streams.find((s) => s.codec_type === "audio");
      const formatName = (json.format?.format_name || "").toLowerCase();
      const container = formatName.includes("webm")
        ? "webm"
        : formatName.includes("mp4") ||
            formatName.includes("mov") ||
            formatName.includes("isom")
          ? "mp4"
          : "unknown";
      const durationSec = Number(json.format?.duration);
      const durationMs = Number.isFinite(durationSec)
        ? Math.round(durationSec * 1000)
        : null;
      let rotation: number | null = null;
      if (video?.tags?.rotate) rotation = Number(video.tags.rotate) || 0;
      const side = video?.side_data_list?.find((s) => s.rotation != null);
      if (side?.rotation != null) rotation = Number(side.rotation);

      if (!video && !audio) {
        return {
          ok: false,
          code: "no_av_track",
          message: "Tệp không có track video hoặc audio.",
          probeEngine: "ffprobe",
        };
      }

      return {
        ok: true,
        container,
        durationMs,
        hasVideo: Boolean(video),
        hasAudio: Boolean(audio),
        videoCodec: video?.codec_name || null,
        audioCodec: audio?.codec_name || null,
        width: video?.width ?? null,
        height: video?.height ?? null,
        rotation,
        probeEngine: "ffprobe",
        raw: { formatName },
      };
    },
  };
}
