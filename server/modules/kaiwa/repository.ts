import type Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import {
  createKaiwaProjectSchema,
  patchKaiwaProjectSchema,
  saveKaiwaDraftSchema,
  publishKaiwaRevisionSchema,
  type KaiwaRevisionPayload,
} from "../../../shared/kaiwa/types";

export class KaiwaError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

function fail(status: number, message: string): never {
  throw new KaiwaError(status, message);
}

type ProjectRow = {
  id: string;
  owner_id: string;
  title: string;
  source_asset_id: string | null;
  proxy_asset_id: string | null;
  active_revision_id: string | null;
  status: string;
  version: number;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

type RevisionRow = {
  id: string;
  project_id: string;
  version: number;
  state: string;
  payload: string;
  source_json: string;
  created_at: string;
};

export function createKaiwaRepository(db: Database.Database) {
  function ownProject(projectId: string, ownerId: string): ProjectRow {
    const row = db
      .prepare(
        "SELECT * FROM kaiwa_projects WHERE id=? AND owner_id=? AND deleted_at IS NULL",
      )
      .get(projectId, ownerId) as ProjectRow | undefined;
    if (!row) fail(404, "Không tìm thấy dự án Kaiwa trong tài khoản của bạn.");
    return row;
  }

  function getRevision(revisionId: string): RevisionRow {
    const row = db
      .prepare("SELECT * FROM kaiwa_revisions WHERE id=?")
      .get(revisionId) as RevisionRow | undefined;
    if (!row) fail(404, "Không tìm thấy phiên bản lời thoại.");
    return row;
  }

  function createProject(ownerId: string, input: unknown) {
    const data = createKaiwaProjectSchema.parse(input);
    if (data.sourceAssetId) {
      const asset = db
        .prepare(
          "SELECT id FROM kaiwa_assets WHERE id=? AND owner_id=? AND processing_status='ready'",
        )
        .get(data.sourceAssetId, ownerId);
      if (!asset) fail(404, "Không tìm thấy video nguồn sẵn sàng trong tài khoản.");
    }
    const now = new Date().toISOString();
    const projectId = randomUUID();
    const revisionId = randomUUID();
    const empty: KaiwaRevisionPayload = { segments: [] };
    db.transaction(() => {
      db.prepare(
        "INSERT INTO kaiwa_projects(id,owner_id,title,source_asset_id,status,version,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)",
      ).run(
        projectId,
        ownerId,
        data.title,
        data.sourceAssetId ?? null,
        data.sourceAssetId ? "processing" : "draft",
        0,
        now,
        now,
      );
      db.prepare(
        "INSERT INTO kaiwa_revisions(id,project_id,version,state,payload,source_json,created_at) VALUES(?,?,?,?,?,?,?)",
      ).run(
        revisionId,
        projectId,
        1,
        "draft",
        JSON.stringify(empty),
        "{}",
        now,
      );
      db.prepare(
        "UPDATE kaiwa_projects SET active_revision_id=?, updated_at=? WHERE id=?",
      ).run(revisionId, now, projectId);
    })();
    return ownProject(projectId, ownerId);
  }

  function patchProject(ownerId: string, projectId: string, input: unknown) {
    const data = patchKaiwaProjectSchema.parse(input);
    const project = ownProject(projectId, ownerId);
    if (project.version !== data.expectedVersion) {
      fail(409, "Dự án đã được thay đổi ở nơi khác. Tải lại trước khi lưu.");
    }
    if (data.sourceAssetId) {
      const asset = db
        .prepare(
          "SELECT id FROM kaiwa_assets WHERE id=? AND owner_id=? AND processing_status='ready'",
        )
        .get(data.sourceAssetId, ownerId);
      if (!asset) fail(404, "Không tìm thấy video nguồn sẵn sàng trong tài khoản.");
    }
    const now = new Date().toISOString();
    const title = data.title ?? project.title;
    const sourceAssetId =
      data.sourceAssetId !== undefined
        ? data.sourceAssetId
        : project.source_asset_id;
    const proxyAssetId =
      data.proxyAssetId !== undefined
        ? data.proxyAssetId
        : project.proxy_asset_id;
    const status = data.status ?? project.status;
    const result = db
      .prepare(
        `UPDATE kaiwa_projects SET title=?, source_asset_id=?, proxy_asset_id=?, status=?,
         version=version+1, updated_at=? WHERE id=? AND owner_id=? AND version=?`,
      )
      .run(
        title,
        sourceAssetId,
        proxyAssetId,
        status,
        now,
        projectId,
        ownerId,
        data.expectedVersion,
      );
    if (result.changes !== 1) {
      fail(409, "Dự án đã được thay đổi ở nơi khác. Tải lại trước khi lưu.");
    }
    return ownProject(projectId, ownerId);
  }

  function saveDraft(ownerId: string, projectId: string, input: unknown) {
    const data = saveKaiwaDraftSchema.parse(input);
    const project = ownProject(projectId, ownerId);
    if (!project.active_revision_id) fail(500, "Dự án thiếu revision đang mở.");
    const active = getRevision(project.active_revision_id);
    if (active.state !== "draft") {
      fail(409, "Revision đã chốt không thể sửa tại chỗ. Hãy tạo bản nháp mới.");
    }
    if (active.version !== data.expectedRevisionVersion) {
      fail(
        409,
        "Lời thoại đã được sửa ở nơi khác. Tải lại trước khi lưu tiếp.",
      );
    }
    const now = new Date().toISOString();
    // Immutable history: bump version row instead of mutating reviewed takes' revision id.
    // Draft edits update the current draft row payload only while state=draft and version matches.
    const result = db
      .prepare(
        "UPDATE kaiwa_revisions SET payload=? WHERE id=? AND project_id=? AND version=? AND state='draft'",
      )
      .run(
        JSON.stringify(data.payload),
        active.id,
        projectId,
        data.expectedRevisionVersion,
      );
    if (result.changes !== 1) {
      fail(
        409,
        "Lời thoại đã được sửa ở nơi khác. Tải lại trước khi lưu tiếp.",
      );
    }
    db.prepare(
      "UPDATE kaiwa_projects SET updated_at=?, version=version+1 WHERE id=? AND owner_id=?",
    ).run(now, projectId, ownerId);
    return getRevision(active.id);
  }

  function publishRevision(ownerId: string, projectId: string, input: unknown) {
    const data = publishKaiwaRevisionSchema.parse(input);
    const project = ownProject(projectId, ownerId);
    if (!project.active_revision_id) fail(500, "Dự án thiếu revision đang mở.");
    const active = getRevision(project.active_revision_id);
    if (active.version !== data.expectedRevisionVersion) {
      fail(409, "Không thể chốt — phiên bản lời thoại đã đổi.");
    }
    if (active.state === "reviewed") return active;
    const now = new Date().toISOString();
    db.transaction(() => {
      db.prepare(
        "UPDATE kaiwa_revisions SET state='reviewed' WHERE id=? AND version=?",
      ).run(active.id, active.version);
      // Next editable draft is a new immutable version lineage head.
      const nextId = randomUUID();
      const nextVersion = active.version + 1;
      db.prepare(
        "INSERT INTO kaiwa_revisions(id,project_id,version,state,payload,source_json,created_at) VALUES(?,?,?,?,?,?,?)",
      ).run(
        nextId,
        projectId,
        nextVersion,
        "draft",
        active.payload,
        active.source_json,
        now,
      );
      db.prepare(
        "UPDATE kaiwa_projects SET active_revision_id=?, updated_at=?, version=version+1 WHERE id=?",
      ).run(nextId, now, projectId);
    })();
    return getRevision(active.id);
  }

  function createAttempt(ownerId: string, projectId: string) {
    const project = ownProject(projectId, ownerId);
    if (!project.active_revision_id) fail(400, "Chưa có revision để thu.");
    // Capture against the last *reviewed* revision when present; else active draft.
    const reviewed = db
      .prepare(
        "SELECT * FROM kaiwa_revisions WHERE project_id=? AND state='reviewed' ORDER BY version DESC LIMIT 1",
      )
      .get(projectId) as RevisionRow | undefined;
    const revision = reviewed ?? getRevision(project.active_revision_id);
    const id = randomUUID();
    const now = new Date().toISOString();
    db.prepare(
      "INSERT INTO kaiwa_attempts(id,owner_id,project_id,revision_id,record_state,created_at) VALUES(?,?,?,?,?,?)",
    ).run(id, ownerId, projectId, revision.id, "ready", now);
    return db
      .prepare("SELECT * FROM kaiwa_attempts WHERE id=? AND owner_id=?")
      .get(id, ownerId);
  }

  function getAttempt(ownerId: string, attemptId: string) {
    const row = db
      .prepare("SELECT * FROM kaiwa_attempts WHERE id=? AND owner_id=?")
      .get(attemptId, ownerId) as Record<string, unknown> | undefined;
    if (!row) fail(404, "Không tìm thấy bản thu trong tài khoản của bạn.");
    const revision = getRevision(String(row.revision_id));
    const project = ownProject(String(row.project_id), ownerId);
    const payload = JSON.parse(
      (revision.payload as string) || '{"segments":[]}',
    ) as { segments: unknown[] };
    const segments = Array.isArray(payload.segments) ? payload.segments : [];
    return {
      ...row,
      projectTitle: project.title,
      proxyAssetId: project.proxy_asset_id,
      revision: {
        id: revision.id,
        version: revision.version,
        state: revision.state,
        payload: { segments },
      },
      assessableReady: segments.length > 0,
      assessableMessage:
        segments.length > 0
          ? null
          : "Chưa có lời thoại — vẫn thu được, nhưng chưa đủ chuẩn để chấm phát âm.",
    };
  }

  return {
    createProject,
    patchProject,
    ownProject,
    saveDraft,
    publishRevision,
    createAttempt,
    getAttempt,
    getRevision,
  };
}

export type KaiwaRepository = ReturnType<typeof createKaiwaRepository>;
