import { test } from "node:test";
import assert from "node:assert/strict";
import {
  practiceBounds,
  speechBounds,
  withSpeechFields,
} from "../../shared/kaiwa/practiceTiming";
import { segmentsForOverlay } from "../../shared/kaiwa/liveOverlay";
import type { KaiwaSegment } from "../../shared/kaiwa/types";

function seg(
  partial: Partial<KaiwaSegment> & Pick<KaiwaSegment, "id" | "startMs" | "endMs">,
): KaiwaSegment {
  return {
    ja: "x",
    reviewState: "draft",
    assessable: true,
    ...partial,
  };
}

test("KAI-074 practice trail does not mutate transcript end", () => {
  const a = seg({ id: "a", startMs: 1000, endMs: 2000 });
  const b = seg({ id: "b", startMs: 2500, endMs: 3500 });
  const practice = practiceBounds(a, b, {
    leadInMs: 200,
    trailMs: 800,
    overlayEarlyShowMs: 400,
    minGapBeforeNextMs: 40,
  });
  assert.equal(a.endMs, 2000);
  assert.equal(practice.startMs, 800);
  // trail would want 2800 but next speech at 2500 → clamp to 2460
  assert.equal(practice.endMs, 2460);
  assert.ok(practice.endMs < b.startMs);
});

test("KAI-074 overlay early-show advances display start only", () => {
  const list = [
    seg({ id: "a", startMs: 1000, endMs: 2000, ja: "あ" }),
    seg({ id: "b", startMs: 3000, endMs: 4000, ja: "い" }),
  ];
  const overlay = segmentsForOverlay(list, {
    leadInMs: 0,
    trailMs: 0,
    overlayEarlyShowMs: 500,
    minGapBeforeNextMs: 0,
  });
  assert.equal(list[0].endMs, 2000);
  assert.equal(overlay[0].startMs, 500);
  assert.equal(overlay[0].endMs, 2000);
  assert.equal(overlay[1].startMs, 2500);
  assert.equal(overlay[1].endMs, 4000);
});

test("KAI-074 withSpeechFields mirrors start/end into speech*", () => {
  const s = withSpeechFields(seg({ id: "a", startMs: 10, endMs: 90 }));
  assert.equal(s.speechStartMs, 10);
  assert.equal(s.speechEndMs, 90);
  assert.deepEqual(speechBounds(s), { startMs: 10, endMs: 90 });
});
