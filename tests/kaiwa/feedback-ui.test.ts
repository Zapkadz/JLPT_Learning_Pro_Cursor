import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

test("review UI exposes assessment without inventing overall score", () => {
  const src = readFileSync(
    join(process.cwd(), "src/features/kaiwa/Kaiwa.tsx"),
    "utf8",
  );
  assert.ok(src.includes("Phân tích phản hồi"));
  assert.ok(src.includes("/assessment"));
  assert.ok(src.includes("không có (chưa hiệu chỉnh)"));
  assert.ok(src.includes("Nghe lại đoạn"));
  assert.ok(src.includes("vẫn nghe/xuất được"));
});
