export type ProbeFailureCode =
  | "corrupt"
  | "unsupported"
  | "too_long"
  | "too_large"
  | "no_av_track"
  | "timeout"
  | "probe_unavailable";

export type MediaProbeOk = {
  ok: true;
  container: "mp4" | "webm" | "unknown";
  durationMs: number | null;
  hasVideo: boolean;
  hasAudio: boolean;
  videoCodec: string | null;
  audioCodec: string | null;
  width: number | null;
  height: number | null;
  rotation: number | null;
  probeEngine: "ffprobe" | "sniff";
  raw?: unknown;
};

export type MediaProbeErr = {
  ok: false;
  code: ProbeFailureCode;
  message: string;
  probeEngine: "ffprobe" | "sniff";
};

export type MediaProbeResult = MediaProbeOk | MediaProbeErr;

export type MediaProbe = {
  probeFile(path: string): Promise<MediaProbeResult>;
};
