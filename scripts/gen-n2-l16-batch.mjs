/**
 * Generate Lessons 16–20 JSON + publish in manifest/inventory.
 * Run: node scripts/gen-n2-l16-batch.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { lesson16Patterns } from "./n2-batch/lesson16.mjs";
import { lesson17Patterns } from "./n2-batch/lesson17.mjs";
import { lesson18Patterns } from "./n2-batch/lesson18.mjs";
import { lesson19Patterns } from "./n2-batch/lesson19.mjs";
import { lesson20Patterns } from "./n2-batch/lesson20.mjs";

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
    id: "lesson-16",
    titleJa: "理由（1）",
    number: 16,
    provenance:
      "Giải thích đối chiếu PDF theo inventory Lesson 16. Ví dụ học và câu luyện do trợ lý biên soạn (N2-L16-BATCH); agent_reviewed, chưa có giáo viên kiểm duyệt độc lập. Nguồn TNĐG gắn theo inventory.",
    patterns: lesson16Patterns(byId),
  },
  {
    id: "lesson-17",
    titleJa: "理由（2）",
    number: 17,
    provenance:
      "Giải thích đối chiếu PDF theo inventory Lesson 17. Ví dụ học và câu luyện do trợ lý biên soạn (N2-L16-BATCH); agent_reviewed, chưa có giáo viên kiểm duyệt độc lập.",
    patterns: lesson17Patterns(byId),
  },
  {
    id: "lesson-18",
    titleJa: "不可能・困難・可能",
    number: 18,
    provenance:
      "Giải thích đối chiếu PDF theo inventory Lesson 18. Ví dụ học và câu luyện do trợ lý biên soạn (N2-L16-BATCH); agent_reviewed, chưa có giáo viên kiểm duyệt độc lập.",
    patterns: lesson18Patterns(byId),
  },
  {
    id: "lesson-19",
    titleJa: "評価・観点",
    number: 19,
    provenance:
      "Giải thích đối chiếu PDF theo inventory Lesson 19. Ví dụ học và câu luyện do trợ lý biên soạn (N2-L16-BATCH); agent_reviewed, chưa có giáo viên kiểm duyệt độc lập.",
    patterns: lesson19Patterns(byId),
  },
  {
    id: "lesson-20",
    titleJa: "結果",
    number: 20,
    provenance:
      "Giải thích đối chiếu PDF theo inventory Lesson 20. Ví dụ học và câu luyện do trợ lý biên soạn (N2-L16-BATCH); agent_reviewed, chưa có giáo viên kiểm duyệt độc lập.",
    patterns: lesson20Patterns(byId),
  },
];

const expectedCounts = {
  "lesson-16": 5,
  "lesson-17": 5,
  "lesson-18": 6,
  "lesson-19": 6,
  "lesson-20": 6,
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
  "lesson-16",
  "lesson-17",
  "lesson-18",
  "lesson-19",
  "lesson-20",
]) {
  const entry = manifest.lessons.find((l) => l.id === id);
  if (!entry) throw new Error("manifest missing " + id);
  entry.published = true;
}
writeFileSync(join(n2, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log("manifest published L16–20");

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

/** Ensure practice prompts unique across L2–20. */
function uniquifyPrompts(lessonIds) {
  const seen = new Map();
  let fixes = 0;
  for (const id of lessonIds) {
    const fp = join(n2, `${id}.json`);
    const lesson = JSON.parse(readFileSync(fp, "utf8"));
    let changed = false;
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
        changed = true;
      }
    }
    if (changed) writeFileSync(fp, JSON.stringify(lesson, null, 2) + "\n");
  }
  console.log("prompt uniquify fixes", fixes);
}

const allPublished = [];
for (let n = 2; n <= 20; n++) {
  allPublished.push("lesson-" + String(n).padStart(2, "0"));
}
uniquifyPrompts(allPublished);
console.log("Run node scripts/fix-overlaps.mjs after this if regenerating from scratch.");
