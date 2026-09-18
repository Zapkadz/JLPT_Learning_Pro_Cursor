/**
 * KAI-002 capture spike runner (Playwright + local static harness).
 * Does not upload or keep microphone blobs — metrics JSON only.
 *
 * Usage:
 *   node scripts/kaiwa/run-capture-spike.mjs
 *   node scripts/kaiwa/run-capture-spike.mjs --durationMs=60000
 *   node scripts/kaiwa/run-capture-spike.mjs --durationMs=600000
 */
import { createServer } from "node:http";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "../..");
const harnessDir = join(root, "docs/kaiwa/evidence/kai-002/harness");
const outDir = join(root, "docs/kaiwa/evidence/kai-002");

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = /^--([^=]+)=(.*)$/.exec(a);
    return m ? [m[1], m[2]] : [a.replace(/^--/, ""), true];
  }),
);
const durationMs = Number(args.durationMs || process.env.KAIWA_SPIKE_MS || 30000);
const timesliceMs = Number(args.timesliceMs || 1000);

function contentType(file) {
  if (file.endsWith(".html")) return "text/html; charset=utf-8";
  if (file.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (file.endsWith(".css")) return "text/css; charset=utf-8";
  return "application/octet-stream";
}

const server = createServer((req, res) => {
  const path = (req.url || "/").split("?")[0];
  const file = path === "/" ? "/index.html" : path;
  try {
    const body = readFileSync(join(harnessDir, file.replace(/^\//, "")));
    res.writeHead(200, { "Content-Type": contentType(file) });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end("not found");
  }
});

await new Promise((r) => server.listen(0, "127.0.0.1", r));
const { port } = server.address();
const url = `http://127.0.0.1:${port}/?autorun=1&durationMs=${durationMs}&timesliceMs=${timesliceMs}`;

const browser = await chromium.launch({
  headless: true,
  args: [
    "--use-fake-device-for-media-stream",
    "--use-fake-ui-for-media-stream",
    "--autoplay-policy=no-user-gesture-required",
  ],
});
const context = await browser.newContext();
await context.grantPermissions(["microphone", "camera"]);
const page = await context.newPage();
page.on("console", (msg) => {
  if (process.env.KAIWA_SPIKE_VERBOSE) console.log("browser:", msg.text());
});

await page.goto(url, { waitUntil: "domcontentloaded" });
await page.waitForFunction(() => window.__KAIWA_SPIKE_READY__ === true);
const report = await page.waitForFunction(
  () => window.__KAIWA_SPIKE__ || null,
  null,
  { timeout: Math.max(120_000, durationMs + 60_000) },
).then((h) => h.jsonValue());

await browser.close();
server.close();

const { chunks: _chunks, ...rest } = report;
const compact = {
  ...rest,
  chunkCount: Array.isArray(report.chunks) ? report.chunks.length : null,
  note: "Full chunk arrays omitted from git artifacts; re-run harness to regenerate.",
};
mkdirSync(outDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const outPath = join(outDir, `metrics-${durationMs}ms-${stamp}.json`);
const latestPath = join(outDir, "metrics-latest.json");
writeFileSync(outPath, JSON.stringify(compact, null, 2));
writeFileSync(latestPath, JSON.stringify(compact, null, 2));

const s = report.summary || {};
console.log(
  JSON.stringify(
    {
      outPath,
      mimeType: report.mimeType,
      durationMs,
      chunkCount: s.chunkCount,
      headDriftMs: s.headDriftMs,
      midDriftMs: s.midDriftMs,
      tailDriftMs: s.tailDriftMs,
      midPass: s.midPass,
      tailPass: s.tailPass,
      error: report.error || null,
    },
    null,
    2,
  ),
);

const fail =
  report.error ||
  s.midPass === false ||
  s.tailPass === false ||
  s.midDriftMs == null;
process.exit(fail ? 1 : 0);
