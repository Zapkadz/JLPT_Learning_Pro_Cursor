import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import type { AddressInfo } from "node:net";
import { createApp } from "../../server/app";
import { createResilientProbe, applyPilotLimits } from "../../server/modules/kaiwa/probe";
import { buildFixtureSet } from "./fixtures/generate";

const MAX_DURATION_MS = 10 * 60 * 1000;

test("fixture set covers short/long/vertical/silent/weird/corrupt without private media", () => {
  const set = buildFixtureSet();
  const kinds = new Set(set.map((f) => f.kind));
  for (const k of [
    "short",
    "long",
    "vertical",
    "silent",
    "weird",
    "corrupt",
    "too_long",
  ] as const) {
    assert.ok(kinds.has(k), `missing fixture kind ${k}`);
  }
  // No fixture is a multi-MB real recording
  for (const f of set) {
    assert.ok(f.bytes.length < 64 * 1024, `${f.id} too large for synthetic suite`);
  }
});

test("sniff + pilot limits behave per fixture expectations", async () => {
  const dir = mkdtempSync(join(tmpdir(), "kaiwa-fx-"));
  const probe = createResilientProbe();
  try {
    for (const fx of buildFixtureSet()) {
      const path = join(dir, `${fx.id}.mp4`);
      writeFileSync(path, fx.bytes);
      let result = await probe.probeFile(path);
      if (fx.expectProbeOk) {
        assert.equal(result.ok, true, fx.id);
        result = applyPilotLimits(result, {
          maxDurationMs: MAX_DURATION_MS,
          requireVideo: fx.kind !== "weird",
        });
        if (fx.expectPilotReject) {
          assert.equal(result.ok, false, `${fx.id} should fail pilot`);
        } else if (fx.kind === "silent") {
          assert.equal(result.ok, true);
          if (result.ok) assert.equal(result.hasAudio, false);
        } else if (fx.kind === "vertical") {
          assert.equal(fx.intended?.height, 1920);
        }
      } else {
        assert.equal(result.ok, false, fx.id);
      }
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

async function withServer(
  run: (base: string, cookie: string) => Promise<void>,
) {
  const dir = mkdtempSync(join(tmpdir(), "kaiwa-slice-"));
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
        email: `slice-${Date.now()}@example.test`,
        name: "Slice QA",
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

function sha256(buf: Buffer) {
  return createHash("sha256").update(buf).digest("hex");
}

test("vertical slice: upload resume mid-way → prepare → Range playback", async () => {
  await withServer(async (base, cookie) => {
    const short = buildFixtureSet().find((f) => f.id === "short-ok")!;
    const payload = short.bytes;
    const chunkSize = Math.ceil(payload.length / 3);
    const created = await api(base, cookie, "/kaiwa/uploads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        purpose: "source",
        bytes: payload.length,
        chunkSize,
        checksum: sha256(payload),
        ext: "mp4",
      }),
    });
    assert.equal(created.status, 201);
    const upload = (await created.json()) as {
      id: string;
      chunk_count: number;
      asset_id: string;
    };

    // Upload only first chunk, then "restart" by reading status and finishing.
    const c0 = payload.subarray(0, chunkSize);
    const put0 = await api(base, cookie, `/kaiwa/uploads/${upload.id}/chunks/0`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/octet-stream",
        "X-Checksum-Sha256": sha256(c0),
      },
      body: new Uint8Array(c0),
    });
    assert.equal(put0.status, 200);

    const mid = await api(base, cookie, `/kaiwa/uploads/${upload.id}`);
    const midBody = (await mid.json()) as { receivedIndexes: number[] };
    assert.deepEqual(midBody.receivedIndexes, [0]);

    for (let i = 1; i < upload.chunk_count; i++) {
      const start = i * chunkSize;
      const part = payload.subarray(start, start + chunkSize);
      const put = await api(
        base,
        cookie,
        `/kaiwa/uploads/${upload.id}/chunks/${i}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/octet-stream",
            "X-Checksum-Sha256": sha256(part),
          },
          body: new Uint8Array(part),
        },
      );
      assert.equal(put.status, 200);
    }

    const done = await api(base, cookie, `/kaiwa/uploads/${upload.id}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    assert.equal(done.status, 200);

    const projectRes = await api(base, cookie, "/kaiwa/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Slice short",
        sourceAssetId: upload.asset_id,
      }),
    });
    const project = (await projectRes.json()) as { id: string };
    const prep = await api(
      base,
      cookie,
      `/kaiwa/projects/${project.id}/prepare-media`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" },
    );
    assert.equal(prep.status, 201);
    const prepared = (await prep.json()) as { proxyAssetId: string };

    const play = await api(
      base,
      cookie,
      `/kaiwa/assets/${prepared.proxyAssetId}/content`,
      { headers: { Range: "bytes=0-7" } },
    );
    assert.equal(play.status, 206);
    assert.equal((await play.arrayBuffer()).byteLength, 8);
  });
});

test("corrupt fixture is rejected at prepare-media (no fake ready playback)", async () => {
  await withServer(async (base, cookie) => {
    const corrupt = buildFixtureSet().find((f) => f.kind === "corrupt")!;
    const reserved = await api(base, cookie, "/kaiwa/assets/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "source",
        bytes: corrupt.bytes.length,
        ext: "mp4",
      }),
    });
    const asset = (await reserved.json()) as { id: string };
    await api(base, cookie, `/kaiwa/assets/${asset.id}/content`, {
      method: "PUT",
      headers: { "Content-Type": "video/mp4" },
      body: new Uint8Array(corrupt.bytes),
    });
    const projectRes = await api(base, cookie, "/kaiwa/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Bad", sourceAssetId: asset.id }),
    });
    const project = (await projectRes.json()) as { id: string };
    const prep = await api(
      base,
      cookie,
      `/kaiwa/projects/${project.id}/prepare-media`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" },
    );
    assert.equal(prep.status, 422);
    const again = await api(base, cookie, `/kaiwa/projects/${project.id}`);
    const row = (await again.json()) as { status: string; proxy_asset_id: string | null };
    assert.equal(row.status, "failed");
    assert.equal(row.proxy_asset_id, null);
  });
});
