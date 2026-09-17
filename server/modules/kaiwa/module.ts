import { Router } from "express";
import type Database from "better-sqlite3";
import { readFileSync } from "node:fs";
import { createKaiwaRepository, KaiwaError } from "./repository";

export { KaiwaError };

export function kaiwaModule(db: Database.Database) {
  db.transaction(() => {
    db.exec(readFileSync(new URL("./migration.sql", import.meta.url), "utf8"));
    db.prepare("INSERT OR IGNORE INTO schema_migrations VALUES(?,?)").run(
      "kaiwa-001",
      new Date().toISOString(),
    );
  })();

  const repo = createKaiwaRepository(db);
  const router = Router();

  router.get("/projects", (req, res) => {
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

  return router;
}
