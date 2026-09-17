import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

test("mic preflight module never references external provider endpoints", () => {
  const src = readFileSync(
    join(process.cwd(), "src/features/kaiwa/micPreflight.ts"),
    "utf8",
  );
  assert.ok(src.includes("createMeter"));
  assert.ok(src.includes("NOT connected to ctx.destination"));
  assert.ok(!/fetch\s*\(/.test(src));
  assert.ok(!/openai|azure|speechmatics|googleapis/i.test(src));
});

test("MicPreflightPanel stops stream on unmount path present", () => {
  const src = readFileSync(
    join(process.cwd(), "src/features/kaiwa/MicPreflightPanel.tsx"),
    "utf8",
  );
  assert.ok(src.includes("stopStream"));
  assert.ok(src.includes("không gửi tới nhà cung cấp ngoài"));
  assert.ok(src.includes("denied") && src.includes("no_device"));
});
