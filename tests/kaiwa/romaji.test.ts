import { test } from "node:test";
import assert from "node:assert/strict";
import {
  markReadingStaleOnJaChange,
  particleRomaji,
  readingToRomaji,
  tokensWithRomaji,
} from "../../shared/kaiwa/romaji";

test("particle exceptions は/へ/を → wa/e/o", () => {
  assert.equal(particleRomaji("は"), "wa");
  assert.equal(particleRomaji("へ"), "e");
  assert.equal(particleRomaji("を"), "o");
  assert.equal(readingToRomaji("は", { surface: "は", isParticle: true }), "wa");
  assert.equal(readingToRomaji("へ", { surface: "へ" }), "e");
});

test("sokuon っ doubles following consonant", () => {
  assert.equal(readingToRomaji("がっこう"), "gakkou");
  assert.equal(readingToRomaji("きって"), "kitte");
});

test("ん assimilates before b/m/p", () => {
  assert.equal(readingToRomaji("せんぱい"), "sempai");
  assert.equal(readingToRomaji("かんむり"), "kammuri");
  assert.equal(readingToRomaji("にほん"), "nihon");
});

test("manual romaji override survives tokensWithRomaji", () => {
  const out = tokensWithRomaji([
    { surface: "は", reading: "は", romaji: "wa", manual: true },
    { surface: "学校", reading: "がっこう" },
  ]);
  assert.equal(out[0].romaji, "wa");
  assert.equal(out[1].romaji, "gakkou");
});

test("JA change marks reading stale and clears non-manual tokens", () => {
  const a = markReadingStaleOnJaChange("旧", "新", [
    { surface: "旧", reading: "きゅう" },
  ]);
  assert.equal(a.readingStale, true);
  assert.equal(a.tokens, undefined);

  const b = markReadingStaleOnJaChange("旧", "新", [
    { surface: "旧", reading: "きゅう", manual: true, romaji: "kyuu" },
  ]);
  assert.equal(b.readingStale, true);
  assert.ok(b.tokens?.length === 1);
});
