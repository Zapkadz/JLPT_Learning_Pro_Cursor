import { accessSync, constants } from "node:fs";
import { createSniffProbe } from "./sniff";
import { createFfprobeProbe } from "./ffprobe";
import type { MediaProbe, MediaProbeOk, MediaProbeResult } from "./types";
import type { KaiwaConfig } from "../config";

export type { MediaProbe, MediaProbeResult, MediaProbeOk } from "./types";

function whichFfprobe(): string | null {
  const fromEnv = process.env.FFPROBE_PATH || process.env.KAIWA_FFPROBE_PATH;
  if (fromEnv) {
    try {
      accessSync(fromEnv, constants.X_OK);
      return fromEnv;
    } catch {
      try {
        accessSync(fromEnv, constants.F_OK);
        return fromEnv;
      } catch {
        return null;
      }
    }
  }
  // Prefer PATH lookup only when explicitly enabled — default sniff keeps CI deterministic.
  if (process.env.KAIWA_USE_FFPROBE === "1") return "ffprobe";
  return null;
}

export function createMediaProbe(config?: Partial<KaiwaConfig>): {
  probe: MediaProbe;
  engine: "ffprobe" | "sniff";
} {
  const timeoutMs = Number(process.env.KAIWA_PROBE_TIMEOUT_MS || 15_000);
  const maxBufferBytes = Number(process.env.KAIWA_PROBE_MAX_BUFFER || 2_000_000);
  const bin = whichFfprobe();
  if (bin) {
    return {
      engine: "ffprobe",
      probe: createFfprobeProbe({ bin, timeoutMs, maxBufferBytes }),
    };
  }
  void config;
  return { engine: "sniff", probe: createSniffProbe() };
}

/** Apply pilot policy (ADR-015) after a successful structural probe. */
export function applyPilotLimits(
  result: MediaProbeResult,
  limits: { maxDurationMs: number; requireVideo?: boolean },
): MediaProbeResult {
  if (!result.ok) return result;
  if (limits.requireVideo !== false && !result.hasVideo) {
    return {
      ok: false,
      code: "no_av_track",
      message: "Pilot yêu cầu có track video.",
      probeEngine: result.probeEngine,
    };
  }
  if (
    result.durationMs != null &&
    result.durationMs > limits.maxDurationMs
  ) {
    return {
      ok: false,
      code: "too_long",
      message: `Video dài hơn giới hạn pilot (${Math.round(limits.maxDurationMs / 60000)} phút).`,
      probeEngine: result.probeEngine,
    };
  }
  if (result.container !== "mp4" && result.container !== "webm") {
    return {
      ok: false,
      code: "unsupported",
      message: "Pilot chỉ nhận container MP4/WebM.",
      probeEngine: result.probeEngine,
    };
  }
  return result;
}

/** Prefer ffprobe when it actually works; fall back to sniff on spawn failure. */
export function createResilientProbe(): MediaProbe {
  const primary = createMediaProbe();
  if (primary.engine === "sniff") return primary.probe;
  const sniff = createSniffProbe();
  return {
    async probeFile(path: string) {
      try {
        const r = await primary.probe.probeFile(path);
        // If ffprobe binary missing, spawn fails with unsupported — try sniff for magic.
        if (
          !r.ok &&
          r.code === "unsupported" &&
          /không đọc được|not found|ENOENT/i.test(r.message)
        ) {
          return sniff.probeFile(path);
        }
        return r;
      } catch {
        return sniff.probeFile(path);
      }
    },
  };
}
