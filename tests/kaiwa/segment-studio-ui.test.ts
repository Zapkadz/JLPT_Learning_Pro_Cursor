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
  assert.ok(studio.includes("ScriptHelpLayers"));
  assert.ok(studio.includes("Nghe mẫu đoạn"));
  assert.ok(studio.includes("Thu đoạn này"));
  assert.ok(studio.includes("Nghe giọng mình"));
  assert.ok(studio.includes("Bỏ qua"));
  assert.ok(studio.includes("Còn thiếu"));
  assert.ok(studio.includes("Đánh dấu luyện"));
  assert.ok(studio.includes("kaiwa-subset:"));
  assert.ok(studio.includes("resumedRef"));
  assert.ok(studio.includes("setCountdown(3)"));
  assert.ok(studio.includes("muteVideoForTake"));
  assert.ok(studio.includes("video đã tắt tiếng mẫu"));
  assert.ok(studio.includes("kaiwa-seg-countdown"));
  assert.ok(studio.includes("isSpeakableSegment"));
  assert.ok(studio.includes("chưa khớp"));
  assert.ok(studio.includes("cửa sổ thu"));
  assert.ok(page.includes("Nghe ± ngữ cảnh"));
  assert.ok(page.includes("timingFilter"));
  assert.ok(page.includes("summarizeAlignResultVi"));
  assert.ok(page.includes("Theo đoạn — dễ nói theo lời (khuyến nghị)"));
  assert.ok(page.includes("kaiwa-capture-mode:"));
  assert.ok(page.includes("loadCaptureModePref"));
  assert.ok(page.includes("saveCaptureModePref"));
  assert.ok(page.includes("SegmentStudio"));
});
