/**
 * Generate Lessons 2–5 JSON + publish in manifest/inventory.
 * Run: node scripts/gen-n2-l02-batch.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { makePattern } from "./n2-batch/_util.mjs";
import { lesson02Patterns } from "./n2-batch/lesson02.mjs";
import { lesson03Patterns } from "./n2-batch/lesson03.mjs";
import { lesson04Patterns } from "./n2-batch/lesson04.mjs";
import { lesson05Patterns } from "./n2-batch/lesson05.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const n2 = join(root, "content/grammar/n2");

const inventory = JSON.parse(
  readFileSync(join(n2, "inventory.json"), "utf8"),
);
const byId = (id) => {
  const g = inventory.groups.find((x) => x.groupId === id);
  if (!g) throw new Error("missing inventory " + id);
  return g;
};

const lessons = [
  {
    id: "lesson-02",
    titleJa: "〜している・進行中",
    number: 2,
    provenance:
      "Giải thích đối chiếu PDF trang 25 (trang in 12). Ví dụ học và câu luyện do trợ lý biên soạn (N2-L02-BATCH); agent_reviewed, chưa có giáo viên kiểm duyệt độc lập. Nguồn TNĐG gắn theo inventory.",
    patterns: lesson02Patterns(byId, makePattern),
  },
  {
    id: "lesson-03",
    titleJa: "〜後で",
    number: 3,
    provenance:
      "Giải thích đối chiếu PDF theo inventory Lesson 3. Ví dụ học và câu luyện do trợ lý biên soạn (N2-L02-BATCH); agent_reviewed, chưa có giáo viên kiểm duyệt độc lập.",
    patterns: lesson03Patterns(byId, makePattern),
  },
  {
    id: "lesson-04",
    titleJa: "開始・終了・期間",
    number: 4,
    provenance:
      "Giải thích đối chiếu PDF theo inventory Lesson 4. Ví dụ học và câu luyện do trợ lý biên soạn (N2-L02-BATCH); agent_reviewed. l04-g05/l04-g06 partial-match TNĐG.",
    patterns: lesson04Patterns(byId, makePattern),
  },
  {
    id: "lesson-05",
    titleJa: "限定",
    number: 5,
    provenance:
      "Giải thích đối chiếu PDF theo inventory Lesson 5. Ví dụ học và câu luyện do trợ lý biên soạn (N2-L02-BATCH); agent_reviewed, chưa có giáo viên kiểm duyệt độc lập.",
    patterns: lesson05Patterns(byId, makePattern),
  },
];

const expectedCounts = { "lesson-02": 6, "lesson-03": 5, "lesson-04": 6, "lesson-05": 4 };

for (const lesson of lessons) {
  if (lesson.patterns.length !== expectedCounts[lesson.id]) {
    throw new Error(
      `${lesson.id}: expected ${expectedCounts[lesson.id]} patterns, got ${lesson.patterns.length}`,
    );
  }
  for (const p of lesson.patterns) {
    if (p.examples.length < 3) throw new Error(p.id + " needs ≥3 examples");
    if (p.exercises.length !== 30) throw new Error(p.id + " needs 30 exercises");
    for (const ex of p.examples) {
      const joined = ex.ruby.map((t) => t.text).join("");
      if (joined !== ex.ja) {
        throw new Error(`${p.id} ruby≠ja: ${joined} vs ${ex.ja}`);
      }
    }
  }
  const out = {
    id: lesson.id,
    titleJa: lesson.titleJa,
    revision: 1,
    provenance: lesson.provenance,
    patterns: lesson.patterns,
  };
  const path = join(n2, `${lesson.id}.json`);
  writeFileSync(path, JSON.stringify(out, null, 2) + "\n");
  const exCount = lesson.patterns.reduce((n, p) => n + p.exercises.length, 0);
  console.log("wrote", lesson.id, "patterns", lesson.patterns.length, "exercises", exCount);
}

const manifest = JSON.parse(readFileSync(join(n2, "manifest.json"), "utf8"));
for (const id of ["lesson-02", "lesson-03", "lesson-04", "lesson-05"]) {
  const entry = manifest.lessons.find((l) => l.id === id);
  if (!entry) throw new Error("manifest missing " + id);
  entry.published = true;
}
writeFileSync(join(n2, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log("manifest published L2–5");

const batchIds = new Set(
  lessons.flatMap((l) => l.patterns.map((p) => p.id)),
);
for (const g of inventory.groups) {
  if (batchIds.has(g.groupId)) {
    g.contentStatus = "imported";
    g.reviewStatus = "agent_reviewed";
  }
}
writeFileSync(join(n2, "inventory.json"), JSON.stringify(inventory, null, 2) + "\n");
console.log("inventory updated", batchIds.size, "groups");
console.log("Run node scripts/fix-overlaps.mjs after this if regenerating from scratch.");
