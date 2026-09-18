import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

test("segment studio UI has overlay and clip controls", () => {
  const studio = readFileSync(
    join(process.cwd(), "src/features/kaiwa/SegmentStudio.tsx"),
    "utf8",
  );
  const page = readFileSync(
    join(process.cwd(), "src/features/kaiwa/Kaiwa.tsx"),
    "utf8",
  );
  assert.ok(studio.includes("kaiwa-script-overlay"));
  assert.ok(studio.includes("Nghe mẫu đoạn"));
  assert.ok(studio.includes("Thu đoạn này"));
  assert.ok(studio.includes("Nghe giọng mình"));
  assert.ok(studio.includes("Bỏ qua"));
  assert.ok(page.includes("Theo đoạn — dễ nói theo lời (khuyến nghị)"));
  assert.ok(page.includes("Liên tục — thu cả video một lần (nâng cao)"));
  assert.ok(page.includes("kaiwa-capture-mode:"));
  assert.ok(page.includes("loadCaptureModePref"));
  assert.ok(page.includes("saveCaptureModePref"));
  assert.ok(page.includes("SegmentStudio"));
});
