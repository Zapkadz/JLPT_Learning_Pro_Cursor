import type Database from "better-sqlite3";
import { createHash, randomUUID } from "node:crypto";
import { KaiwaError } from "./repository";
import type { AssetService } from "./assets";
import type { KaiwaConfig } from "./config";
import {
  isCaptureMode,
  progressFromClips,
  type CaptureMode,
  type SegmentClipStatus,
} from "../../../shared/kaiwa/segmentClips";

function fail(status: number, message: string): never {
  throw new KaiwaError(status, message);
}

export function ensureSegmentClipsTable(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS kaiwa_segment_clips(
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      attempt_id TEXT NOT NULL REFERENCES kaiwa_attempts(id) ON DELETE CASCADE,
      segment_id TEXT NOT NULL,
      version INTEGER NOT NULL,
      status TEXT NOT NULL,
      audio_asset_id TEXT REFERENCES kaiwa_assets(id),
      skip_reason TEXT,
      duration_ms INTEGER,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(attempt_id, segment_id, version)
    );
    CREATE INDEX IF NOT EXISTS kaiwa_segment_clips_attempt
      ON kaiwa_segment_clips(attempt_id, segment_id, version);
  `);
}

export function createSegmentClipService(
  db: Database.Database,
  assets: AssetService,
  config: KaiwaConfig,
) {
  ensureSegmentClipsTable(db);

  function ownAttempt(ownerId: string, attemptId: string) {
    const row = db
      .prepare("SELECT * FROM kaiwa_attempts WHERE id=? AND owner_id=?")
      .get(attemptId, ownerId) as Record<string, unknown> | undefined;
    if (!row) fail(404, "Không tìm thấy bản thu.");
    return row;
  }

  function revisionSegmentIds(attempt: Record<string, unknown>): string[] {
    const revision = db
      .prepare("SELECT payload FROM kaiwa_revisions WHERE id=?")
      .get(String(attempt.revision_id)) as { payload: string } | undefined;
    try {
      const payload = JSON.parse(revision?.payload || '{"segments":[]}');
      const segs = Array.isArray(payload.segments) ? payload.segments : [];
      return segs
        .map((s: { id?: string }) => String(s.id || ""))
        .filter(Boolean);
    } catch {
      return [];
    }
  }

  function readDevice(attempt: Record<string, unknown>) {
    try {
      return JSON.parse(String(attempt.device_json || "{}")) as Record<
        string,
        unknown
      >;
    } catch {
      return {};
    }
  }

  function writeDevice(
    ownerId: string,
    attemptId: string,
    device: Record<string, unknown>,
  ) {
    db.prepare(
      "UPDATE kaiwa_attempts SET device_json=? WHERE id=? AND owner_id=?",
    ).run(JSON.stringify(device), attemptId, ownerId);
  }

  function setCaptureMode(
    ownerId: string,
    attemptId: string,
    mode: CaptureMode,
  ) {
    const attempt = ownAttempt(ownerId, attemptId);
    if (attempt.finalized_at)
      fail(409, "Bản thu đã chốt — không đổi chế độ thu.");
    const device = readDevice(attempt);
    device.captureMode = mode;
    device.captureModeUpdatedAt = new Date().toISOString();
    writeDevice(ownerId, attemptId, device);
    return { captureMode: mode };
  }

  function getCaptureMode(attempt: Record<string, unknown>): CaptureMode {
    const device = readDevice(attempt);
    return isCaptureMode(device.captureMode) ? device.captureMode : "segment";
  }

  function latestClips(attemptId: string) {
    return db
      .prepare(
        `SELECT c.* FROM kaiwa_segment_clips c
         INNER JOIN (
           SELECT segment_id, MAX(version) AS version
           FROM kaiwa_segment_clips WHERE attempt_id=?
           GROUP BY segment_id
         ) t ON t.segment_id=c.segment_id AND t.version=c.version
         WHERE c.attempt_id=?`,
      )
      .all(attemptId, attemptId) as Array<Record<string, unknown>>;
  }

  function listClips(ownerId: string, attemptId: string) {
    const attempt = ownAttempt(ownerId, attemptId);
    const segmentIds = revisionSegmentIds(attempt);
    const rows = latestClips(attemptId);
    const clips = rows.map((r) => ({
      id: String(r.id),
      segmentId: String(r.segment_id),
      version: Number(r.version),
      status: String(r.status) as SegmentClipStatus,
      audioAssetId: r.audio_asset_id ? String(r.audio_asset_id) : null,
      skipReason: r.skip_reason ? String(r.skip_reason) : null,
      durationMs: r.duration_ms != null ? Number(r.duration_ms) : null,
      updatedAt: String(r.updated_at),
    }));
    const progress = progressFromClips(
      segmentIds,
      clips.map((c) => ({ segmentId: c.segmentId, status: c.status })),
    );
    return {
      captureMode: getCaptureMode(attempt),
      segmentIds,
      progress,
      clips,
    };
  }

  function nextVersion(attemptId: string, segmentId: string): number {
    const row = db
      .prepare(
        "SELECT MAX(version) AS v FROM kaiwa_segment_clips WHERE attempt_id=? AND segment_id=?",
      )
      .get(attemptId, segmentId) as { v: number | null };
    return (row.v ?? 0) + 1;
  }

  function skipSegment(
    ownerId: string,
    attemptId: string,
    segmentId: string,
    reason?: string,
  ) {
    const attempt = ownAttempt(ownerId, attemptId);
    if (attempt.finalized_at) fail(409, "Bản thu đã chốt.");
    const ids = revisionSegmentIds(attempt);
    if (!ids.includes(segmentId))
      fail(404, "Không có đoạn này trong revision của lần thu.");
    const now = new Date().toISOString();
    const version = nextVersion(attemptId, segmentId);
    const id = randomUUID();
    db.prepare(
      `INSERT INTO kaiwa_segment_clips(
        id,owner_id,attempt_id,segment_id,version,status,skip_reason,created_at,updated_at
      ) VALUES(?,?,?,?,?,?,?,?,?)`,
    ).run(
      id,
      ownerId,
      attemptId,
      segmentId,
      version,
      "skipped",
      reason?.slice(0, 200) ?? null,
      now,
      now,
    );
    return listClips(ownerId, attemptId);
  }

  function recordSegment(
    ownerId: string,
    attemptId: string,
    segmentId: string,
    body: {
      contentBase64: string;
      durationMs?: number;
      partial?: boolean;
      sha256?: string;
    },
  ) {
    const attempt = ownAttempt(ownerId, attemptId);
    if (attempt.finalized_at) fail(409, "Bản thu đã chốt.");
    const ids = revisionSegmentIds(attempt);
    if (!ids.includes(segmentId))
      fail(404, "Không có đoạn này trong revision của lần thu.");

    let data: Buffer;
    try {
      data = Buffer.from(body.contentBase64, "base64");
    } catch {
      fail(400, "Nội dung audio không hợp lệ.");
    }
    if (data.length <= 0) fail(400, "Clip rỗng.");
    if (data.length > config.maxUploadBytes)
      fail(413, "Clip vượt giới hạn tải lên.");

    const digest = createHash("sha256").update(data).digest("hex");
    if (body.sha256 && body.sha256.toLowerCase() !== digest)
      fail(409, "Checksum clip không khớp.");

    // Accept raw bytes for synthetic tests; WebM/Ogg preferred in production UI.
    const isWebm =
      data[0] === 0x1a && data[1] === 0x45 && data[2] === 0xdf && data[3] === 0xa3;
    const isOgg =
      data[0] === 0x4f && data[1] === 0x67 && data[2] === 0x67 && data[3] === 0x53;
    const ext = isWebm ? "webm" : isOgg ? "ogg" : "bin";
    const contentType = isWebm
      ? "audio/webm"
      : isOgg
        ? "audio/ogg"
        : "application/octet-stream";

    const reserved = assets.reserve({
      ownerId,
      kind: "mic",
      bytes: data.length,
      ext,
    });
    assets.storage.writeFile(reserved.storage_key, data);
    db.prepare(
      "UPDATE kaiwa_assets SET bytes=?, checksum=?, media_json=?, processing_status=? WHERE id=?",
    ).run(
      data.length,
      digest,
      JSON.stringify({
        contentType,
        purpose: "segment_clip",
        attemptId,
        segmentId,
        committedAt: new Date().toISOString(),
      }),
      "ready",
      reserved.id,
    );
    db.prepare("DELETE FROM kaiwa_quota_reservations WHERE asset_id=?").run(
      reserved.id,
    );

    const now = new Date().toISOString();
    const version = nextVersion(attemptId, segmentId);
    const id = randomUUID();
    const status: SegmentClipStatus = body.partial ? "partial" : "recorded";
    db.prepare(
      `INSERT INTO kaiwa_segment_clips(
        id,owner_id,attempt_id,segment_id,version,status,audio_asset_id,duration_ms,created_at,updated_at
      ) VALUES(?,?,?,?,?,?,?,?,?,?)`,
    ).run(
      id,
      ownerId,
      attemptId,
      segmentId,
      version,
      status,
      reserved.id,
      body.durationMs ?? null,
      now,
      now,
    );

    const device = readDevice(attempt);
    if (!isCaptureMode(device.captureMode)) {
      device.captureMode = "segment";
      writeDevice(ownerId, attemptId, device);
    }

    return listClips(ownerId, attemptId);
  }

  return {
    setCaptureMode,
    listClips,
    skipSegment,
    recordSegment,
    ownAttempt,
  };
}

export type SegmentClipService = ReturnType<typeof createSegmentClipService>;
