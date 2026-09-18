import { test } from "node:test";
import assert from "node:assert/strict";
import type { KaiwaSegment } from "../../shared/kaiwa/types";
import {
  countTimingStatuses,
  isSpeakableSegment,
  isUnmatchedSegment,
  speakableIndices,
  summarizeAlignResultVi,
} from "../../shared/kaiwa/timingStatus";

function seg(p: Partial<KaiwaSegment> & Pick<KaiwaSegment, "id">): KaiwaSegment {
  return {
    ja: "x",
    startMs: 0,
    endMs: 1000,
    reviewState: "draft",
    assessable: true,
    ...p,
  };
}

test("KAI-072 unmatched detection and speakable filter", () => {
  const u = seg({
    id: "u",
    timingStatus: "unmatched",
    startMs: 0,
    endMs: 1,
    assessable: false,
  });
  const n = seg({
    id: "n",
    timingStatus: "needs_review",
    timingUncertain: true,
    startMs: 100,
    endMs: 500,
  });
  const p = seg({ id: "p", timingStatus: "proposed", startMs: 600, endMs: 900 });
  assert.equal(isUnmatchedSegment(u), true);
  assert.equal(isSpeakableSegment(u), false);
  assert.equal(isSpeakableSegment(n), true);
  assert.equal(isSpeakableSegment(p), true);
  const list = [u, n, p];
  assert.deepEqual(speakableIndices(list), [1, 2]);
  const c = countTimingStatuses(list);
  assert.equal(c.unmatched, 1);
  assert.equal(c.needsReview, 1);
  assert.equal(c.proposed, 1);
  assert.equal(c.speakable, 2);
  assert.match(summarizeAlignResultVi(list), /chưa khớp/);
});
