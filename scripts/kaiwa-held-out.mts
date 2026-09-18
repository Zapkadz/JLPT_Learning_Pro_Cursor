/**
 * KAI-076 — npm wrapper for held-out summary (no media).
 */
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const py = process.env.KAIWA_PYTHON?.trim() || process.env.PYTHON?.trim() || "python";
const script = join(process.cwd(), "scripts", "kaiwa", "held_out_summary.py");
const r = spawnSync(py, [script, ...process.argv.slice(2)], {
  encoding: "utf8",
  stdio: "inherit",
  env: { ...process.env, PYTHONIOENCODING: "utf-8" },
});
process.exit(r.status ?? 1);
