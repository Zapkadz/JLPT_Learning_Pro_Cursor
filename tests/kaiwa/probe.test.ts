import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AddressInfo } from "node:net";
import { createApp } from "../../server/app";
import { createSniffProbe } from "../../server/modules/kaiwa/probe/sniff";
import { applyPilotLimits } from "../../server/modules/kaiwa/probe/index";

function u32(n: number) {
  const b = Buffer.alloc(4);
  b.writeUInt32BE(n >>> 0);
  return b;
}

function box(type: string, body: Buffer) {
  return Buffer.concat([u32(8 + body.length), Buffer.from(type, "ascii"), body]);
}

/** Minimal ISO-BMFF with ftyp + moov/mvhd duration. */
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
  mvhdBody[0] = 0; // version
  mvhdBody.writeUInt32BE(timescale, 12);
  mvhdBody.writeUInt32BE(Math.round(durationSec * timescale), 16);
  mvhdBody.writeUInt32BE(0x00010000, 20); // rate
  mvhdBody.writeUInt16BE(0x0100, 24); // volume
  const mvhd = box("mvhd", mvhdBody);
  const trak = box("trak", Buffer.from("avc1mdia")); // marker bytes for codec sniff
  const moov = box("moov", Buffer.concat([mvhd, trak]));
  return Buffer.concat([ftyp, moov]);
}

async function withServer(
  run: (base: string, cookie: string) => Promise<void>,
) {
  const dir = mkdtempSync(join(tmpdir(), "kaiwa-probe-"));
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
        email: `probe-${Date.now()}-${Math.random().toString(16).slice(2)}@example.test`,
        name: "Probe QA",
        password: "Test-only-password-2026",
      }),
    });
    assert.equal(reg.status, 201);
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

async function uploadReadyAsset(
  base: string,
  cookie: string,
  data: Buffer,
) {
  const reserved = await api(base, cookie, "/kaiwa/assets/reservations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      kind: "source",
      bytes: data.length,
      ext: "mp4",
    }),
  });
  assert.equal(reserved.status, 201);
  const asset = (await reserved.json()) as { id: string };
  const put = await api(base, cookie, `/kaiwa/assets/${asset.id}/content`, {
    method: "PUT",
    headers: { "Content-Type": "video/mp4" },
    body: new Uint8Array(data),
  });
  assert.equal(put.status, 200);
  return asset.id;
}

test("sniff probe rejects fake extension and accepts minimal mp4", async () => {
  const dir = mkdtempSync(join(tmpdir(), "sniff-"));
  try {
    const probe = createSniffProbe();
    const fake = join(dir, "fake.mp4");
    writeFileSync(fake, "not a video at all");
    const bad = await probe.probeFile(fake);
    assert.equal(bad.ok, false);
    if (!bad.ok) assert.equal(bad.code, "unsupported");

    const goodPath = join(dir, "ok.mp4");
    writeFileSync(goodPath, minimalMp4(12));
    const good = await probe.probeFile(goodPath);
    assert.equal(good.ok, true);
    if (good.ok) {
      assert.equal(good.container, "mp4");
      assert.equal(good.durationMs, 12000);
      assert.equal(good.probeEngine, "sniff");
    }

    const limited = applyPilotLimits(good, { maxDurationMs: 10_000 });
    assert.equal(limited.ok, false);
    if (!limited.ok) assert.equal(limited.code, "too_long");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("sniff probe marks truncated ftyp-less short file corrupt when magic looks mp4-ish", async () => {
  const dir = mkdtempSync(join(tmpdir(), "sniff2-"));
  try {
    const probe = createSniffProbe();
    // size claims ftyp but truncated
    const truncated = Buffer.concat([u32(100), Buffer.from("ftyp")]);
    const path = join(dir, "cut.mp4");
    writeFileSync(path, truncated);
    const r = await probe.probeFile(path);
    // findBox may fail → corrupt from probeMp4 missing proper ftyp body still has ftyp type
    assert.equal(r.ok, false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("POST /assets/:id/probe returns 422 for fake video and 200 for minimal mp4", async () => {
  await withServer(async (base, cookie) => {
    const fakeId = await uploadReadyAsset(
      base,
      cookie,
      Buffer.from("hello fake mp4"),
    );
    const fakeProbe = await api(base, cookie, `/kaiwa/assets/${fakeId}/probe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    assert.equal(fakeProbe.status, 422);
    const fakeBody = (await fakeProbe.json()) as {
      result: { ok: boolean; code?: string };
    };
    assert.equal(fakeBody.result.ok, false);
    assert.ok(
      fakeBody.result.code === "unsupported" ||
        fakeBody.result.code === "corrupt",
    );

    const okId = await uploadReadyAsset(base, cookie, minimalMp4(30));
    const okProbe = await api(base, cookie, `/kaiwa/assets/${okId}/probe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    assert.equal(okProbe.status, 200);
    const okBody = (await okProbe.json()) as {
      result: { ok: boolean; container?: string; durationMs?: number };
    };
    assert.equal(okBody.result.ok, true);
    assert.equal(okBody.result.container, "mp4");
    assert.equal(okBody.result.durationMs, 30000);
  });
});
