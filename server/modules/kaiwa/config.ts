import { resolve, dirname } from "node:path";

/** Pilot defaults from ADR-015 — override via env, not scattered literals. */
export type KaiwaConfig = {
  mediaRoot: string;
  quotaBytesPerUser: number;
  maxUploadBytes: number;
  reservationTtlMs: number;
};

export function loadKaiwaConfig(
  overrides: Partial<KaiwaConfig> = {},
): KaiwaConfig {
  const dbPath = resolve(process.env.DB_PATH || "data/kotoba.sqlite");
  const defaultMedia = resolve(dirname(dbPath), "kaiwa-media");
  return {
    mediaRoot: resolve(overrides.mediaRoot || process.env.KAIWA_MEDIA_ROOT || defaultMedia),
    quotaBytesPerUser:
      overrides.quotaBytesPerUser ??
      Number(process.env.KAIWA_QUOTA_BYTES || 2 * 1024 * 1024 * 1024),
    maxUploadBytes:
      overrides.maxUploadBytes ??
      Number(process.env.KAIWA_MAX_UPLOAD_BYTES || 250 * 1024 * 1024),
    reservationTtlMs:
      overrides.reservationTtlMs ??
      Number(process.env.KAIWA_RESERVATION_TTL_MS || 24 * 60 * 60 * 1000),
  };
}
