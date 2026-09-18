import { test } from "node:test";
import assert from "node:assert/strict";
import { mergePreserveSegmentMeta } from "../../server/modules/kaiwa/scriptAlign";
import type { KaiwaSegment } from "../../shared/kaiwa/types";

function seg(
  partial: Partial<KaiwaSegment> & Pick<KaiwaSegment, "id" | "ja">,
): KaiwaSegment {
  return {
    startMs: 0,
    endMs: 1000,
    reviewState: "draft",
    assessable: true,
    ...partial,
  };
}

test("KAI-065 mergePreserveSegmentMeta keeps id/vi/tokens", () => {
  const prev = [
    seg({
      id: "stable-1",
      ja: "こんにちは。",
      vi: "Xin chào",
      tokens: [{ surface: "こんにちは", reading: "こんにちは" }],
    }),
    seg({ id: "stable-2", ja: "ありがとう。", vi: "Cảm ơn" }),
  ];
  const aligned = [
    seg({
      id: "new-a",
      ja: "こんにちは。",
      startMs: 100,
      endMs: 800,
      timingStatus: "proposed",
    }),
    seg({
      id: "new-b",
      ja: "ありがとう。",
      startMs: 900,
      endMs: 1500,
      timingStatus: "proposed",
    }),
  ];
  const out = mergePreserveSegmentMeta(aligned, prev);
  assert.equal(out[0].id, "stable-1");
  assert.equal(out[0].vi, "Xin chào");
  assert.equal(out[0].tokens?.[0]?.reading, "こんにちは");
  assert.equal(out[0].startMs, 100);
  assert.equal(out[1].id, "stable-2");
  assert.equal(out[1].vi, "Cảm ơn");
});
