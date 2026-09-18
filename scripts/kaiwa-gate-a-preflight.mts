/**
 * Gate A automated preflight (KAI-033 / KAI-045).
 * Runs test + build; verifies segment checklist rows exist.
 * Does NOT claim device acceptance (KAI-046).
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
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
const releaseNotes = resolve(
  root,
  "docs/kaiwa/evidence/kai-033/RELEASE-NOTES.md",
);

console.log("Kaiwa Gate A preflight (automated only)");
console.log("Checklist:", checklist);
console.log("Usage:", usage);

if (!existsSync(checklist) || !existsSync(usage) || !existsSync(releaseNotes)) {
  console.error("Missing Gate A docs — abort.");
  process.exit(1);
}

const checklistBody = readFileSync(checklist, "utf8");
const required = [
  "thu theo đoạn",
  "Theo đoạn",
  "assembly",
  "Đánh dấu luyện",
  "Trạng thái từng đoạn",
  "2b. Luồng liên tục",
];
for (const needle of required) {
  if (!checklistBody.toLowerCase().includes(needle.toLowerCase())) {
    console.error(`Checklist missing required segment/continuous row: ${needle}`);
    process.exit(1);
  }
}

const usageBody = readFileSync(usage, "utf8");
if (!usageBody.includes("Theo đoạn") || !usageBody.includes("capture_mode")) {
  console.error("USAGE-GATE-A.md missing dual-mode / capture_mode honesty copy.");
  process.exit(1);
}

run("npm", ["test"]);
run("npm", ["run", "build"]);

console.log(`
Automated preflight OK (KAI-045 checklist content checks passed).

Remaining human steps (KAI-046 — do not skip):
1. Fill CHECKLIST §2 segment flow PASS on Desktop Chrome + Edge
2. §2b continuous overlay recommended; continuous-only is NOT enough for ACCEPTED
3. Attach notes/screenshots outside git (no private recordings in repo)
4. PM sign-off before claiming Gate A accepted

Scoring is NOT part of Gate A — see USAGE-GATE-A.md.
`);
