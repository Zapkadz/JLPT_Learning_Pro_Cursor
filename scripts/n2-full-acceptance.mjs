/**
 * N2-FULL-ACC automated evidence (Master Requirement §73 content/scale checks).
 * Run: node scripts/n2-full-acceptance.mjs
 * Exit 0 only if all hard checks pass. Does NOT claim teacher independent review.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const n2 = join(root, "content/grammar/n2");

const failures = [];
const warnings = [];
const ok = (cond, msg) => {
  if (!cond) failures.push(msg);
};
const warn = (cond, msg) => {
  if (!cond) warnings.push(msg);
};

const manifest = JSON.parse(readFileSync(join(n2, "manifest.json"), "utf8"));
const inventory = JSON.parse(readFileSync(join(n2, "inventory.json"), "utf8"));

ok(manifest.lessons.length === 26, `manifest lessons ${manifest.lessons.length} ≠ 26`);
ok(
  manifest.lessons.every((l) => l.published === true),
  "not all manifest lessons published",
);
ok(manifest.targetGroups === 141, `targetGroups ${manifest.targetGroups}`);
ok(manifest.targetExercises === 4230, `targetExercises ${manifest.targetExercises}`);

ok(inventory.targetGroups === 141, `inventory targetGroups ${inventory.targetGroups}`);
ok(inventory.groups.length === 141, `inventory groups ${inventory.groups.length}`);
ok(
  new Set(inventory.groups.map((g) => g.groupId)).size === 141,
  "inventory group IDs not unique",
);

let patternCount = 0;
let exerciseCount = 0;
const allPrompts = new Set();
const allIds = new Set();
let duplicatePrompts = 0;
let duplicateIds = 0;
const placeholderRe =
  /TODO|FIXME|placeholder|lorem ipsum|xxx+|\[fill\]|TBD/i;
const adRe = /https?:\/\/|www\.|click here|mua ngay|đăng ký ngay/i;
const scriptRe = /<script|javascript:/i;

for (const entry of manifest.lessons) {
  const lesson = JSON.parse(
    readFileSync(join(n2, `${entry.id}.json`), "utf8"),
  );
  ok(lesson.id === entry.id, `${entry.id} json id mismatch`);
  ok(
    lesson.patterns.length === entry.groupCount,
    `${entry.id} patterns ${lesson.patterns.length} ≠ groupCount ${entry.groupCount}`,
  );
  patternCount += lesson.patterns.length;

  for (const p of lesson.patterns) {
    const inv = inventory.groups.find((g) => g.groupId === p.id);
    ok(!!inv, `missing inventory for ${p.id}`);
    if (inv) {
      ok(inv.lessonId === entry.id, `${p.id} inventory lesson mismatch`);
      ok(inv.contentStatus === "imported", `${p.id} not imported`);
      ok(
        inv.reviewStatus === "agent_reviewed",
        `${p.id} reviewStatus ${inv.reviewStatus}`,
      );
    }

    ok(p.examples?.length >= 3, `${p.id} needs ≥3 examples`);
    ok(Array.isArray(p.variants) && p.variants.length >= 1, `${p.id} variants`);
    ok(p.source?.urls?.length >= 1, `${p.id} source.urls`);
    ok(!!p.meaning && p.meaning.length > 3, `${p.id} meaning`);
    ok(!!p.explanation && p.explanation.length > 10, `${p.id} explanation`);
    ok(Array.isArray(p.structures) && p.structures.length >= 1, `${p.id} structures`);
    ok(Array.isArray(p.cautions) && p.cautions.length >= 1, `${p.id} cautions`);

    for (const ex of p.examples || []) {
      ok(!!ex.ja && !!ex.vi, `${p.id} example missing ja/vi`);
      ok(
        Array.isArray(ex.ruby) &&
          ex.ruby.map((t) => t.text).join("") === ex.ja,
        `${p.id} example ruby≠ja`,
      );
      ok(!placeholderRe.test(ex.ja + ex.vi), `${p.id} example placeholder-like`);
      ok(!scriptRe.test(ex.ja + ex.vi), `${p.id} example script-like`);
    }

    const modes = { "vi-ja": 0, "ja-vi": 0, order: 0 };
    const practice = new Set();
    for (const q of p.exercises || []) {
      modes[q.mode] = (modes[q.mode] || 0) + 1;
      exerciseCount++;
      if (allIds.has(q.id)) duplicateIds++;
      allIds.add(q.id);
      if (allPrompts.has(q.prompt)) duplicatePrompts++;
      allPrompts.add(q.prompt);
      practice.add(q.prompt);
      for (const a of q.answers || []) practice.add(a);

      ok(!!q.prompt && String(q.prompt).trim(), `${q.id} empty prompt`);
      ok(Array.isArray(q.answers) && q.answers.length >= 1, `${q.id} answers`);
      ok(!!q.explanation && q.explanation.length > 10, `${q.id} explanation`);
      ok(!!q.hint && q.hint.length >= 1, `${q.id} hint`);
      ok(q.origin === "authored", `${q.id} origin`);
      ok(!placeholderRe.test(q.prompt), `${q.id} placeholder prompt`);
      ok(!scriptRe.test(q.prompt), `${q.id} script prompt`);
      warn(!adRe.test(q.prompt), `${q.id} looks like ad/url in prompt`);

      if (q.mode === "order") {
        ok(
          Array.isArray(q.tokens) && q.tokens.length === 4,
          `${q.id} need 4 tokens`,
        );
        ok(
          Array.isArray(q.acceptedOrders) && q.acceptedOrders.length >= 1,
          `${q.id} acceptedOrders`,
        );
        for (const t of q.tokens || []) {
          ok(!!t.text && String(t.text).trim(), `${q.id} empty token`);
        }
      }

      const hintNorm = String(q.hint || "")
        .toLowerCase()
        .replace(/\s+/g, "");
      for (const a of q.answers || []) {
        const aNorm = String(a).toLowerCase().replace(/\s+/g, "");
        ok(hintNorm !== aNorm, `${q.id} hint===answer`);
        ok(
          !(hintNorm.includes(aNorm) && aNorm.length >= 4),
          `${q.id} hint contains answer`,
        );
      }
    }

    ok(modes["vi-ja"] === 10, `${p.id} vi-ja ${modes["vi-ja"]}`);
    ok(modes["ja-vi"] === 10, `${p.id} ja-vi ${modes["ja-vi"]}`);
    ok(modes.order === 10, `${p.id} order ${modes.order}`);
    ok((p.exercises || []).length === 30, `${p.id} exercises≠30`);

    for (const ex of p.examples || []) {
      ok(!practice.has(ex.ja), `${p.id} example JA overlap practice`);
      ok(!practice.has(ex.vi), `${p.id} example VI overlap practice`);
    }
  }
}

ok(patternCount === 141, `patternCount ${patternCount} ≠ 141`);
ok(exerciseCount === 4230, `exerciseCount ${exerciseCount} ≠ 4230`);
ok(duplicateIds === 0, `duplicate exercise ids ${duplicateIds}`);
ok(duplicatePrompts === 0, `duplicate prompts ${duplicatePrompts}`);
ok(
  inventory.groups.every((g) => g.contentStatus === "imported"),
  "inventory has non-imported groups",
);

const report = {
  generatedAt: new Date().toISOString(),
  task: "N2-FULL-ACC",
  scope: "Master Requirement §73 automated content/scale evidence",
  teacherIndependentReview: "PENDING — not claimed",
  counts: {
    lessonsPublished: manifest.lessons.filter((l) => l.published).length,
    patterns: patternCount,
    exercises: exerciseCount,
    uniqueExerciseIds: allIds.size,
    uniquePrompts: allPrompts.size,
  },
  failures,
  warnings,
  pass: failures.length === 0,
};

const outPath = join(root, "docs/grammar-n2/FULL-ACCEPTANCE-EVIDENCE.json");
writeFileSync(outPath, JSON.stringify(report, null, 2) + "\n");

console.log(JSON.stringify(report.counts, null, 2));
if (warnings.length) {
  console.log("warnings:", warnings.length);
  for (const w of warnings.slice(0, 20)) console.log("  WARN", w);
}
if (failures.length) {
  console.error("FAIL", failures.length);
  for (const f of failures.slice(0, 40)) console.error(" ", f);
  process.exit(1);
}
console.log("PASS — automated §73 content/scale checks");
console.log("wrote", outPath);
console.log("NOTE: independent teacher review still PENDING");
