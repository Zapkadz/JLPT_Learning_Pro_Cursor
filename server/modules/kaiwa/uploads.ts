import type Database from "better-sqlite3";
import { createHash, randomUUID } from "node:crypto";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { KaiwaError } from "./repository";
import type { AssetService } from "./assets";
import type { KaiwaConfig } from "./config";

function fail(status: number, message: string): never {
  throw new KaiwaError(status, message);
}

export type UploadRow = {
  id: string;
  owner_id: string;
  asset_id: string;
  purpose: string;
  expected_bytes: number;
  expected_checksum: string | null;
  chunk_size: number;
  chunk_count: number;
  state: string;
  expires_at: string;
  created_at: string;
};

export function createUploadService(
  db: Database.Database,
  assets: AssetService,
  config: KaiwaConfig,
) {
  function ownUpload(ownerId: string, uploadId: string): UploadRow {
    const row = db
      .prepare("SELECT * FROM kaiwa_uploads WHERE id=? AND owner_id=?")
      .get(uploadId, ownerId) as UploadRow | undefined;
    if (!row) fail(404, "Không tìm thấy phiên tải lên.");
    return row;
  }

  function cancel(ownerId: string, uploadId: string, silent = false) {
    const upload = silent
      ? (db
          .prepare("SELECT * FROM kaiwa_uploads WHERE id=? AND owner_id=?")
          .get(uploadId, ownerId) as UploadRow | undefined)
      : ownUpload(ownerId, uploadId);
    if (!upload) return;
    if (upload.state === "completed") {
      if (!silent) fail(409, "Không hủy được phiên đã hoàn tất.");
      return;
    }
    const chunks = db
      .prepare("SELECT storage_key FROM kaiwa_upload_chunks WHERE upload_id=?")
      .all(uploadId) as { storage_key: string }[];
    for (const c of chunks) {
      try {
        assets.storage.remove(c.storage_key);
      } catch {
        /* ignore */
      }
    }
    db.prepare("DELETE FROM kaiwa_upload_chunks WHERE upload_id=?").run(
      uploadId,
    );
    db.prepare("DELETE FROM kaiwa_uploads WHERE id=?").run(uploadId);
    try {
      assets.release(ownerId, upload.asset_id);
    } catch {
      /* asset may already be gone */
    }
  }

  function purgeExpiredUploads(ownerId?: string) {
    const now = new Date().toISOString();
    const rows = (
      ownerId
        ? db
            .prepare(
              "SELECT * FROM kaiwa_uploads WHERE owner_id=? AND state IN ('open','uploading') AND expires_at < ?",
            )
            .all(ownerId, now)
        : db
            .prepare(
              "SELECT * FROM kaiwa_uploads WHERE state IN ('open','uploading') AND expires_at < ?",
            )
            .all(now)
    ) as UploadRow[];
    for (const u of rows) cancel(u.owner_id, u.id, true);
  }

  function createUpload(input: {
    ownerId: string;
    purpose: string;
    bytes: number;
    chunkSize?: number;
    checksum?: string | null;
    ext?: string;
  }): UploadRow {
    purgeExpiredUploads(input.ownerId);
    const bytes = Math.floor(input.bytes);
    const chunkSize = Math.floor(input.chunkSize || 1024 * 1024);
    if (chunkSize < 4 || chunkSize > 8 * 1024 * 1024)
      fail(400, "Kích thước chunk không hợp lệ.");
    if (bytes <= 0 || bytes > config.maxUploadBytes)
      fail(413, "Dung lượng tải lên không hợp lệ hoặc vượt giới hạn.");
    const chunkCount = Math.ceil(bytes / chunkSize);
    const asset = assets.reserve({
      ownerId: input.ownerId,
      kind: input.purpose || "source",
      bytes,
      ext: input.ext || "bin",
    });
    const id = randomUUID();
    const now = new Date().toISOString();
    const expires = new Date(
      Date.now() + config.reservationTtlMs,
    ).toISOString();
    db.prepare(
      `INSERT INTO kaiwa_uploads(
        id,owner_id,asset_id,purpose,expected_bytes,expected_checksum,
        chunk_size,chunk_count,state,expires_at,created_at
      ) VALUES(?,?,?,?,?,?,?,?,?,?,?)`,
    ).run(
      id,
      input.ownerId,
      asset.id,
      input.purpose,
      bytes,
      input.checksum || null,
      chunkSize,
      chunkCount,
      "open",
      expires,
      now,
    );
    return ownUpload(input.ownerId, id);
  }

  function putChunk(
    ownerId: string,
    uploadId: string,
    index: number,
    data: Buffer,
    checksum: string,
  ) {
    const upload = ownUpload(ownerId, uploadId);
    if (upload.state === "completed")
      fail(409, "Phiên tải lên đã hoàn tất.");
    if (upload.state === "cancelled") fail(409, "Phiên tải lên đã bị hủy.");
    if (new Date(upload.expires_at).getTime() < Date.now()) {
      cancel(ownerId, uploadId, true);
      fail(410, "Phiên tải lên đã hết hạn.");
    }
    if (!Number.isInteger(index) || index < 0 || index >= upload.chunk_count)
      fail(400, "Chỉ số chunk ngoài phạm vi.");
    const expectedLen =
      index === upload.chunk_count - 1
        ? upload.expected_bytes - upload.chunk_size * (upload.chunk_count - 1)
        : upload.chunk_size;
    if (data.length !== expectedLen)
      fail(400, "Kích thước chunk không khớp kỳ vọng.");
    const actual = createHash("sha256").update(data).digest("hex");
    if (actual !== checksum.toLowerCase())
      fail(400, "Checksum chunk không khớp.");

    const existing = db
      .prepare(
        "SELECT checksum FROM kaiwa_upload_chunks WHERE upload_id=? AND chunk_index=?",
      )
      .get(uploadId, index) as { checksum: string } | undefined;
    if (existing) {
      if (existing.checksum === actual) return { ok: true, duplicate: true };
      fail(409, "Chunk trùng chỉ số nhưng khác checksum.");
    }

    const asset = assets.ownAsset(ownerId, upload.asset_id);
    const chunkKey = `${asset.storage_key}.part${index}`;
    assets.storage.writeFile(chunkKey, data);
    db.prepare(
      `INSERT INTO kaiwa_upload_chunks(upload_id,chunk_index,checksum,bytes,storage_key,created_at)
       VALUES(?,?,?,?,?,?)`,
    ).run(
      uploadId,
      index,
      actual,
      data.length,
      chunkKey,
      new Date().toISOString(),
    );
    db.prepare(
      "UPDATE kaiwa_uploads SET state='uploading' WHERE id=? AND state='open'",
    ).run(uploadId);
    return { ok: true, duplicate: false };
  }

  function status(ownerId: string, uploadId: string) {
    const upload = ownUpload(ownerId, uploadId);
    const chunks = db
      .prepare(
        "SELECT chunk_index, checksum, bytes FROM kaiwa_upload_chunks WHERE upload_id=? ORDER BY chunk_index",
      )
      .all(uploadId) as {
      chunk_index: number;
      checksum: string;
      bytes: number;
    }[];
    return {
      ...upload,
      receivedIndexes: chunks.map((c) => c.chunk_index),
      receivedCount: chunks.length,
    };
  }

  function complete(ownerId: string, uploadId: string) {
    const upload = ownUpload(ownerId, uploadId);
    if (upload.state === "completed")
      return assets.ownAsset(ownerId, upload.asset_id);
    if (upload.state === "cancelled") fail(409, "Phiên tải lên đã bị hủy.");

    const chunks = db
      .prepare(
        "SELECT chunk_index, storage_key FROM kaiwa_upload_chunks WHERE upload_id=? ORDER BY chunk_index",
      )
      .all(uploadId) as { chunk_index: number; storage_key: string }[];
    if (chunks.length !== upload.chunk_count)
      fail(409, "Thiếu chunk — chưa thể hoàn tất tải lên.");
    for (let i = 0; i < upload.chunk_count; i++) {
      if (chunks[i]?.chunk_index !== i)
        fail(409, "Thiếu chunk — chưa thể hoàn tất tải lên.");
    }

    const parts = chunks.map((c) =>
      readFileSync(assets.storage.resolvePath(c.storage_key)),
    );
    const body = Buffer.concat(parts);
    if (body.length !== upload.expected_bytes)
      fail(409, "Tổng chunk không khớp dung lượng kỳ vọng.");
    const digest = createHash("sha256").update(body).digest("hex");
    if (upload.expected_checksum && upload.expected_checksum !== digest)
      fail(409, "Checksum tổng không khớp.");

    const asset = assets.ownAsset(ownerId, upload.asset_id);
    writeFileSync(assets.storage.resolvePath(asset.storage_key), body);
    for (const c of chunks) {
      try {
        rmSync(assets.storage.resolvePath(c.storage_key), { force: true });
      } catch {
        /* ignore */
      }
    }
    db.prepare("DELETE FROM kaiwa_upload_chunks WHERE upload_id=?").run(
      uploadId,
    );
    db.prepare("UPDATE kaiwa_uploads SET state='completed' WHERE id=?").run(
      uploadId,
    );
    db.prepare("DELETE FROM kaiwa_quota_reservations WHERE asset_id=?").run(
      upload.asset_id,
    );
    db.prepare(
      "UPDATE kaiwa_assets SET bytes=?, checksum=?, media_json=?, processing_status=? WHERE id=?",
    ).run(
      body.length,
      digest,
      JSON.stringify({
        contentType: "application/octet-stream",
        committedAt: new Date().toISOString(),
      }),
      "ready",
      upload.asset_id,
    );
    return assets.ownAsset(ownerId, upload.asset_id);
  }

  return {
    createUpload,
    putChunk,
    status,
    complete,
    cancel,
    ownUpload,
    purgeExpiredUploads,
  };
}

export type UploadService = ReturnType<typeof createUploadService>;
