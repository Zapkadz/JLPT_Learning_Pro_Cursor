import express, { Router, type Request, type Response } from "express";
import type Database from "better-sqlite3";
import { readFileSync } from "node:fs";
import { z } from "zod";
import { createKaiwaRepository, KaiwaError } from "./repository";
import { loadKaiwaConfig, type KaiwaConfig } from "./config";
import { createAssetService } from "./assets";
import { createJobService } from "./jobs";

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
  })();

  const config = loadKaiwaConfig(configOverrides);
  const repo = createKaiwaRepository(db);
  const assets = createAssetService(db, config);
  const jobService = createJobService(db);
  const router = Router();

  router.get("/projects", (_req, res) => {
    const uid = res.locals.user.id as string;
    const rows = db
      .prepare(
        "SELECT id,title,status,version,active_revision_id,updated_at,created_at FROM kaiwa_projects WHERE owner_id=? AND deleted_at IS NULL ORDER BY updated_at DESC",
      )
      .all(uid);
    res.json({ projects: rows });
  });

  router.post("/projects", (req, res) => {
    const project = repo.createProject(res.locals.user.id, req.body);
    res.status(201).json(project);
  });

  router.get("/projects/:id", (req, res) => {
    res.json(repo.ownProject(String(req.params.id), res.locals.user.id));
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

  router.get("/attempts/:id", (req, res) => {
    res.json(repo.getAttempt(res.locals.user.id, String(req.params.id)));
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

  return router;
}
