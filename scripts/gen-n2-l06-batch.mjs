/**
 * Generate Lessons 6–10 JSON + publish in manifest/inventory.
 * Run: node scripts/gen-n2-l06-batch.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { lesson06Patterns } from "./n2-batch/lesson06.mjs";
import { lesson07Patterns } from "./n2-batch/lesson07.mjs";
import { lesson08Patterns } from "./n2-batch/lesson08.mjs";
import { lesson09Patterns } from "./n2-batch/lesson09.mjs";
import { lesson10Patterns } from "./n2-batch/lesson10.mjs";

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
    id: "lesson-06",
    titleJa: "追加・添加",
    number: 6,
    provenance:
      "Giải thích đối chiếu PDF theo inventory Lesson 6. Ví dụ học và câu luyện do trợ lý biên soạn (N2-L06-BATCH); agent_reviewed, chưa có giáo viên kiểm duyệt độc lập. Nguồn TNĐG gắn theo inventory.",
    patterns: lesson06Patterns(byId),
  },
  {
    id: "lesson-07",
    titleJa: "関連・対象",
    number: 7,
    provenance:
      "Giải thích đối chiếu PDF theo inventory Lesson 7. Ví dụ học và câu luyện do trợ lý biên soạn (N2-L06-BATCH); agent_reviewed, chưa có giáo viên kiểm duyệt độc lập.",
    patterns: lesson07Patterns(byId),
  },
  {
    id: "lesson-08",
    titleJa: "根拠・基準",
    number: 8,
    provenance:
      "Giải thích đối chiếu PDF theo inventory Lesson 8. Ví dụ học và câu luyện do trợ lý biên soạn (N2-L06-BATCH); agent_reviewed, chưa có giáo viên kiểm duyệt độc lập.",
    patterns: lesson08Patterns(byId),
  },
  {
    id: "lesson-09",
    titleJa: "対応・比例",
    number: 9,
    provenance:
      "Giải thích đối chiếu PDF theo inventory Lesson 9. Ví dụ học và câu luyện do trợ lý biên soạn (N2-L06-BATCH); agent_reviewed, chưa có giáo viên kiểm duyệt độc lập.",
    patterns: lesson09Patterns(byId),
  },
  {
    id: "lesson-10",
    titleJa: "列挙・例示",
    number: 10,
    provenance:
      "Giải thích đối chiếu PDF theo inventory Lesson 10. Ví dụ học và câu luyện do trợ lý biên soạn (N2-L06-BATCH); agent_reviewed, chưa có giáo viên kiểm duyệt độc lập.",
    patterns: lesson10Patterns(byId),
  },
];

const expectedCounts = {
  "lesson-06": 5,
  "lesson-07": 5,
  "lesson-08": 5,
  "lesson-09": 5,
  "lesson-10": 4,
};

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
    for (const q of p.exercises) {
      if (q.mode === "order") {
        for (const t of q.tokens) {
          if (!t.text || !String(t.text).trim()) {
            throw new Error(`${p.id} ${q.id}: empty order token`);
          }
        }
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
for (const id of [
  "lesson-06",
  "lesson-07",
  "lesson-08",
  "lesson-09",
  "lesson-10",
]) {
  const entry = manifest.lessons.find((l) => l.id === id);
  if (!entry) throw new Error("manifest missing " + id);
  entry.published = true;
}
writeFileSync(join(n2, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log("manifest published L6–10");

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
