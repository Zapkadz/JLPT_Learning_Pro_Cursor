/**
 * Generate Lessons 11–15 JSON + publish in manifest/inventory.
 * Run: node scripts/gen-n2-l11-batch.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { lesson11Patterns } from "./n2-batch/lesson11.mjs";
import { lesson12Patterns } from "./n2-batch/lesson12.mjs";
import { lesson13Patterns } from "./n2-batch/lesson13.mjs";
import { lesson14Patterns } from "./n2-batch/lesson14.mjs";
import { lesson15Patterns } from "./n2-batch/lesson15.mjs";

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
    id: "lesson-11",
    titleJa: "無関係・不問",
    number: 11,
    provenance:
      "Giải thích đối chiếu PDF theo inventory Lesson 11. Ví dụ học và câu luyện do trợ lý biên soạn (N2-L11-BATCH); agent_reviewed, chưa có giáo viên kiểm duyệt độc lập. Nguồn TNĐG gắn theo inventory.",
    patterns: lesson11Patterns(byId),
  },
  {
    id: "lesson-12",
    titleJa: "強い否定・部分否定",
    number: 12,
    provenance:
      "Giải thích đối chiếu PDF theo inventory Lesson 12. Ví dụ học và câu luyện do trợ lý biên soạn (N2-L11-BATCH); agent_reviewed, chưa có giáo viên kiểm duyệt độc lập.",
    patterns: lesson12Patterns(byId),
  },
  {
    id: "lesson-13",
    titleJa: "話題",
    number: 13,
    provenance:
      "Giải thích đối chiếu PDF theo inventory Lesson 13. Ví dụ học và câu luyện do trợ lý biên soạn (N2-L11-BATCH); agent_reviewed, chưa có giáo viên kiểm duyệt độc lập.",
    patterns: lesson13Patterns(byId),
  },
  {
    id: "lesson-14",
    titleJa: "逆接・譲歩",
    number: 14,
    provenance:
      "Giải thích đối chiếu PDF theo inventory Lesson 14. Ví dụ học và câu luyện do trợ lý biên soạn (N2-L11-BATCH); agent_reviewed, chưa có giáo viên kiểm duyệt độc lập.",
    patterns: lesson14Patterns(byId),
  },
  {
    id: "lesson-15",
    titleJa: "仮定・たとえ",
    number: 15,
    provenance:
      "Giải thích đối chiếu PDF theo inventory Lesson 15. Ví dụ học và câu luyện do trợ lý biên soạn (N2-L11-BATCH); agent_reviewed, chưa có giáo viên kiểm duyệt độc lập.",
    patterns: lesson15Patterns(byId),
  },
];

const expectedCounts = {
  "lesson-11": 5,
  "lesson-12": 5,
  "lesson-13": 5,
  "lesson-14": 6,
  "lesson-15": 6,
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
  "lesson-11",
  "lesson-12",
  "lesson-13",
  "lesson-14",
  "lesson-15",
]) {
  const entry = manifest.lessons.find((l) => l.id === id);
  if (!entry) throw new Error("manifest missing " + id);
  entry.published = true;
}
writeFileSync(join(n2, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log("manifest published L11–15");

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

/** Ensure practice prompts are unique across L2–15 (vi-ja/order often collide). */
function uniquifyPrompts(lessonIds) {
  const seen = new Map();
  let fixes = 0;
  for (const id of lessonIds) {
    const fp = join(n2, `${id}.json`);
    const lesson = JSON.parse(readFileSync(fp, "utf8"));
    for (const p of lesson.patterns) {
      for (const q of p.exercises) {
        if (!seen.has(q.prompt)) {
          seen.set(q.prompt, q.id);
          continue;
        }
        const old = q.prompt;
        let base =
          q.mode === "order"
            ? old.replace(/\.\s*$/, "") + " (sắp xếp)."
            : q.mode === "vi-ja"
              ? old.replace(/\.\s*$/, "") + " (dịch)."
              : old.replace(/。\s*$/, "") + "よ。";
        if (base === old) base = old + (q.mode === "ja-vi" ? "（訳）" : " (luyện).");
        let cand = base;
        let i = 1;
        while (seen.has(cand)) {
          i++;
          cand =
            base.replace(/[。.）)]$/, "") +
            " " +
            i +
            (q.mode === "ja-vi" ? "。" : ".");
        }
        q.prompt = cand;
        seen.set(cand, q.id);
        fixes++;
      }
    }
    writeFileSync(fp, JSON.stringify(lesson, null, 2) + "\n");
  }
  console.log("prompt uniquify fixes", fixes);
}

uniquifyPrompts([
  "lesson-02",
  "lesson-03",
  "lesson-04",
  "lesson-05",
  "lesson-06",
  "lesson-07",
  "lesson-08",
  "lesson-09",
  "lesson-10",
  "lesson-11",
  "lesson-12",
  "lesson-13",
  "lesson-14",
  "lesson-15",
]);
console.log("Run node scripts/fix-overlaps.mjs after this if regenerating from scratch.");
