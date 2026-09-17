/**
 * Gate A automated preflight (KAI-033).
 * Runs test + build; does NOT claim device acceptance.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

function run(cmd: string, args: string[]) {
  console.log(`\n> ${cmd} ${args.join(" ")}`);
  const r = spawnSync(cmd, args, {
    stdio: "inherit",
    shell: true,
    env: process.env,
  });
  if (r.status !== 0) {
    process.exit(r.status ?? 1);
  }
}

const root = resolve(process.cwd());
const checklist = resolve(root, "docs/kaiwa/evidence/kai-033/CHECKLIST.md");
const usage = resolve(root, "docs/kaiwa/USAGE-GATE-A.md");

console.log("Kaiwa Gate A preflight (automated only)");
console.log("Checklist:", checklist);
console.log("Usage:", usage);

if (!existsSync(checklist) || !existsSync(usage)) {
  console.error("Missing Gate A docs — abort.");
  process.exit(1);
}

run("npm", ["test"]);
run("npm", ["run", "build"]);

console.log(`
Automated preflight OK.

Remaining human steps (do not skip):
1. Fill docs/kaiwa/evidence/kai-033/CHECKLIST.md on Desktop Chrome + Edge
2. Attach notes/screenshots outside git (no private recordings in repo)
3. PM sign-off before claiming Gate A accepted

Scoring is NOT part of Gate A — see USAGE-GATE-A.md.
`);
