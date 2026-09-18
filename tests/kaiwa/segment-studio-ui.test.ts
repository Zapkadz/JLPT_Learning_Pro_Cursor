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
  assert.ok(page.includes("Theo đoạn (khuyến nghị)"));
  assert.ok(page.includes("captureMode: \"segment\""));
  assert.ok(page.includes("SegmentStudio"));
});
