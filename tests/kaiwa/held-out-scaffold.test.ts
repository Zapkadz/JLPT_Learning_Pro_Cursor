import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

test("KAI-076 held-out scaffold exists and summary script exits 0 without dir", () => {
  const root = process.cwd();
  assert.ok(existsSync(join(root, "docs/kaiwa/evidence/kai-076/RUNBOOK.md")));
  assert.ok(
    existsSync(join(root, "docs/kaiwa/evidence/kai-076/RESULTS.template.json")),
  );
  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  assert.ok(pkg.scripts["kaiwa:held-out"]);
  const py = process.env.KAIWA_PYTHON?.trim() || "python";
  const r = spawnSync(
    py,
    [join(root, "scripts/kaiwa/held_out_summary.py")],
    {
      encoding: "utf8",
      env: {
        ...process.env,
        KAIWA_HELD_OUT_DIR: "",
        PYTHONIOENCODING: "utf-8",
      },
    },
  );
  assert.equal(r.status, 0, r.stderr || r.stdout);
  assert.match(r.stdout || "", /Template/);
});
