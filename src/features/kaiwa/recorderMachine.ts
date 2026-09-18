/** Capture-axis state machine (ADR-016 / KAI-004). Pure transitions — no I/O. */

export type CaptureState =
  | "idle"
  | "preparing"
  | "ready"
  | "countdown"
  | "recording"
  | "finalizing"
  | "saved"
  | "permission_denied"
  | "interrupted"
  | "failed"
  | "discarded";

export type CaptureEvent =
  | { type: "PREPARE" }
  | { type: "READY" }
  | { type: "START_COUNTDOWN" }
  | { type: "COUNTDOWN_DONE" }
  | { type: "STOP" } // user early stop
  | { type: "EOF" } // video ended
  | { type: "INTERRUPT" }
  | { type: "FINALIZE_OK"; completion: "completed" | "partial" | "interrupted" }
  | { type: "FAIL"; reason?: string }
  | { type: "DENY" }
  | { type: "DISCARD" }
  | { type: "RESET" };

const allowed: Record<CaptureState, CaptureEvent["type"][]> = {
  idle: ["PREPARE", "DENY", "RESET"],
  preparing: ["READY", "FAIL", "DENY", "RESET"],
  ready: ["START_COUNTDOWN", "DISCARD", "RESET", "DENY"],
  countdown: ["COUNTDOWN_DONE", "STOP", "INTERRUPT", "FAIL", "RESET"],
  recording: ["STOP", "EOF", "INTERRUPT", "FAIL"],
  finalizing: ["FINALIZE_OK", "FAIL"],
  saved: ["RESET", "DISCARD"],
  permission_denied: ["RESET", "PREPARE"],
  interrupted: ["FINALIZE_OK", "DISCARD", "RESET"],
  failed: ["RESET", "DISCARD"],
  discarded: ["RESET", "PREPARE"],
};

export type CaptureMachine = {
  state: CaptureState;
  completion: "completed" | "partial" | "interrupted" | "failed" | null;
  reason?: string;
};

export function createCaptureMachine(
  initial: CaptureState = "idle",
): CaptureMachine {
  return { state: initial, completion: null };
}

export function reduceCapture(
  machine: CaptureMachine,
  event: CaptureEvent,
): CaptureMachine {
  if (!allowed[machine.state].includes(event.type)) {
    return machine; // ignore illegal / double-fire
  }
  switch (event.type) {
    case "PREPARE":
      return { state: "preparing", completion: null };
    case "READY":
      return { state: "ready", completion: null };
    case "START_COUNTDOWN":
      return { state: "countdown", completion: null };
    case "COUNTDOWN_DONE":
      return { state: "recording", completion: null };
    case "STOP":
      if (machine.state === "countdown") {
        return { state: "discarded", completion: null };
      }
      return { state: "finalizing", completion: "partial" };
    case "EOF":
      return { state: "finalizing", completion: "completed" };
    case "INTERRUPT":
      return { state: "interrupted", completion: "interrupted" };
    case "FINALIZE_OK":
      return { state: "saved", completion: event.completion };
    case "FAIL":
      return {
        state: "failed",
        completion: "failed",
        reason: event.reason,
      };
    case "DENY":
      return { state: "permission_denied", completion: null };
    case "DISCARD":
      return { state: "discarded", completion: null };
    case "RESET":
      return { state: "idle", completion: null };
    default:
      return machine;
  }
}

/** While recording/countdown: seek and rate must stay locked at 1×. */
export function shouldLockPlayback(state: CaptureState): boolean {
  return state === "countdown" || state === "recording";
}
