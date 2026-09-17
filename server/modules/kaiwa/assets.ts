import type Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import { KaiwaError } from "./repository";
import type { KaiwaConfig } from "./config";
import { LocalMediaStorage } from "./storage";

function fail(status: number, message: string, code?: string): never {
  const err = new KaiwaError(status, message);
  (err as KaiwaError & { code?: string }).code = code;
  throw err;
}

type AssetRow = {
  id: string;
  owner_id: string;
  storage_key: string;
  kind: string;
  checksum: string | null;
  bytes: number | null;
  media_json: string;
  processing_status: string;
  created_at: string;
};

export function createAssetService(
  db: Database.Database,
  config: KaiwaConfig,
  storage = new LocalMediaStorage(config.mediaRoot),
) {
  function purgeExpiredReservations(ownerId?: string) {
    const now = new Date().toISOString();
    const rows = (
      ownerId
        ? db
            .prepare(
              "SELECT r.id, r.asset_id, a.storage_key FROM kaiwa_quota_reservations r JOIN kaiwa_assets a ON a.id=r.asset_id WHERE r.owner_id=? AND r.expires_at < ?",
            )
            .all(ownerId, now)
        : db
            .prepare(
              "SELECT r.id, r.asset_id, a.storage_key FROM kaiwa_quota_reservations r JOIN kaiwa_assets a ON a.id=r.asset_id WHERE r.expires_at < ?",
            )
            .all(now)
    ) as { id: string; asset_id: string; storage_key: string }[];
    for (const row of rows) {
      storage.remove(row.storage_key);
      db.prepare("DELETE FROM kaiwa_quota_reservations WHERE id=?").run(row.id);
      db.prepare("DELETE FROM kaiwa_assets WHERE id=?").run(row.asset_id);
    }
  }

  function usageBytes(ownerId: string): number {
    const row = db
      .prepare(
        `SELECT COALESCE(SUM(bytes),0) AS n FROM kaiwa_assets
         WHERE owner_id=? AND processing_status IN ('reserved','pending','processing','ready')`,
      )
      .get(ownerId) as { n: number };
    return Number(row.n) || 0;
  }

  function usageBytesFresh(ownerId: string): number {
    purgeExpiredReservations(ownerId);
    return usageBytes(ownerId);
  }

  function reserve(input: {
    ownerId: string;
    kind: string;
    bytes: number;
    ext?: string;
  }): AssetRow {
    const bytes = Math.floor(input.bytes);
    if (!Number.isFinite(bytes) || bytes <= 0)
      fail(400, "Dung lượng đặt chỗ không hợp lệ.", "invalid_reservation");
    if (bytes > config.maxUploadBytes)
      fail(
        413,
        `Tệp vượt giới hạn tải lên (${config.maxUploadBytes} byte).`,
        "upload_too_large",
      );

    return db.transaction(() => {
      purgeExpiredReservations(input.ownerId);
      const used = usageBytes(input.ownerId);
      if (used + bytes > config.quotaBytesPerUser) {
        fail(
          413,
          "Đã hết hạn mức lưu trữ Kaiwa. Hãy xóa dự án cũ hoặc hủy bản nháp.",
          "quota_exceeded",
        );
      }
      const id = randomUUID();
      const storageKey = storage.createKey(input.kind, input.ext || "bin");
      const now = new Date().toISOString();
      const expires = new Date(
        Date.now() + config.reservationTtlMs,
      ).toISOString();
      db.prepare(
        "INSERT INTO kaiwa_assets(id,owner_id,storage_key,kind,bytes,media_json,processing_status,created_at) VALUES(?,?,?,?,?,?,?,?)",
      ).run(
        id,
        input.ownerId,
        storageKey,
        input.kind,
        bytes,
        JSON.stringify({ reserved: true }),
        "reserved",
        now,
      );
      db.prepare(
        "INSERT INTO kaiwa_quota_reservations(id,owner_id,asset_id,bytes,expires_at,created_at) VALUES(?,?,?,?,?,?)",
      ).run(randomUUID(), input.ownerId, id, bytes, expires, now);
      return db
        .prepare("SELECT * FROM kaiwa_assets WHERE id=?")
        .get(id) as AssetRow;
    })();
  }

  function release(ownerId: string, assetId: string): void {
    const asset = db
      .prepare("SELECT * FROM kaiwa_assets WHERE id=? AND owner_id=?")
      .get(assetId, ownerId) as AssetRow | undefined;
    if (!asset) fail(404, "Không tìm thấy tài nguyên media.", "asset_not_found");
    storage.remove(asset.storage_key);
    db.prepare("DELETE FROM kaiwa_quota_reservations WHERE asset_id=?").run(
      assetId,
    );
    db.prepare("DELETE FROM kaiwa_assets WHERE id=? AND owner_id=?").run(
      assetId,
      ownerId,
    );
  }

  function commitBytes(
    ownerId: string,
    assetId: string,
    data: Buffer,
    meta: { contentType?: string; checksum?: string } = {},
  ): AssetRow {
    const asset = db
      .prepare("SELECT * FROM kaiwa_assets WHERE id=? AND owner_id=?")
      .get(assetId, ownerId) as AssetRow | undefined;
    if (!asset) fail(404, "Không tìm thấy tài nguyên media.", "asset_not_found");
    if (asset.processing_status !== "reserved")
      fail(409, "Tài nguyên không ở trạng thái đặt chỗ.", "invalid_asset_state");
    if (data.length > (asset.bytes || 0))
      fail(413, "Dữ liệu vượt dung lượng đã đặt chỗ.", "upload_too_large");

    storage.writeFile(asset.storage_key, data);
    const nowMedia = {
      contentType: meta.contentType || "application/octet-stream",
      committedAt: new Date().toISOString(),
    };
    db.prepare(
      "UPDATE kaiwa_assets SET bytes=?, checksum=?, media_json=?, processing_status=? WHERE id=?",
    ).run(
      data.length,
      meta.checksum || null,
      JSON.stringify(nowMedia),
      "ready",
      assetId,
    );
    db.prepare("DELETE FROM kaiwa_quota_reservations WHERE asset_id=?").run(
      assetId,
    );
    return db
      .prepare("SELECT * FROM kaiwa_assets WHERE id=?")
      .get(assetId) as AssetRow;
  }

  function ownAsset(ownerId: string, assetId: string): AssetRow {
    const asset = db
      .prepare("SELECT * FROM kaiwa_assets WHERE id=? AND owner_id=?")
      .get(assetId, ownerId) as AssetRow | undefined;
    if (!asset) fail(404, "Không tìm thấy tài nguyên media.", "asset_not_found");
    return asset;
  }

  return {
    storage,
    config,
    usageBytes: usageBytesFresh,
    reserve,
    release,
    commitBytes,
    ownAsset,
    purgeExpiredReservations,
  };
}

export type AssetService = ReturnType<typeof createAssetService>;
