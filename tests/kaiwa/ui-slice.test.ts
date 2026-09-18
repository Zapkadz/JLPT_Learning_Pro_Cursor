import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AddressInfo } from "node:net";
import { createApp } from "../../server/app";

function u32(n: number) {
  const b = Buffer.alloc(4);
  b.writeUInt32BE(n >>> 0);
  return b;
}
function box(type: string, body: Buffer) {
  return Buffer.concat([u32(8 + body.length), Buffer.from(type, "ascii"), body]);
}
function minimalMp4(durationSec: number, timescale = 1000) {
  const ftyp = box(
    "ftyp",
    Buffer.concat([
      Buffer.from("isom"),
      u32(0),
      Buffer.from("isom"),
      Buffer.from("mp41"),
    ]),
  );
  const mvhdBody = Buffer.alloc(100);
  mvhdBody.writeUInt32BE(timescale, 12);
  mvhdBody.writeUInt32BE(Math.round(durationSec * timescale), 16);
  mvhdBody.writeUInt32BE(0x00010000, 20);
  mvhdBody.writeUInt16BE(0x0100, 24);
  const mvhd = box("mvhd", mvhdBody);
  const trak = box("trak", Buffer.from("avc1mdia"));
  const moov = box("moov", Buffer.concat([mvhd, trak]));
  return Buffer.concat([ftyp, moov]);
}

async function withServer(
  run: (base: string, cookie: string) => Promise<void>,
) {
  const dir = mkdtempSync(join(tmpdir(), "kaiwa-ui-"));
  process.env.KAIWA_FORCE_SNIFF = "1";
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
        email: `ui-${Date.now()}@example.test`,
        name: "UI QA",
        password: "Test-only-password-2026",
      }),
    });
    const cookie = reg.headers.getSetCookie?.()[0]?.split(";")[0] || "";
    await run(base, cookie);
  } finally {
    delete process.env.KAIWA_FORCE_SNIFF;
    await new Promise<void>((r) => server.close(() => r()));
    db.close();
    rmSync(dir, { recursive: true, force: true });
  }
}

function api(base: string, cookie: string, path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Origin", "http://127.0.0.1:5173");
  headers.set("Cookie", cookie);
  return fetch(base + path, { ...init, headers });
}

test("prepare-media binds proxy and Range playback stays owner-only", async () => {
  await withServer(async (base, cookie) => {
    const data = minimalMp4(4);
    const reserved = await api(base, cookie, "/kaiwa/assets/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "source", bytes: data.length, ext: "mp4" }),
    });
    const asset = (await reserved.json()) as { id: string };
    await api(base, cookie, `/kaiwa/assets/${asset.id}/content`, {
      method: "PUT",
      headers: { "Content-Type": "video/mp4" },
      body: new Uint8Array(data),
    });

    const created = await api(base, cookie, "/kaiwa/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Demo clip", sourceAssetId: asset.id }),
    });
    assert.equal(created.status, 201);
    const project = (await created.json()) as {
      id: string;
      status: string;
      source_asset_id: string;
    };
    assert.equal(project.source_asset_id, asset.id);

    const prep = await api(
      base,
      cookie,
      `/kaiwa/projects/${project.id}/prepare-media`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" },
    );
    assert.equal(prep.status, 201);
    const body = (await prep.json()) as {
      proxyAssetId: string;
      project: { status: string; proxy_asset_id: string };
    };
    assert.equal(body.project.status, "ready");
    assert.ok(body.proxyAssetId);

    const reuse = await api(
      base,
      cookie,
      `/kaiwa/projects/${project.id}/prepare-media`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" },
    );
    assert.equal(reuse.status, 200);
    const reused = (await reuse.json()) as { reused: boolean; proxyAssetId: string };
    assert.equal(reused.reused, true);
    assert.equal(reused.proxyAssetId, body.proxyAssetId);

    const ranged = await api(
      base,
      cookie,
      `/kaiwa/assets/${body.proxyAssetId}/content`,
      { headers: { Range: "bytes=0-3" } },
    );
    assert.equal(ranged.status, 206);
    assert.equal((await ranged.arrayBuffer()).byteLength, 4);

    const anon = await fetch(
      base + `/kaiwa/assets/${body.proxyAssetId}/content`,
      { headers: { Origin: "http://127.0.0.1:5173" } },
    );
    assert.ok(anon.status === 401 || anon.status === 403);
  });
});
