import { test } from "node:test";
import assert from "node:assert/strict";
import {
  assertNotCharProportionalSplit,
  mergeWindowPassResults,
  planAlignWindows,
  regionsFromAnchors,
} from "../../shared/kaiwa/alignWindows";

test("KAI-071 planAlignWindows: short media is single window", () => {
  const w = planAlignWindows(60_000, {
    windowMs: 90_000,
    overlapMs: 15_000,
    minDurationForWindowsMs: 180_000,
  });
  assert.equal(w.length, 1);
  assert.equal(w[0].startMs, 0);
  assert.equal(w[0].endMs, 60_000);
});

test("KAI-071 planAlignWindows: long media overlaps and covers end", () => {
  const w = planAlignWindows(300_000, {
    windowMs: 90_000,
    overlapMs: 15_000,
    minDurationForWindowsMs: 180_000,
  });
  assert.ok(w.length >= 3);
  assert.equal(w[0].startMs, 0);
  assert.equal(w[0].endMs, 90_000);
  // step = 75s → second starts at 75s (15s overlap with first)
  assert.equal(w[1].startMs, 75_000);
  assert.ok(w[1].startMs < w[0].endMs);
  assert.equal(w[w.length - 1].endMs, 300_000);
});

test("KAI-071 regionsFromAnchors does not use character counts", () => {
  const regions = regionsFromAnchors(4, 100_000, [
    { lineIndex: 2, atMs: 40_000 },
  ]);
  assert.deepEqual(regions, [
    {
      lineStart: 0,
      lineEnd: 2,
      audioStartMs: 0,
      audioEndMs: 40_000,
    },
    {
      lineStart: 2,
      lineEnd: 4,
      audioStartMs: 40_000,
      audioEndMs: 100_000,
    },
  ]);
});

test("KAI-071 failed window is not applied; later window can fill", () => {
  const lines = ["あ", "い", "う"];
  const { drafts, failedWindows, appliedWindows } = mergeWindowPassResults(
    lines,
    [
      { windowIndex: 0, ok: false, error: "boom" },
      {
        windowIndex: 1,
        ok: true,
        items: [
          {
            ja: "あ",
            startMs: 100,
            endMs: 400,
            timingStatus: "proposed",
          },
          {
            ja: "い",
            startMs: 500,
            endMs: 800,
            timingStatus: "proposed",
          },
          {
            ja: "う",
            startMs: null,
            endMs: null,
            timingStatus: "unmatched",
          },
        ],
      },
    ],
    [0, 75_000],
  );
  assert.deepEqual(failedWindows, [0]);
  assert.deepEqual(appliedWindows, [1]);
  assert.equal(drafts[0].startMs, 75_100);
  assert.equal(drafts[1].startMs, 75_500);
  assert.equal(drafts[2].timingStatus, "unmatched");
});

test("KAI-071 rejects char-proportional window budgets", () => {
  assert.throws(
    () =>
      assertNotCharProportionalSplit(
        [10, 20, 30],
        [1000, 2000, 3000],
      ),
    /char_proportional_split_forbidden/,
  );
  assert.doesNotThrow(() =>
    assertNotCharProportionalSplit([10, 20, 30], [5000, 5000, 5000]),
  );
});
