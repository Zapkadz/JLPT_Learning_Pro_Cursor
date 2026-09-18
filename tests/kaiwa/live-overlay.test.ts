import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  activeSegmentIndex,
  currentAndNext,
} from "../../shared/kaiwa/liveOverlay";

const segs = [
  { id: "a", startMs: 0, endMs: 1000, ja: "あ" },
  { id: "b", startMs: 1200, endMs: 2000, ja: "い" },
  { id: "c", startMs: 2000, endMs: 3000, ja: "う" },
];

test("live overlay picks current and next by video clock", () => {
  assert.equal(activeSegmentIndex(segs, 100), 0);
  assert.equal(activeSegmentIndex(segs, 1100), 0); // gap keeps last started
  assert.equal(activeSegmentIndex(segs, 1500), 1);
  const mid = currentAndNext(segs, 1500);
  assert.equal(mid.current?.id, "b");
  assert.equal(mid.next?.id, "c");
  const before = currentAndNext(segs, 0);
  // first segment starts at 0 → current is a
  assert.equal(before.current?.id, "a");
  const early = currentAndNext(
    [{ id: "x", startMs: 500, endMs: 800, ja: "x" }],
    100,
  );
  assert.equal(early.current, null);
  assert.equal(early.next?.id, "x");
});

test("continuous recorder mounts on-video overlay (not list-only)", () => {
  const src = readFileSync(
    join(process.cwd(), "src/features/kaiwa/ContinuousRecorder.tsx"),
    "utf8",
  );
  assert.ok(src.includes("kaiwa-script-overlay"));
  assert.ok(src.includes("currentAndNext"));
  assert.ok(src.includes("Tiếp:"));
  assert.ok(src.includes("không dừng theo câu"));
});
