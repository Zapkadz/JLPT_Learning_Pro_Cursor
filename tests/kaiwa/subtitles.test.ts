import { test } from "node:test";
import assert from "node:assert/strict";
import {
  findOverlaps,
  mergeSegments,
  parseSubtitles,
  splitSegment,
  stripSubtitleMarkup,
} from "../../shared/kaiwa/subtitles";

test("stripSubtitleMarkup removes tags and does not keep executable HTML", () => {
  const { text, stripped } = stripSubtitleMarkup(
    '<b onclick="alert(1)">こんにちは</b><script>x</script>',
  );
  assert.equal(stripped, true);
  assert.equal(text, "こんにちは");
  assert.ok(!text.includes("<"));
});

test("parse SRT with BOM + CRLF + comma millis", () => {
  const raw =
    "\uFEFF1\r\n00:00:01,000 --> 00:00:02,500\r\n第一行\r\n\r\n2\r\n00:00:03,000 --> 00:00:04,000\r\n第二行\r\n";
  const out = parseSubtitles(raw);
  assert.equal(out.format, "srt");
  assert.equal(out.segments.length, 2);
  assert.equal(out.segments[0].startMs, 1000);
  assert.equal(out.segments[0].endMs, 2500);
  assert.equal(out.segments[0].ja, "第一行");
});

test("parse VTT and reject end≤start / outside duration / flag overlap", () => {
  const raw = `WEBVTT

00:00:01.000 --> 00:00:00.500
bad

00:00:01.000 --> 00:00:03.000
ok one

00:00:02.000 --> 00:00:04.000
overlap two

00:00:09.000 --> 00:00:10.000
outside
`;
  const out = parseSubtitles(raw, { durationMs: 5000 });
  assert.equal(out.format, "vtt");
  assert.ok(out.issues.some((i) => i.code === "end_before_start"));
  assert.ok(out.issues.some((i) => i.code === "outside_duration"));
  assert.ok(out.issues.some((i) => i.code === "overlap"));
  assert.equal(out.segments.length, 2);
  assert.deepEqual(findOverlaps(out.segments).sort(), [0, 1]);
});

test("split and merge segments", () => {
  const seg = {
    id: "a",
    startMs: 0,
    endMs: 1000,
    ja: "あいう",
    reviewState: "draft" as const,
    assessable: true,
  };
  const parts = splitSegment(seg, 400);
  assert.ok(parts);
  assert.equal(parts![0].endMs, 400);
  assert.equal(parts![1].startMs, 400);
  const merged = mergeSegments(parts![0], parts![1]);
  assert.ok(merged);
  assert.equal(merged!.startMs, 0);
  assert.equal(merged!.endMs, 1000);
});
