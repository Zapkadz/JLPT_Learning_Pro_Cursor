import express, { Router, type Request, type Response } from "express";
import type Database from "better-sqlite3";
import { readFileSync } from "node:fs";
import { z } from "zod";
import { createKaiwaRepository, KaiwaError } from "./repository";
import { loadKaiwaConfig, type KaiwaConfig } from "./config";
import { createAssetService } from "./assets";
import { createJobService } from "./jobs";
import { createUploadService } from "./uploads";
import { createProbeService } from "./probeService";
import { createProxyService } from "./proxy";
import { createAttemptChunkService } from "./attemptChunks";
import { createFinalizeTakeService } from "./finalizeTake";
import { createExportService } from "./exportMp4";
import { listActivityHistory } from "./activity";
import { createOpsService, redactForLog } from "./ops";
import { resolveSpeechCapability } from "./speechCapability";
import { createAudioQualityService } from "./audioQualityService";
import { createAlignmentService } from "./alignmentService";
import { createPronunciationService } from "./pronunciationService";
import { createProsodyService } from "./prosodyService";

export { KaiwaError };

function parseRange(
  header: string | undefined,
  size: number,
): { start: number; end: number } | "invalid" | null {
  if (!header) return null;
  const m = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!m) return "invalid";
  let start = m[1] === "" ? NaN : Number(m[1]);
  let end = m[2] === "" ? NaN : Number(m[2]);
  if (Number.isNaN(start) && Number.isNaN(end)) return "invalid";
  if (Number.isNaN(start)) {
    const suffix = end;
    if (suffix <= 0) return "invalid";
    start = Math.max(size - suffix, 0);
    end = size - 1;
  } else if (Number.isNaN(end)) {
    end = size - 1;
  }
  if (start < 0 || end < start || start >= size) return "invalid";
  end = Math.min(end, size - 1);
  return { start, end };
}

export function kaiwaModule(
  db: Database.Database,
  configOverrides: Partial<KaiwaConfig> = {},
) {
  db.transaction(() => {
    db.exec(readFileSync(new URL("./migration.sql", import.meta.url), "utf8"));
    db.prepare("INSERT OR IGNORE INTO schema_migrations VALUES(?,?)").run(
      "kaiwa-001",
      new Date().toISOString(),
    );
    db.prepare("INSERT OR IGNORE INTO schema_migrations VALUES(?,?)").run(
      "kaiwa-002",
      new Date().toISOString(),
    );
    db.prepare("INSERT OR IGNORE INTO schema_migrations VALUES(?,?)").run(
      "kaiwa-003",
      new Date().toISOString(),
    );
    const cols = db.prepare("PRAGMA table_info(kaiwa_projects)").all() as {
      name: string;
    }[];
    if (!cols.some((c) => c.name === "proxy_asset_id")) {
      db.exec("ALTER TABLE kaiwa_projects ADD COLUMN proxy_asset_id TEXT");
    }
    db.prepare("INSERT OR IGNORE INTO schema_migrations VALUES(?,?)").run(
      "kaiwa-004",
      new Date().toISOString(),
    );
    db.prepare("INSERT OR IGNORE INTO schema_migrations VALUES(?,?)").run(
      "kaiwa-005",
      new Date().toISOString(),
    );
  })();

  const config = loadKaiwaConfig(configOverrides);
  const repo = createKaiwaRepository(db);
  const assets = createAssetService(db, config);
  const jobService = createJobService(db);
  const uploads = createUploadService(db, assets, config);
  const probes = createProbeService(db, assets);
  const proxies = createProxyService(db, assets);
  const attemptChunks = createAttemptChunkService(db, assets, config);
  const finalizeTake = createFinalizeTakeService(db, assets, attemptChunks);
  const exports = createExportService(db, assets, jobService);
  const ops = createOpsService(db, assets, jobService, config);
  const audioQuality = createAudioQualityService(db, assets);
  const alignment = createAlignmentService(db);
  const pronunciation = createPronunciationService(db);
  const prosody = createProsodyService(db, assets);
  const router = Router();

  router.get("/projects", (_req, res) => {
    const uid = res.locals.user.id as string;
    const rows = db
      .prepare(
        `SELECT id,title,status,version,source_asset_id,proxy_asset_id,active_revision_id,updated_at,created_at
         FROM kaiwa_projects WHERE owner_id=? AND deleted_at IS NULL ORDER BY updated_at DESC`,
      )
      .all(uid);
    res.json({ projects: rows });
  });

  router.get("/history", (req, res) => {
    const limit = Number(req.query.limit) || 50;
    res.json(listActivityHistory(db, res.locals.user.id, limit));
  });

  router.get("/capabilities/speech", (_req, res) => {
    res.json(resolveSpeechCapability());
  });

  router.post("/projects/:id/transcriptions", (_req, res) => {
    const cap = resolveSpeechCapability();
    res.status(503).json({
      error: cap.transcription.messageVi,
      code: "speech_not_configured",
      status: cap.transcription.status,
    });
  });

  router.post("/projects/:id/translations", (_req, res) => {
    const cap = resolveSpeechCapability();
    res.status(503).json({
      error: cap.translation.messageVi,
      code: "speech_not_configured",
      status: cap.translation.status,
    });
  });

  router.post("/projects", (req, res) => {
    const project = repo.createProject(res.locals.user.id, req.body);
    res.status(201).json(project);
  });

  router.delete("/projects/:id", (req, res) => {
    const result = ops.softDeleteProject(
      res.locals.user.id,
      String(req.params.id),
    );
    res.json(result);
  });

  router.get("/ops/snapshot", (_req, res) => {
    res.json(ops.opsSnapshot(res.locals.user.id));
  });

  router.post("/ops/gc", (_req, res) => {
    ops.purgeExpiredUploads();
    const gc = ops.garbageCollectTombstones(res.locals.user.id);
    res.json({ ok: true, gc, note: redactForLog({ action: "gc" }) });
  });

  router.get("/projects/:id", (req, res) => {
    res.json(repo.ownProject(String(req.params.id), res.locals.user.id));
  });

  router.get("/projects/:id/active-revision", (req, res) => {
    const project = repo.ownProject(
      String(req.params.id),
      res.locals.user.id,
    );
    if (!project.active_revision_id) {
      throw new KaiwaError(404, "Dự án chưa có bản lời thoại.");
    }
    const revision = repo.getRevision(project.active_revision_id);
    const payload = JSON.parse(revision.payload || '{"segments":[]}');
    res.json({
      projectId: project.id,
      revisionId: revision.id,
      version: revision.version,
      state: revision.state,
      payload,
      source_json: JSON.parse(revision.source_json || "{}"),
    });
  });

  router.patch("/projects/:id", (req, res) => {
    res.json(
      repo.patchProject(res.locals.user.id, String(req.params.id), req.body),
    );
  });

  router.put("/projects/:id/draft", (req, res) => {
    res.json(
      repo.saveDraft(res.locals.user.id, String(req.params.id), req.body),
    );
  });

  router.post("/projects/:id/revisions", (req, res) => {
    const reviewed = repo.publishRevision(
      res.locals.user.id,
      String(req.params.id),
      req.body,
    );
    res.status(201).json(reviewed);
  });

  router.post("/projects/:id/attempts", (req, res) => {
    const attempt = repo.createAttempt(
      res.locals.user.id,
      String(req.params.id),
    );
    res.status(201).json(attempt);
  });

  router.get("/projects/:id/attempts", (req, res) => {
    res.json({
      attempts: repo.listAttempts(
        res.locals.user.id,
        String(req.params.id),
      ),
    });
  });

  /** Prep → optional publish → create attempt with immutable revision pin. */
  router.post("/projects/:id/start-practice", (req, res) => {
    const ownerId = res.locals.user.id as string;
    const projectId = String(req.params.id);
    const body = z
      .object({
        publish: z.boolean().optional(),
        expectedRevisionVersion: z.number().int().nonnegative().optional(),
      })
      .parse(req.body ?? {});
    const project = repo.ownProject(projectId, ownerId);
    if (!project.active_revision_id) {
      throw new KaiwaError(400, "Dự án chưa có lời thoại.");
    }
    let revision = repo.getRevision(project.active_revision_id);
    if (body.publish !== false && revision.state === "draft") {
      const version = body.expectedRevisionVersion ?? revision.version;
      revision = repo.publishRevision(ownerId, projectId, {
        expectedRevisionVersion: version,
      });
    }
    const attemptRow = repo.createAttempt(ownerId, projectId);
    const attempt = repo.getAttempt(ownerId, (attemptRow as { id: string }).id);
    res.status(201).json(attempt);
  });

  router.post("/projects/:id/prepare-media", async (req, res, next) => {
    try {
      const ownerId = res.locals.user.id as string;
      const project = repo.ownProject(String(req.params.id), ownerId);
      if (!project.source_asset_id) {
        throw new KaiwaError(409, "Dự án chưa gắn video nguồn.");
      }
      if (project.proxy_asset_id) {
        const existing = assets.ownAsset(ownerId, project.proxy_asset_id);
        if (existing.processing_status === "ready") {
          return res.json({
            project,
            proxyAssetId: project.proxy_asset_id,
            reused: true,
          });
        }
      }
      let prepared;
      try {
        prepared = await proxies.preparePlayback(
          ownerId,
          project.source_asset_id,
        );
      } catch (prepErr) {
        try {
          const fresh = repo.ownProject(project.id, ownerId);
          repo.patchProject(ownerId, project.id, {
            expectedVersion: fresh.version,
            status: "failed",
          });
        } catch {
          /* best-effort */
        }
        throw prepErr;
      }
      const updated = repo.patchProject(ownerId, project.id, {
        expectedVersion: project.version,
        proxyAssetId: prepared.proxyAssetId,
        status: "ready",
      });
      res.status(201).json({
        project: updated,
        proxyAssetId: prepared.proxyAssetId,
        timeline: prepared.timeline,
        engine: prepared.engine,
        reused: false,
      });
    } catch (e) {
      next(e);
    }
  });

  router.get("/attempts/:id", (req, res) => {
    res.json(repo.getAttempt(res.locals.user.id, String(req.params.id)));
  });

  router.patch("/attempts/:id/mix", (req, res) => {
    const body = z
      .object({
        originalGain: z.number().min(0).max(1),
        learnerGain: z.number().min(0).max(1),
        keep: z.boolean().optional(),
      })
      .parse(req.body);
    res.json(
      repo.patchAttemptMix(res.locals.user.id, String(req.params.id), body),
    );
  });

  router.post("/attempts/:id/audio-quality", (req, res) => {
    const report = audioQuality.checkAttempt(
      res.locals.user.id,
      String(req.params.id),
    );
    res.json(report);
  });

  router.get("/attempts/:id/audio-quality", (req, res) => {
    const stored = audioQuality.getStored(
      res.locals.user.id,
      String(req.params.id),
    );
    if (!stored) {
      res.status(404).json({
        error: "Chưa có kết quả kiểm tra chất lượng cho bản thu này.",
        code: "quality_not_run",
      });
      return;
    }
    res.json(stored);
  });

  router.post("/attempts/:id/alignment", (req, res) => {
    const body = z
      .object({ offsetMs: z.number().optional() })
      .parse(req.body ?? {});
    res.json(
      alignment.alignAttempt(res.locals.user.id, String(req.params.id), body),
    );
  });

  router.get("/attempts/:id/alignment", (req, res) => {
    const stored = alignment.getStored(
      res.locals.user.id,
      String(req.params.id),
    );
    if (!stored) {
      res.status(404).json({
        error: "Chưa có căn chỉnh cho bản thu này.",
        code: "alignment_not_run",
      });
      return;
    }
    res.json(stored);
  });

  router.post("/attempts/:id/pronunciation", (req, res) => {
    res.json(
      pronunciation.assessAttempt(
        res.locals.user.id,
        String(req.params.id),
      ),
    );
  });

  router.get("/attempts/:id/pronunciation", (req, res) => {
    const stored = pronunciation.getStored(
      res.locals.user.id,
      String(req.params.id),
    );
    if (!stored) {
      res.status(404).json({
        error: "Chưa có kết quả chấm phát âm cho bản thu này.",
        code: "pronunciation_not_run",
      });
      return;
    }
    res.json(stored);
  });

  router.post("/attempts/:id/prosody", (req, res) => {
    res.json(
      prosody.analyzeAttempt(res.locals.user.id, String(req.params.id)),
    );
  });

  router.get("/attempts/:id/prosody", (req, res) => {
    const stored = prosody.getStored(
      res.locals.user.id,
      String(req.params.id),
    );
    if (!stored) {
      res.status(404).json({
        error: "Chưa có phân tích nhịp/ngữ điệu cho bản thu này.",
        code: "prosody_not_run",
      });
      return;
    }
    res.json(stored);
  });

  router.post("/attempts/:id/exports", (req, res) => {
    const body = z
      .object({
        originalGain: z.number().min(0).max(1).optional(),
        learnerGain: z.number().min(0).max(1).optional(),
        offsetMs: z.number().optional(),
      })
      .parse(req.body ?? {});
    const { export: row, reused } = exports.createOrGetExport(
      res.locals.user.id,
      String(req.params.id),
      body,
    );
    res.status(reused ? 200 : 201).json(row);
  });

  router.get("/exports/:id", (req, res) => {
    res.json(exports.getExport(res.locals.user.id, String(req.params.id)));
  });

  router.get("/exports/:id/download", (req, res, next) => {
    try {
      const row = exports.getExport(res.locals.user.id, String(req.params.id));
      if (row.state !== "ready" || !row.asset_id) {
        throw new KaiwaError(409, "Bản xuất chưa sẵn sàng để tải.");
      }
      const asset = assets.ownAsset(res.locals.user.id, row.asset_id);
      const st = assets.storage.stat(asset.storage_key);
      if (!st) throw new KaiwaError(404, "Thiếu tệp xuất.");
      const media = JSON.parse(asset.media_json || "{}") as {
        contentType?: string;
      };
      res.setHeader(
        "Content-Type",
        media.contentType || "video/mp4",
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="kaiwa-export-${row.id.slice(0, 8)}.mp4"`,
      );
      res.setHeader("Content-Length", String(st.size));
      assets.storage.openRead(asset.storage_key).stream.pipe(res);
    } catch (e) {
      next(e);
    }
  });

  router.post("/attempts/:id/finalize", (req, res) => {
    const ownerId = res.locals.user.id as string;
    const attemptId = String(req.params.id);
    const body = z
      .object({
        completion: z.enum([
          "completed",
          "partial",
          "interrupted",
          "failed",
        ]),
        durationMs: z.number().int().nonnegative().optional(),
        clocks: z.record(z.unknown()).optional(),
        device: z.record(z.unknown()).optional(),
        assemble: z.boolean().optional(),
      })
      .parse(req.body);
    const result = finalizeTake.finalize(ownerId, attemptId, body);
    const attempt = repo.getAttempt(ownerId, attemptId);
    res.status(result.reused ? 200 : 200).json({ ...attempt, finalize: result });
  });

  router.get("/attempts/:id/upload-state", (req, res) => {
    res.json(
      attemptChunks.uploadState(res.locals.user.id, String(req.params.id)),
    );
  });

  router.put(
    "/attempts/:id/chunks/:index",
    express.raw({ type: () => true, limit: config.maxUploadBytes }),
    (req, res) => {
      const index = Number(req.params.index);
      const checksum = String(req.get("X-Checksum-Sha256") || "");
      if (!checksum)
        throw new KaiwaError(400, "Thiếu header X-Checksum-Sha256.");
      const data = Buffer.isBuffer(req.body) ? req.body : Buffer.from([]);
      const result = attemptChunks.putChunk(
        res.locals.user.id,
        String(req.params.id),
        index,
        data,
        checksum,
      );
      res.json(result);
    },
  );

  router.post("/attempts/:id/assemble-audio", (req, res) => {
    const asset = attemptChunks.assemble(
      res.locals.user.id,
      String(req.params.id),
    );
    res.status(201).json(asset);
  });

  router.get("/storage/usage", (_req, res) => {
    const uid = res.locals.user.id as string;
    res.json({
      usedBytes: assets.usageBytes(uid),
      quotaBytes: config.quotaBytesPerUser,
      maxUploadBytes: config.maxUploadBytes,
      mediaRoot: config.mediaRoot,
    });
  });

  router.post("/assets/reservations", (req, res) => {
    const body = z
      .object({
        kind: z.string().trim().min(1).max(40),
        bytes: z.number().int().positive(),
        ext: z.string().trim().max(8).optional(),
      })
      .parse(req.body);
    const asset = assets.reserve({
      ownerId: res.locals.user.id,
      kind: body.kind,
      bytes: body.bytes,
      ext: body.ext,
    });
    res.status(201).json(asset);
  });

  router.delete("/assets/:id", (req, res) => {
    assets.release(res.locals.user.id, String(req.params.id));
    res.json({ ok: true });
  });

  router.put(
    "/assets/:id/content",
    express.raw({
      type: () => true,
      limit: config.maxUploadBytes,
    }),
    (req, res) => {
      const data = Buffer.isBuffer(req.body) ? req.body : Buffer.from([]);
      const contentType = req.get("Content-Type") || "application/octet-stream";
      const asset = assets.commitBytes(
        res.locals.user.id,
        String(req.params.id),
        data,
        { contentType },
      );
      res.json(asset);
    },
  );

  function sendAssetContent(req: Request, res: Response) {
    const asset = assets.ownAsset(res.locals.user.id, String(req.params.id));
    if (asset.processing_status !== "ready") {
      throw new KaiwaError(409, "Media chưa sẵn sàng để phát.");
    }
    const media = JSON.parse(asset.media_json || "{}") as {
      contentType?: string;
    };
    const contentType = media.contentType || "application/octet-stream";
    const st = assets.storage.stat(asset.storage_key);
    if (!st) throw new KaiwaError(404, "Không tìm thấy tệp media.");

    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "private, no-store");

    if (req.method === "HEAD") {
      res.setHeader("Content-Length", String(st.size));
      return res.status(200).end();
    }

    const range = parseRange(req.get("Range"), st.size);
    if (range === "invalid") {
      res.setHeader("Content-Range", `bytes */${st.size}`);
      return res.status(416).json({ error: "Range không hợp lệ." });
    }
    if (range) {
      const { stream, start, end, size } = assets.storage.openRead(
        asset.storage_key,
        range,
      );
      res.status(206);
      res.setHeader("Content-Range", `bytes ${start}-${end}/${size}`);
      res.setHeader("Content-Length", String(end - start + 1));
      stream.pipe(res);
      return;
    }

    res.setHeader("Content-Length", String(st.size));
    assets.storage.openRead(asset.storage_key).stream.pipe(res);
  }

  router.head("/assets/:id/content", sendAssetContent);
  router.get("/assets/:id/content", sendAssetContent);

  router.post("/jobs", (req, res) => {
    const body = z
      .object({
        kind: z.string().trim().min(1).max(64),
        payload: z.unknown().optional(),
        payloadVersion: z.number().int().positive().optional(),
        idempotencyKey: z.string().trim().min(1).max(120).optional(),
      })
      .parse(req.body);
    const job = jobService.enqueue({
      ownerId: res.locals.user.id,
      kind: body.kind,
      payload: body.payload ?? {},
      payloadVersion: body.payloadVersion,
      idempotencyKey: body.idempotencyKey,
    });
    res.status(201).json(job);
  });

  router.get("/jobs/:id", (req, res) => {
    res.json(jobService.ownJob(res.locals.user.id, String(req.params.id)));
  });

  router.post("/jobs/:id/cancel", (req, res) => {
    res.json(jobService.cancel(res.locals.user.id, String(req.params.id)));
  });

  router.post("/uploads", (req, res) => {
    const body = z
      .object({
        purpose: z.string().trim().min(1).max(40),
        bytes: z.number().int().positive(),
        chunkSize: z.number().int().positive().optional(),
        checksum: z.string().trim().min(64).max(64).optional(),
        ext: z.string().trim().max(8).optional(),
      })
      .parse(req.body);
    const upload = uploads.createUpload({
      ownerId: res.locals.user.id,
      purpose: body.purpose,
      bytes: body.bytes,
      chunkSize: body.chunkSize,
      checksum: body.checksum,
      ext: body.ext,
    });
    res.status(201).json(upload);
  });

  router.get("/uploads/:id", (req, res) => {
    res.json(uploads.status(res.locals.user.id, String(req.params.id)));
  });

  router.put(
    "/uploads/:id/chunks/:index",
    express.raw({ type: () => true, limit: config.maxUploadBytes }),
    (req, res) => {
      const index = Number(req.params.index);
      const checksum = String(req.get("X-Checksum-Sha256") || "");
      if (!checksum) throw new KaiwaError(400, "Thiếu header X-Checksum-Sha256.");
      const data = Buffer.isBuffer(req.body) ? req.body : Buffer.from([]);
      const result = uploads.putChunk(
        res.locals.user.id,
        String(req.params.id),
        index,
        data,
        checksum,
      );
      res.json(result);
    },
  );

  router.post("/uploads/:id/complete", (req, res) => {
    const asset = uploads.complete(res.locals.user.id, String(req.params.id));
    res.json(asset);
  });

  router.delete("/uploads/:id", (req, res) => {
    uploads.cancel(res.locals.user.id, String(req.params.id));
    res.json({ ok: true });
  });

  router.post("/assets/:id/probe", async (req, res, next) => {
    try {
      const out = await probes.probeAsset(
        res.locals.user.id,
        String(req.params.id),
      );
      res.status(out.result.ok ? 200 : 422).json(out);
    } catch (e) {
      next(e);
    }
  });

  router.post("/assets/:id/prepare-playback", async (req, res, next) => {
    try {
      const out = await proxies.preparePlayback(
        res.locals.user.id,
        String(req.params.id),
      );
      res.status(201).json(out);
    } catch (e) {
      next(e);
    }
  });

  return router;
}
