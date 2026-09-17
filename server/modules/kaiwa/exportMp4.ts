import { createHash, randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type Database from "better-sqlite3";
import { KaiwaError } from "./repository";
import type { AssetService } from "./assets";
import type { JobService } from "./jobs";

export type MixSnapshot = {
  originalGain: number;
  learnerGain: number;
  offsetMs: number;
  version: number;
};

export type ExportRow = {
  id: string;
  owner_id: string;
  attempt_id: string;
  job_id: string | null;
  asset_id: string | null;
  mix_json: string;
  mix_fingerprint: string;
  state: string;
  error_message: string | null;
  engine: string | null;
  created_at: string;
  updated_at: string;
};

function fail(status: number, message: string): never {
  throw new KaiwaError(status, message);
}

function clampGain(n: number) {
  if (!Number.isFinite(n)) return 0.5;
  return Math.min(1, Math.max(0, n));
}

export function fingerprintMix(mix: MixSnapshot): string {
  const canonical = JSON.stringify({
    originalGain: Math.round(mix.originalGain * 1000) / 1000,
    learnerGain: Math.round(mix.learnerGain * 1000) / 1000,
    offsetMs: Math.round(mix.offsetMs),
    version: mix.version,
  });
  return createHash("sha256").update(canonical).digest("hex").slice(0, 32);
}

export function ensureExportsTable(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS kaiwa_exports(
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      attempt_id TEXT NOT NULL REFERENCES kaiwa_attempts(id) ON DELETE CASCADE,
      job_id TEXT REFERENCES kaiwa_jobs(id) ON DELETE SET NULL,
      asset_id TEXT REFERENCES kaiwa_assets(id) ON DELETE SET NULL,
      mix_json TEXT NOT NULL,
      mix_fingerprint TEXT NOT NULL,
      state TEXT NOT NULL DEFAULT 'queued',
      error_message TEXT,
      engine TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(owner_id, attempt_id, mix_fingerprint)
    );
    CREATE INDEX IF NOT EXISTS kaiwa_exports_attempt
      ON kaiwa_exports(attempt_id, created_at);
  `);
}

function resolveFfmpeg(): string | null {
  return process.env.FFMPEG_PATH || process.env.KAIWA_FFMPEG_PATH || null;
}

function u32(n: number) {
  const b = Buffer.alloc(4);
  b.writeUInt32BE(n >>> 0);
  return b;
}

function box(type: string, body: Buffer) {
  return Buffer.concat([u32(8 + body.length), Buffer.from(type, "ascii"), body]);
}

/** Minimal playable-sniffable MP4 with duration + free-box mix metadata. */
function syntheticExportMp4(durationSec: number, meta: Buffer): Buffer {
  const timescale = 1000;
  const ftyp = box(
    "ftyp",
    Buffer.concat([
      Buffer.from("isom"),
      u32(0),
      Buffer.from("isom"),
      Buffer.from("mp41"),
    ]),
  );
  const mvhdBody = Buffer.alloc(100);
  mvhdBody.writeUInt32BE(timescale, 12);
  mvhdBody.writeUInt32BE(Math.round(durationSec * timescale), 16);
  mvhdBody.writeUInt32BE(0x00010000, 20);
  mvhdBody.writeUInt16BE(0x0100, 24);
  const moov = box("moov", box("mvhd", mvhdBody));
  const free = box("free", meta);
  const mdat = box("mdat", Buffer.from("kaiwa-export-mdat"));
  return Buffer.concat([ftyp, moov, free, mdat]);
}

/**
 * Build export MP4: ffmpeg dual-gain mix when available; otherwise a
 * synthetic MP4 carrying mix snapshot metadata (pilot path).
 * Never depends on assessment/scoring jobs.
 */
export function createExportService(
  db: Database.Database,
  assets: AssetService,
  jobs: JobService,
) {
  ensureExportsTable(db);

  function getExport(ownerId: string, exportId: string): ExportRow {
    const row = db
      .prepare("SELECT * FROM kaiwa_exports WHERE id=? AND owner_id=?")
      .get(exportId, ownerId) as ExportRow | undefined;
    if (!row) fail(404, "Không tìm thấy bản xuất trong tài khoản của bạn.");
    return row;
  }

  function resolveMix(
    attempt: Record<string, unknown>,
    body?: Partial<MixSnapshot>,
  ): MixSnapshot {
    let fromDevice: Partial<MixSnapshot> = {};
    try {
      const device = JSON.parse(String(attempt.device_json || "{}")) as {
        mix?: Partial<MixSnapshot>;
      };
      if (device.mix) fromDevice = device.mix;
    } catch {
      /* ignore */
    }
    return {
      originalGain: clampGain(
        body?.originalGain ?? fromDevice.originalGain ?? 0.5,
      ),
      learnerGain: clampGain(
        body?.learnerGain ?? fromDevice.learnerGain ?? 1,
      ),
      offsetMs: Math.round(body?.offsetMs ?? fromDevice.offsetMs ?? 0),
      version: 1,
    };
  }

  function tryFfmpegMix(input: {
    videoPath: string;
    micPath: string;
    outPath: string;
    mix: MixSnapshot;
  }): boolean {
    const bin = resolveFfmpeg();
    if (!bin) return false;
    const filter = `[0:a]volume=${input.mix.originalGain}[a0];[1:a]volume=${input.mix.learnerGain}[a1];[a0][a1]amix=inputs=2:duration=first:dropout_transition=0[aout]`;
    const args = [
      "-y",
      "-i",
      input.videoPath,
      "-i",
      input.micPath,
      "-filter_complex",
      filter,
      "-map",
      "0:v:0?",
      "-map",
      "[aout]",
      "-c:v",
      "copy",
      "-c:a",
      "aac",
      "-shortest",
      input.outPath,
    ];
    const r = spawnSync(bin, args, { encoding: "utf8", timeout: 120_000 });
    return r.status === 0;
  }

  function buildExportBytes(input: {
    ownerId: string;
    attempt: Record<string, unknown>;
    mix: MixSnapshot;
    proxyAssetId: string | null;
  }): { bytes: Buffer; engine: string; contentType: string } {
    const micId = String(input.attempt.audio_asset_id || "");
    if (!micId) fail(422, "Chưa có audio micro đã chốt — không xuất được.");
    const mic = assets.ownAsset(input.ownerId, micId);
    const micPath = assets.storage.resolvePath(mic.storage_key);

    let videoPath: string | null = null;
    if (input.proxyAssetId) {
      try {
        const proxy = assets.ownAsset(input.ownerId, input.proxyAssetId);
        videoPath = assets.storage.resolvePath(proxy.storage_key);
      } catch {
        videoPath = null;
      }
    }

    const tmp = mkdtempSync(join(tmpdir(), "kaiwa-export-"));
    try {
      const outPath = join(tmp, "out.mp4");
      if (videoPath) {
        const ok = tryFfmpegMix({
          videoPath,
          micPath,
          outPath,
          mix: input.mix,
        });
        if (ok) {
          return {
            bytes: readFileSync(outPath),
            engine: "ffmpeg",
            contentType: "video/mp4",
          };
        }
      }

      const durationSec = Math.max(
        1,
        Math.round(Number(input.attempt.duration_ms || 1000) / 1000),
      );
      const meta = Buffer.from(
        JSON.stringify({
          purpose: "kaiwa_export",
          mix: input.mix,
          attemptId: input.attempt.id,
          micAssetId: micId,
          proxyAssetId: input.proxyAssetId,
          note: videoPath
            ? "ffmpeg mix unavailable — synthetic container with mix snapshot"
            : "no proxy video — synthetic container with mix snapshot",
        }),
        "utf8",
      );
      return {
        bytes: syntheticExportMp4(durationSec, meta),
        engine: "passthrough-synthetic",
        contentType: "video/mp4",
      };
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  }

  function createOrGetExport(
    ownerId: string,
    attemptId: string,
    body?: Partial<MixSnapshot>,
  ) {
    const attempt = db
      .prepare("SELECT * FROM kaiwa_attempts WHERE id=? AND owner_id=?")
      .get(attemptId, ownerId) as Record<string, unknown> | undefined;
    if (!attempt) fail(404, "Không tìm thấy bản thu trong tài khoản của bạn.");
    if (!attempt.finalized_at || !attempt.audio_asset_id) {
      fail(422, "Bản thu chưa chốt — hãy hoàn tất thu trước khi xuất.");
    }

    const project = db
      .prepare("SELECT * FROM kaiwa_projects WHERE id=? AND owner_id=?")
      .get(String(attempt.project_id), ownerId) as
      | { proxy_asset_id?: string | null }
      | undefined;
    if (!project) fail(404, "Không tìm thấy dự án.");

    const mix = resolveMix(attempt, body);
    const fp = fingerprintMix(mix);
    const existing = db
      .prepare(
        `SELECT * FROM kaiwa_exports
         WHERE owner_id=? AND attempt_id=? AND mix_fingerprint=?`,
      )
      .get(ownerId, attemptId, fp) as ExportRow | undefined;
    if (existing) {
      if (existing.state === "ready" && existing.asset_id) {
        return { export: existing, reused: true };
      }
      if (existing.state === "failed") {
        return { export: runExport(ownerId, existing.id), reused: true };
      }
      return { export: existing, reused: true };
    }

    const now = new Date().toISOString();
    const id = randomUUID();
    const job = jobs.enqueue({
      ownerId,
      kind: "export_mp4",
      payload: { exportId: id, attemptId, mix },
      idempotencyKey: `export:${attemptId}:${fp}`,
    });

    try {
      db.prepare(
        `INSERT INTO kaiwa_exports(
          id,owner_id,attempt_id,job_id,asset_id,mix_json,mix_fingerprint,
          state,error_message,engine,created_at,updated_at
        ) VALUES(?,?,?,?,NULL,?,?,'queued',NULL,NULL,?,?)`,
      ).run(
        id,
        ownerId,
        attemptId,
        job.id,
        JSON.stringify(mix),
        fp,
        now,
        now,
      );
    } catch (e) {
      const again = db
        .prepare(
          `SELECT * FROM kaiwa_exports
           WHERE owner_id=? AND attempt_id=? AND mix_fingerprint=?`,
        )
        .get(ownerId, attemptId, fp) as ExportRow | undefined;
      if (again) return { export: again, reused: true };
      throw new KaiwaError(500, "Không tạo được bản xuất. Thử lại sau.");
    }

    return { export: runExport(ownerId, id), reused: false };
  }

  function runExport(ownerId: string, exportId: string): ExportRow {
    const row = getExport(ownerId, exportId);
    if (row.state === "ready" && row.asset_id) return row;

    const attempt = db
      .prepare("SELECT * FROM kaiwa_attempts WHERE id=? AND owner_id=?")
      .get(row.attempt_id, ownerId) as Record<string, unknown> | undefined;
    if (!attempt) fail(404, "Không tìm thấy bản thu.");

    const project = db
      .prepare("SELECT * FROM kaiwa_projects WHERE id=? AND owner_id=?")
      .get(String(attempt.project_id), ownerId) as
      | { proxy_asset_id?: string | null }
      | undefined;

    const mix = JSON.parse(row.mix_json) as MixSnapshot;
    const now = new Date().toISOString();
    db.prepare(
      `UPDATE kaiwa_exports SET state='running', updated_at=? WHERE id=? AND owner_id=?`,
    ).run(now, exportId, ownerId);

    const workerId = `export-inline:${exportId}`;
    try {
      const built = buildExportBytes({
        ownerId,
        attempt,
        mix,
        proxyAssetId: project?.proxy_asset_id ?? null,
      });

      const reserved = assets.reserve({
        ownerId,
        kind: "export",
        bytes: Math.max(built.bytes.length, 64),
        ext: "mp4",
      });
      const asset = assets.commitBytes(ownerId, reserved.id, built.bytes, {
        contentType: built.contentType,
        checksum: createHash("sha256").update(built.bytes).digest("hex"),
      });
      db.prepare(`UPDATE kaiwa_assets SET media_json=? WHERE id=?`).run(
        JSON.stringify({
          ...JSON.parse(asset.media_json || "{}"),
          purpose: "export_mp4",
          mix,
          engine: built.engine,
          exportId,
        }),
        asset.id,
      );

      const doneAt = new Date().toISOString();
      db.prepare(
        `UPDATE kaiwa_exports
         SET state='ready', asset_id=?, engine=?, error_message=NULL, updated_at=?
         WHERE id=? AND owner_id=?`,
      ).run(asset.id, built.engine, doneAt, exportId, ownerId);

      if (row.job_id) {
        try {
          db.prepare(
            `UPDATE kaiwa_jobs
             SET state='succeeded', result_json=?, updated_at=?,
                 lease_owner=NULL, lease_until=NULL, error_message=NULL
             WHERE id=? AND state!='succeeded'`,
          ).run(
            JSON.stringify({
              exportId,
              assetId: asset.id,
              engine: built.engine,
              workerId,
            }),
            doneAt,
            row.job_id,
          );
        } catch {
          /* export file is source of truth */
        }
      }

      return getExport(ownerId, exportId);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Xuất thất bại.";
      db.prepare(
        `UPDATE kaiwa_exports SET state='failed', error_message=?, updated_at=? WHERE id=? AND owner_id=?`,
      ).run(msg, new Date().toISOString(), exportId, ownerId);
      if (row.job_id) {
        try {
          db.prepare(
            `UPDATE kaiwa_jobs SET state='failed', error_message=?, updated_at=? WHERE id=? AND state!='succeeded'`,
          ).run(msg, new Date().toISOString(), row.job_id);
        } catch {
          /* ignore */
        }
      }
      if (e instanceof KaiwaError) throw e;
      fail(500, msg);
    }
  }

  return {
    createOrGetExport,
    getExport,
    runExport,
  };
}

export type ExportService = ReturnType<typeof createExportService>;
