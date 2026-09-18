import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { createHash } from "node:crypto";
import type Database from "better-sqlite3";
import { KaiwaError } from "./repository";
import type { AssetService } from "./assets";
import type { JobService } from "./jobs";
import type { KaiwaConfig } from "./config";

function fail(status: number, message: string): never {
  throw new KaiwaError(status, message);
}

/** Strip secrets / media payloads from log-bound objects. */
export function redactForLog(value: unknown): unknown {
  if (value == null) return value;
  if (typeof value === "string") {
    if (value.length > 240) return `${value.slice(0, 40)}…[redacted ${value.length} chars]`;
    if (/bearer|token|password|cookie|authorization/i.test(value))
      return "[redacted]";
    return value;
  }
  if (Buffer.isBuffer(value) || value instanceof Uint8Array)
    return `[binary ${value.length} bytes]`;
  if (Array.isArray(value)) return value.map(redactForLog);
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (Buffer.isBuffer(v) || v instanceof Uint8Array) {
        out[k] = `[binary ${v.length} bytes]`;
      } else if (/token|password|cookie|authorization/i.test(k)) {
        out[k] = "[redacted]";
      } else if (/audio|transcript|payload/i.test(k) && typeof v === "string") {
        out[k] = "[redacted]";
      } else {
        out[k] = redactForLog(v);
      }
    }
    return out;
  }
  return value;
}

export function createOpsService(
  db: Database.Database,
  assets: AssetService,
  jobs: JobService,
  config: KaiwaConfig,
) {
  function softDeleteProject(ownerId: string, projectId: string) {
    const project = db
      .prepare(
        "SELECT * FROM kaiwa_projects WHERE id=? AND owner_id=? AND deleted_at IS NULL",
      )
      .get(projectId, ownerId) as Record<string, unknown> | undefined;
    if (!project) fail(404, "Không tìm thấy dự án trong tài khoản của bạn.");

    const now = new Date().toISOString();
    const cancelledJobs: string[] = [];

    // Cancel queued/running jobs whose payload references this project
    const openJobs = db
      .prepare(
        `SELECT id, payload FROM kaiwa_jobs
         WHERE owner_id=? AND state IN ('queued','running')`,
      )
      .all(ownerId) as { id: string; payload: string }[];
    for (const job of openJobs) {
      let payload = "";
      try {
        payload = JSON.stringify(JSON.parse(job.payload || "{}"));
      } catch {
        payload = job.payload || "";
      }
      if (payload.includes(projectId)) {
        jobs.cancel(ownerId, job.id);
        cancelledJobs.push(job.id);
      }
    }

    db.prepare(
      `UPDATE kaiwa_projects SET deleted_at=?, updated_at=?, status='deleted' WHERE id=? AND owner_id=?`,
    ).run(now, now, projectId, ownerId);

    // Mark project-linked assets for GC (do not delete files still referenced elsewhere)
    const assetIds = new Set<string>();
    if (project.source_asset_id) assetIds.add(String(project.source_asset_id));
    if (project.proxy_asset_id) assetIds.add(String(project.proxy_asset_id));

    const attemptAssets = db
      .prepare(
        `SELECT audio_asset_id FROM kaiwa_attempts WHERE project_id=? AND owner_id=? AND audio_asset_id IS NOT NULL`,
      )
      .all(projectId, ownerId) as { audio_asset_id: string }[];
    for (const a of attemptAssets) assetIds.add(a.audio_asset_id);

    const exportAssets = db
      .prepare(
        `SELECT e.asset_id FROM kaiwa_exports e
         JOIN kaiwa_attempts a ON a.id=e.attempt_id
         WHERE a.project_id=? AND e.owner_id=? AND e.asset_id IS NOT NULL`,
      )
      .all(projectId, ownerId) as { asset_id: string }[];
    for (const e of exportAssets) assetIds.add(e.asset_id);

    for (const id of assetIds) {
      db.prepare(
        `UPDATE kaiwa_assets SET processing_status='tombstoned'
         WHERE id=? AND owner_id=? AND processing_status!='tombstoned'`,
      ).run(id, ownerId);
    }

    const gc = garbageCollectTombstones(ownerId);

    return {
      projectId,
      deletedAt: now,
      cancelledJobs,
      gc,
    };
  }

  /**
   * Remove tombstoned assets that are no longer referenced by live projects/attempts/exports.
   * Running workers must not recreate files for deleted projects (status tombstoned + no row).
   */
  function garbageCollectTombstones(ownerId?: string) {
    const rows = (
      ownerId
        ? db
            .prepare(
              `SELECT id, storage_key FROM kaiwa_assets
               WHERE owner_id=? AND processing_status='tombstoned'`,
            )
            .all(ownerId)
        : db
            .prepare(
              `SELECT id, storage_key FROM kaiwa_assets
               WHERE processing_status='tombstoned'`,
            )
            .all()
    ) as { id: string; storage_key: string }[];

    let removed = 0;
    for (const row of rows) {
      const stillLive = db
        .prepare(
          `SELECT 1 AS ok WHERE
             EXISTS(SELECT 1 FROM kaiwa_projects WHERE (source_asset_id=? OR proxy_asset_id=?) AND deleted_at IS NULL)
          OR EXISTS(SELECT 1 FROM kaiwa_attempts a JOIN kaiwa_projects p ON p.id=a.project_id
                    WHERE a.audio_asset_id=? AND p.deleted_at IS NULL)
          OR EXISTS(SELECT 1 FROM kaiwa_exports e JOIN kaiwa_attempts a ON a.id=e.attempt_id
                    JOIN kaiwa_projects p ON p.id=a.project_id
                    WHERE e.asset_id=? AND p.deleted_at IS NULL)`,
        )
        .get(row.id, row.id, row.id, row.id) as { ok: number } | undefined;
      if (stillLive) continue;

      assets.storage.remove(row.storage_key);
      db.prepare("DELETE FROM kaiwa_quota_reservations WHERE asset_id=?").run(
        row.id,
      );
      db.prepare("DELETE FROM kaiwa_assets WHERE id=?").run(row.id);
      removed++;
    }
    return { scanned: rows.length, removed };
  }

  function purgeExpiredUploads() {
    return assets.purgeExpiredReservations();
  }

  function opsSnapshot(ownerId: string) {
    const usage = assets.usageBytes(ownerId);
    const queued = (
      db
        .prepare(
          `SELECT COUNT(*) AS n FROM kaiwa_jobs WHERE owner_id=? AND state='queued'`,
        )
        .get(ownerId) as { n: number }
    ).n;
    const running = (
      db
        .prepare(
          `SELECT COUNT(*) AS n FROM kaiwa_jobs WHERE owner_id=? AND state='running'`,
        )
        .get(ownerId) as { n: number }
    ).n;
    const warnings: string[] = [];
    if (usage > config.quotaBytesPerUser * 0.9) {
      warnings.push("Hạn mức lưu trữ Kaiwa gần đầy (>90%).");
    }
    if (queued + running > 5) {
      warnings.push("Hàng đợi công việc Kaiwa đang dài.");
    }
    try {
      mkdirSync(config.mediaRoot, { recursive: true });
      const freeish = true; // Node has no portable free-disk API without deps
      void freeish;
    } catch {
      warnings.push("Không ghi được thư mục media Kaiwa.");
    }
    return {
      usedBytes: usage,
      quotaBytes: config.quotaBytesPerUser,
      jobs: { queued, running },
      mediaRootConfigured: Boolean(config.mediaRoot),
      warnings,
      retentionNote:
        "Dự án xóa mềm (tombstone); media GC khi không còn tham chiếu. Bản sao lưu DB không gồm media trừ khi dùng backup kèm media.",
    };
  }

  return {
    softDeleteProject,
    garbageCollectTombstones,
    purgeExpiredUploads,
    opsSnapshot,
  };
}

export type OpsService = ReturnType<typeof createOpsService>;

export type MediaBackupManifest = {
  version: 1;
  createdAt: string;
  dbPath: string;
  mediaRoot: string;
  fileCount: number;
  totalBytes: number;
  files: Array<{ relativePath: string; bytes: number; sha256: string }>;
};

function walkFiles(root: string): string[] {
  if (!existsSync(root)) return [];
  const out: string[] = [];
  const stack = [root];
  while (stack.length) {
    const dir = stack.pop()!;
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      const st = statSync(full);
      if (st.isDirectory()) stack.push(full);
      else if (st.isFile()) out.push(full);
    }
  }
  return out;
}

/** Copy media tree next to a DB backup and write manifest (no secrets). */
export function backupKaiwaMedia(input: {
  mediaRoot: string;
  destinationDir: string;
  dbPath: string;
}): MediaBackupManifest {
  const destRoot = resolve(input.destinationDir);
  if (existsSync(destRoot)) {
    throw new Error(
      "Destination media folder must be new. Existing folders are never overwritten.",
    );
  }
  mkdirSync(destRoot, { recursive: true });
  const sourceRoot = resolve(input.mediaRoot);
  const files = walkFiles(sourceRoot);
  const entries: MediaBackupManifest["files"] = [];
  let totalBytes = 0;
  for (const full of files) {
    const rel = relative(sourceRoot, full).replace(/\\/g, "/");
    const data = readFileSync(full);
    const dest = join(destRoot, rel);
    mkdirSync(dirname(dest), { recursive: true });
    copyFileSync(full, dest);
    const sha256 = createHash("sha256").update(data).digest("hex");
    entries.push({ relativePath: rel, bytes: data.length, sha256 });
    totalBytes += data.length;
  }
  const manifest: MediaBackupManifest = {
    version: 1,
    createdAt: new Date().toISOString(),
    dbPath: resolve(input.dbPath),
    mediaRoot: sourceRoot,
    fileCount: entries.length,
    totalBytes,
    files: entries,
  };
  writeFileSync(
    join(destRoot, "MANIFEST.json"),
    JSON.stringify(manifest, null, 2),
  );
  return manifest;
}

/** Verify a media backup folder against its MANIFEST.json. */
export function verifyKaiwaMediaBackup(destinationDir: string): {
  ok: boolean;
  checked: number;
  errors: string[];
} {
  const root = resolve(destinationDir);
  const manifestPath = join(root, "MANIFEST.json");
  if (!existsSync(manifestPath)) {
    return { ok: false, checked: 0, errors: ["Thiếu MANIFEST.json"] };
  }
  const manifest = JSON.parse(
    readFileSync(manifestPath, "utf8"),
  ) as MediaBackupManifest;
  const errors: string[] = [];
  let checked = 0;
  for (const f of manifest.files) {
    const full = join(root, f.relativePath);
    if (!existsSync(full)) {
      errors.push(`missing:${f.relativePath}`);
      continue;
    }
    const data = readFileSync(full);
    const sha = createHash("sha256").update(data).digest("hex");
    if (sha !== f.sha256) errors.push(`checksum:${f.relativePath}`);
    if (data.length !== f.bytes) errors.push(`size:${f.relativePath}`);
    checked++;
  }
  return { ok: errors.length === 0, checked, errors };
}
