import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createCaptureMachine,
  reduceCapture,
  shouldLockPlayback,
} from "../../src/features/kaiwa/recorderMachine";

test("capture machine happy path idle→saved completed", () => {
  let m = createCaptureMachine();
  m = reduceCapture(m, { type: "PREPARE" });
  m = reduceCapture(m, { type: "READY" });
  m = reduceCapture(m, { type: "START_COUNTDOWN" });
  m = reduceCapture(m, { type: "COUNTDOWN_DONE" });
  assert.equal(m.state, "recording");
  assert.equal(shouldLockPlayback(m.state), true);
  m = reduceCapture(m, { type: "EOF" });
  m = reduceCapture(m, { type: "FINALIZE_OK", completion: "completed" });
  assert.equal(m.state, "saved");
  assert.equal(m.completion, "completed");
});

test("early STOP yields partial; double START ignored", () => {
  let m = createCaptureMachine();
  m = reduceCapture(m, { type: "PREPARE" });
  m = reduceCapture(m, { type: "READY" });
  m = reduceCapture(m, { type: "START_COUNTDOWN" });
  m = reduceCapture(m, { type: "COUNTDOWN_DONE" });
  const again = reduceCapture(m, { type: "START_COUNTDOWN" });
  assert.equal(again.state, "recording"); // ignored
  m = reduceCapture(m, { type: "STOP" });
  assert.equal(m.state, "finalizing");
  assert.equal(m.completion, "partial");
  const doubleStop = reduceCapture(m, { type: "STOP" });
  assert.equal(doubleStop.state, "finalizing");
  m = reduceCapture(m, { type: "FINALIZE_OK", completion: "partial" });
  assert.equal(m.state, "saved");
});

test("interrupt and deny paths", () => {
  let m = createCaptureMachine();
  m = reduceCapture(m, { type: "DENY" });
  assert.equal(m.state, "permission_denied");
  m = reduceCapture(m, { type: "RESET" });
  m = reduceCapture(m, { type: "PREPARE" });
  m = reduceCapture(m, { type: "READY" });
  m = reduceCapture(m, { type: "START_COUNTDOWN" });
  m = reduceCapture(m, { type: "COUNTDOWN_DONE" });
  m = reduceCapture(m, { type: "INTERRUPT" });
  assert.equal(m.state, "interrupted");
  assert.equal(m.completion, "interrupted");
});
