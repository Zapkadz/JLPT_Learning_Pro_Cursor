import type Database from "better-sqlite3";
import { createHash } from "node:crypto";
import { readFileSync, rmSync } from "node:fs";
import { KaiwaError } from "./repository";
import type { AssetService } from "./assets";
import type { KaiwaConfig } from "./config";

function fail(status: number, message: string): never {
  throw new KaiwaError(status, message);
}

export function ensureAttemptChunksTable(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS kaiwa_attempt_chunks(
      attempt_id TEXT NOT NULL REFERENCES kaiwa_attempts(id) ON DELETE CASCADE,
      chunk_index INTEGER NOT NULL,
      checksum TEXT NOT NULL,
      bytes INTEGER NOT NULL,
      storage_key TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY(attempt_id, chunk_index)
    );
    CREATE INDEX IF NOT EXISTS kaiwa_attempt_chunks_attempt
      ON kaiwa_attempt_chunks(attempt_id);
  `);
}

export function createAttemptChunkService(
  db: Database.Database,
  assets: AssetService,
  config: KaiwaConfig,
) {
  ensureAttemptChunksTable(db);

  function ownAttempt(ownerId: string, attemptId: string) {
    const row = db
      .prepare("SELECT * FROM kaiwa_attempts WHERE id=? AND owner_id=?")
      .get(attemptId, ownerId) as
      | {
          id: string;
          finalized_at: string | null;
          audio_asset_id: string | null;
          record_state: string;
        }
      | undefined;
    if (!row) fail(404, "Không tìm thấy bản thu.");
    return row;
  }

  function putChunk(
    ownerId: string,
    attemptId: string,
    index: number,
    data: Buffer,
    checksum: string,
  ) {
    const attempt = ownAttempt(ownerId, attemptId);
    if (attempt.finalized_at)
      fail(409, "Bản thu đã chốt — không nhận thêm chunk.");
    if (!Number.isInteger(index) || index < 0 || index > 100_000)
      fail(400, "Chỉ số chunk không hợp lệ.");
    if (!/^[a-f0-9]{64}$/i.test(checksum))
      fail(400, "Checksum chunk không hợp lệ.");
    if (data.length <= 0) fail(400, "Chunk rỗng.");
    if (data.length > config.maxUploadBytes)
      fail(413, "Chunk vượt giới hạn tải lên.");

    const actual = createHash("sha256").update(data).digest("hex");
    if (actual !== checksum.toLowerCase())
      fail(409, "Checksum chunk không khớp.");

    const existing = db
      .prepare(
        "SELECT checksum FROM kaiwa_attempt_chunks WHERE attempt_id=? AND chunk_index=?",
      )
      .get(attemptId, index) as { checksum: string } | undefined;
    if (existing) {
      if (existing.checksum === actual) return { ok: true, duplicate: true };
      fail(409, "Chunk trùng chỉ số nhưng checksum khác.");
    }

    const key = assets.storage.createKey("attempt-chunk", "bin");
    assets.storage.writeFile(key, data);
    db.prepare(
      `INSERT INTO kaiwa_attempt_chunks(attempt_id,chunk_index,checksum,bytes,storage_key,created_at)
       VALUES(?,?,?,?,?,?)`,
    ).run(
      attemptId,
      index,
      actual,
      data.length,
      key,
      new Date().toISOString(),
    );
    db.prepare(
      "UPDATE kaiwa_attempts SET record_state='uploading' WHERE id=? AND record_state IN ('ready','idle','uploading')",
    ).run(attemptId);
    return { ok: true, duplicate: false };
  }

  function uploadState(ownerId: string, attemptId: string) {
    ownAttempt(ownerId, attemptId);
    const chunks = db
      .prepare(
        "SELECT chunk_index, checksum, bytes FROM kaiwa_attempt_chunks WHERE attempt_id=? ORDER BY chunk_index",
      )
      .all(attemptId) as {
      chunk_index: number;
      checksum: string;
      bytes: number;
    }[];
    return {
      attemptId,
      receivedIndexes: chunks.map((c) => c.chunk_index),
      receivedCount: chunks.length,
      receivedBytes: chunks.reduce((n, c) => n + c.bytes, 0),
    };
  }

  function assemble(ownerId: string, attemptId: string) {
    const attempt = ownAttempt(ownerId, attemptId);
    if (attempt.audio_asset_id) {
      return assets.ownAsset(ownerId, attempt.audio_asset_id);
    }
    if (attempt.finalized_at)
      fail(409, "Bản thu đã chốt nhưng thiếu audio — không lắp lại.");

    const chunks = db
      .prepare(
        "SELECT chunk_index, storage_key, bytes FROM kaiwa_attempt_chunks WHERE attempt_id=? ORDER BY chunk_index",
      )
      .all(attemptId) as {
      chunk_index: number;
      storage_key: string;
      bytes: number;
    }[];
    if (chunks.length === 0)
      fail(409, "Chưa có chunk — không báo đã lưu audio.");
    for (let i = 0; i < chunks.length; i++) {
      if (chunks[i].chunk_index !== i)
        fail(409, "Thiếu chunk theo thứ tự — chưa lắp audio.");
    }

    const parts = chunks.map((c) =>
      readFileSync(assets.storage.resolvePath(c.storage_key)),
    );
    const body = Buffer.concat(parts);
    if (body.length < 16)
      fail(422, "Audio quá ngắn / không giải mã được — không báo đã lưu.");

    // Minimal WebM/EBML or Ogg sniff — reject obvious garbage
    const isWebm =
      body[0] === 0x1a && body[1] === 0x45 && body[2] === 0xdf && body[3] === 0xa3;
    const isOgg =
      body[0] === 0x4f && body[1] === 0x67 && body[2] === 0x67 && body[3] === 0x53;
    if (!isWebm && !isOgg)
      fail(422, "Định dạng audio không nhận diện được — không báo đã lưu.");

    const digest = createHash("sha256").update(body).digest("hex");
    const reserved = assets.reserve({
      ownerId,
      kind: "mic",
      bytes: body.length,
      ext: isWebm ? "webm" : "ogg",
    });
    assets.storage.writeFile(reserved.storage_key, body);
    db.prepare(
      "UPDATE kaiwa_assets SET bytes=?, checksum=?, media_json=?, processing_status=? WHERE id=?",
    ).run(
      body.length,
      digest,
      JSON.stringify({
        contentType: isWebm ? "audio/webm" : "audio/ogg",
        committedAt: new Date().toISOString(),
        purpose: "attempt_mic",
        attemptId,
      }),
      "ready",
      reserved.id,
    );
    db.prepare("DELETE FROM kaiwa_quota_reservations WHERE asset_id=?").run(
      reserved.id,
    );
    db.prepare(
      "UPDATE kaiwa_attempts SET audio_asset_id=? WHERE id=? AND owner_id=?",
    ).run(reserved.id, attemptId, ownerId);

    for (const c of chunks) {
      try {
        rmSync(assets.storage.resolvePath(c.storage_key), { force: true });
      } catch {
        /* ignore */
      }
    }
    db.prepare("DELETE FROM kaiwa_attempt_chunks WHERE attempt_id=?").run(
      attemptId,
    );

    return assets.ownAsset(ownerId, reserved.id);
  }

  return { putChunk, uploadState, assemble, ownAttempt };
}

export type AttemptChunkService = ReturnType<typeof createAttemptChunkService>;
