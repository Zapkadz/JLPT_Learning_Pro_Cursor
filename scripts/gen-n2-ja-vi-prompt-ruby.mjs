/**
 * Fill ja-vi promptRuby for all published lessons (ADR-009 / N2-L01-FURI-001).
 * Run: node scripts/gen-n2-ja-vi-prompt-ruby.mjs
 *
 * Uses Kuroshiro+Kuromoji to produce structured ruby; prompt stays clean JA.
 * Readings are agent-generated — not teacher-verified.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const Kuroshiro = require("kuroshiro").default || require("kuroshiro");
const KuromojiAnalyzer =
  require("kuroshiro-analyzer-kuromoji").default ||
  require("kuroshiro-analyzer-kuromoji");

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const n2 = join(root, "content/grammar/n2");
const manifest = JSON.parse(readFileSync(join(n2, "manifest.json"), "utf8"));

const HAS_KANJI = /[\u4e00-\u9fff]/;

function parseFuriganaHtml(html, fallbackPlain) {
  const tokens = [];
  const re = /<ruby>([^<]*)<rp>[^<]*<\/rp><rt>([^<]*)<\/rt><rp>[^<]*<\/rp><\/ruby>|([^<]+)/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    if (m[1] != null) {
      tokens.push({ text: m[1], reading: m[2] || undefined });
    } else if (m[3]) {
      tokens.push({ text: m[3] });
    }
  }
  if (!tokens.length) {
    return HAS_KANJI.test(fallbackPlain)
      ? [{ text: fallbackPlain, reading: fallbackPlain }]
      : [{ text: fallbackPlain }];
  }
  const joined = tokens.map((t) => t.text).join("");
  if (joined !== fallbackPlain) {
    // Fallback: single span with hiragana-only conversion if parse drift
    return null;
  }
  return tokens;
}

async function main() {
  const kuroshiro = new Kuroshiro();
  await kuroshiro.init(new KuromojiAnalyzer());
  console.log("kuroshiro ready");

  let updated = 0;
  let exercises = 0;

  for (const entry of manifest.lessons) {
    if (!entry.published) continue;
    const path = join(n2, `${entry.id}.json`);
    const lesson = JSON.parse(readFileSync(path, "utf8"));
    let changed = false;

    for (const p of lesson.patterns) {
      for (const q of p.exercises) {
        if (q.mode !== "ja-vi") continue;
        exercises++;
        const html = await kuroshiro.convert(q.prompt, {
          mode: "furigana",
          to: "hiragana",
        });
        let ruby = parseFuriganaHtml(html, q.prompt);
        if (!ruby) {
          const reading = await kuroshiro.convert(q.prompt, {
            mode: "normal",
            to: "hiragana",
          });
          ruby = HAS_KANJI.test(q.prompt)
            ? [{ text: q.prompt, reading }]
            : [{ text: q.prompt }];
        }
        // Drop readings that equal surface (useless furigana)
        ruby = ruby.map((t) =>
          t.reading && t.reading !== t.text
            ? t
            : { text: t.text },
        );
        q.promptRuby = ruby;
        changed = true;
        updated++;
      }
    }

    if (changed) {
      writeFileSync(path, JSON.stringify(lesson, null, 2) + "\n");
      console.log("wrote", entry.id);
    }
  }

  console.log("ja-vi exercises", exercises, "promptRuby set", updated);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
