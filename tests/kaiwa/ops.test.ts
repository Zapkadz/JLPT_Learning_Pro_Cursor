import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AddressInfo } from "node:net";
import { createApp } from "../../server/app";
import {
  backupKaiwaMedia,
  verifyKaiwaMediaBackup,
  redactForLog,
} from "../../server/modules/kaiwa/ops";

function sha(buf: Buffer) {
  return createHash("sha256").update(buf).digest("hex");
}

test("redactForLog strips tokens and binary", () => {
  const out = redactForLog({
    token: "secret",
    ok: "hi",
    audio: Buffer.from("abc"),
    nested: { authorization: "Bearer x", n: 1 },
  }) as Record<string, unknown>;
  assert.equal(out.token, "[redacted]");
  assert.equal(out.ok, "hi");
  assert.equal(out.audio, "[binary 3 bytes]");
  assert.deepEqual(out.nested, { authorization: "[redacted]", n: 1 });
});

test("media backup + verify round-trip", () => {
  const root = mkdtempSync(join(tmpdir(), "kaiwa-mb-"));
  try {
    const media = join(root, "media");
    mkdirSync(join(media, "a"), { recursive: true });
    writeFileSync(join(media, "a", "f.bin"), Buffer.from("hello-kaiwa"));
    const dest = join(root, "backup.media");
    const manifest = backupKaiwaMedia({
      mediaRoot: media,
      destinationDir: dest,
      dbPath: join(root, "db.sqlite"),
    });
    assert.equal(manifest.fileCount, 1);
    const check = verifyKaiwaMediaBackup(dest);
    assert.equal(check.ok, true);
    assert.equal(check.checked, 1);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

async function withServer(
  run: (base: string, cookie: string, mediaRoot: string) => Promise<void>,
) {
  const dir = mkdtempSync(join(tmpdir(), "kaiwa-ops-"));
  const mediaRoot = join(dir, "media");
  mkdirSync(mediaRoot, { recursive: true });
  process.env.KAIWA_MEDIA_ROOT = mediaRoot;
  const { app, db } = createApp(join(dir, "t.sqlite"));
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((r) => server.once("listening", r));
  try {
    const { port } = server.address() as AddressInfo;
    const base = `http://127.0.0.1:${port}/api`;
    const reg = await fetch(base + "/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "http://127.0.0.1:5173",
      },
      body: JSON.stringify({
        email: `ops-${Date.now()}@example.test`,
        name: "Ops QA",
        password: "Test-only-password-2026",
      }),
    });
    const cookie = reg.headers.getSetCookie?.()[0]?.split(";")[0] || "";
    await run(base, cookie, mediaRoot);
  } finally {
    await new Promise<void>((r) => server.close(() => r()));
    db.close();
    delete process.env.KAIWA_MEDIA_ROOT;
    rmSync(dir, { recursive: true, force: true });
  }
}

function api(base: string, cookie: string, path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Origin", "http://127.0.0.1:5173");
  headers.set("Cookie", cookie);
  if (
    init.body &&
    !headers.has("Content-Type") &&
    !(init.body instanceof Uint8Array)
  )
    headers.set("Content-Type", "application/json");
  return fetch(base + path, { ...init, headers });
}

test("soft-delete project cancels jobs, GCs assets, disappears from list", async () => {
  await withServer(async (base, cookie, mediaRoot) => {
    const created = await api(base, cookie, "/kaiwa/projects", {
      method: "POST",
      body: JSON.stringify({ title: "To delete" }),
    });
    const project = (await created.json()) as { id: string };

    // Reserve + commit a small asset bound as source
    const reserved = await api(base, cookie, "/kaiwa/assets/reservations", {
      method: "POST",
      body: JSON.stringify({ kind: "source", bytes: 64, ext: "bin" }),
    });
    const asset = (await reserved.json()) as { id: string; storage_key: string };
    const body = Buffer.alloc(32, 7);
    await api(base, cookie, `/kaiwa/assets/${asset.id}/content`, {
      method: "PUT",
      headers: { "Content-Type": "application/octet-stream" },
      body: new Uint8Array(body),
    });
    await api(base, cookie, `/kaiwa/projects/${project.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        expectedVersion: 0,
        sourceAssetId: asset.id,
      }),
    });

    const job = await api(base, cookie, "/kaiwa/jobs", {
      method: "POST",
      body: JSON.stringify({
        kind: "probe",
        payload: { projectId: project.id },
        idempotencyKey: `probe-${project.id}`,
      }),
    });
    assert.equal(job.status, 201);
    const jobBody = (await job.json()) as { id: string; state: string };
    assert.equal(jobBody.state, "queued");

    const snap = await api(base, cookie, "/kaiwa/ops/snapshot");
    assert.equal(snap.status, 200);

    const del = await api(base, cookie, `/kaiwa/projects/${project.id}`, {
      method: "DELETE",
    });
    assert.equal(del.status, 200);
    const delBody = (await del.json()) as {
      cancelledJobs: string[];
      gc: { removed: number };
    };
    assert.ok(delBody.cancelledJobs.includes(jobBody.id));

    const listed = await api(base, cookie, "/kaiwa/projects");
    const projects = (await listed.json()) as { projects: { id: string }[] };
    assert.ok(!projects.projects.some((p) => p.id === project.id));

    const gone = await api(base, cookie, `/kaiwa/projects/${project.id}`);
    assert.equal(gone.status, 404);

    const jobAfter = await api(base, cookie, `/kaiwa/jobs/${jobBody.id}`);
    const ja = (await jobAfter.json()) as { state: string };
    assert.equal(ja.state, "cancelled");

    // File should be removed after GC (tombstone not referenced by live project)
    assert.equal(existsSync(join(mediaRoot, asset.storage_key)), false);
    void sha;
  });
});
