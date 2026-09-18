import { test } from "node:test";
import assert from "node:assert/strict";
import type { KaiwaSegment } from "../../shared/kaiwa/types";
import {
  applySegmentTiming,
  anchorsFromLocks,
  countUnchangedTimings,
  mergeRealignPreservingLocks,
  popTimingUndo,
  pushTimingUndo,
  rangeBetweenLocks,
  toggleTimingLock,
} from "../../shared/kaiwa/timingEdit";

function makeSeg(
  i: number,
  opts?: Partial<KaiwaSegment>,
): KaiwaSegment {
  return {
    id: `s${i}`,
    ja: `line${i}`,
    startMs: i * 1000,
    endMs: i * 1000 + 800,
    reviewState: "draft",
    assessable: true,
    timingStatus: "proposed",
    ...opts,
  };
}

test("KAI-073 merge keeps 25/30 when only 5 unlocked lines realign", () => {
  const previous = Array.from({ length: 30 }, (_, i) =>
    makeSeg(i, { timingLocked: i < 25 }),
  );
  const aligned = previous.map((s, i) =>
    i >= 25
      ? { ...s, startMs: s.startMs + 50, endMs: s.endMs + 50, timingStatus: "proposed" as const }
      : { ...s, startMs: s.startMs + 999, endMs: s.endMs + 999 },
  );
  const { segments, changedIds, preservedIds } = mergeRealignPreservingLocks(
    previous,
    aligned,
    { rangeStart: 0, rangeEnd: 30 },
  );
  assert.equal(countUnchangedTimings(previous, segments), 25);
  assert.equal(preservedIds.length, 25);
  assert.equal(changedIds.length, 5);
  assert.equal(segments[25].startMs, previous[25].startMs + 50);
  assert.equal(segments[0].startMs, previous[0].startMs);
});

test("KAI-073 rangeBetweenLocks and anchorsFromLocks", () => {
  const segs = [
    makeSeg(0, { timingLocked: true }),
    makeSeg(1),
    makeSeg(2),
    makeSeg(3, { timingLocked: true }),
    makeSeg(4),
  ];
  assert.deepEqual(rangeBetweenLocks(segs, 2), {
    rangeStart: 1,
    rangeEnd: 3,
  });
  assert.deepEqual(anchorsFromLocks(segs), [
    { lineIndex: 0, atMs: 0 },
    { lineIndex: 3, atMs: 3000 },
  ]);
});

test("KAI-073 applySegmentTiming + undo stack", () => {
  const a = makeSeg(0);
  const b = applySegmentTiming(a, 100, 500);
  assert.equal(b.startMs, 100);
  assert.equal(b.speechEndMs, 500);
  assert.equal(b.timingReason, "manual_waveform");
  let stack = pushTimingUndo([], [a]);
  stack = pushTimingUndo(stack, [b]);
  const locked = toggleTimingLock(b, true);
  assert.equal(locked.timingLocked, true);
  const popped = popTimingUndo(stack);
  assert.equal(popped.restored?.[0].startMs, 100);
});
