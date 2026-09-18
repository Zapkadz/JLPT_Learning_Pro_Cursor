import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

test("KAI-073 editor wires waveform lock realign undo", () => {
  const page = readFileSync(
    join(process.cwd(), "src/features/kaiwa/Kaiwa.tsx"),
    "utf8",
  );
  const wave = readFileSync(
    join(process.cwd(), "src/features/kaiwa/TimingWaveform.tsx"),
    "utf8",
  );
  assert.ok(page.includes("TimingWaveform"));
  assert.ok(page.includes("Khóa mốc"));
  assert.ok(page.includes("Căn lại đoạn đã chọn"));
  assert.ok(page.includes("Căn giữa hai khóa"));
  assert.ok(page.includes("Hoàn tác mốc"));
  assert.ok(page.includes("mergeRealignPreservingLocks"));
  assert.ok(wave.includes("kaiwa-waveform-handle"));
});
