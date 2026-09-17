import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
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
    Buffer.concat([Buffer.from("isom"), u32(0), Buffer.from("isom"), Buffer.from("mp41")]),
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

async function withServer(run: (base: string, cookie: string, mediaRoot: string) => Promise<void>) {
  const dir = mkdtempSync(join(tmpdir(), "kaiwa-proxy-"));
  process.env.KAIWA_FORCE_SNIFF = "1";
  const { app, db } = createApp(join(dir, "t.sqlite"));
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((r) => server.once("listening", r));
  try {
    const { port } = server.address() as AddressInfo;
    const base = `http://127.0.0.1:${port}/api`;
    const reg = await fetch(base + "/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "http://127.0.0.1:5173" },
      body: JSON.stringify({
        email: `proxy-${Date.now()}@example.test`,
        name: "Proxy QA",
        password: "Test-only-password-2026",
      }),
    });
    const cookie = reg.headers.getSetCookie?.()[0]?.split(";")[0] || "";
    await run(base, cookie, join(dir, "kaiwa-media"));
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

test("prepare-playback rejects unprobed/fake source and keeps source immutable", async () => {
  await withServer(async (base, cookie, mediaRoot) => {
    const data = minimalMp4(5);
    const reserved = await api(base, cookie, "/kaiwa/assets/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "source", bytes: data.length, ext: "mp4" }),
    });
    const asset = (await reserved.json()) as { id: string; storage_key: string };
    await api(base, cookie, `/kaiwa/assets/${asset.id}/content`, {
      method: "PUT",
      headers: { "Content-Type": "video/mp4" },
      body: new Uint8Array(data),
    });

    const before = readFileSync(join(mediaRoot, asset.storage_key));
    const beforeHash = createHash("sha256").update(before).digest("hex");

    const prepared = await api(
      base,
      cookie,
      `/kaiwa/assets/${asset.id}/prepare-playback`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" },
    );
    assert.equal(prepared.status, 201);
    const body = (await prepared.json()) as {
      proxyAssetId: string;
      timeline: { durationScale: number; sourceAssetId: string };
      engine: string;
    };
    assert.equal(body.timeline.sourceAssetId, asset.id);
    assert.equal(body.timeline.durationScale, 1);
    assert.ok(body.proxyAssetId !== asset.id);

    const after = readFileSync(join(mediaRoot, asset.storage_key));
    assert.equal(createHash("sha256").update(after).digest("hex"), beforeHash);

    const fakeReserved = await api(base, cookie, "/kaiwa/assets/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "source", bytes: 4, ext: "mp4" }),
    });
    const fake = (await fakeReserved.json()) as { id: string };
    await api(base, cookie, `/kaiwa/assets/${fake.id}/content`, {
      method: "PUT",
      headers: { "Content-Type": "video/mp4" },
      body: new Uint8Array(Buffer.from("nope")),
    });
    const bad = await api(base, cookie, `/kaiwa/assets/${fake.id}/prepare-playback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    assert.equal(bad.status, 422);
  });
});
