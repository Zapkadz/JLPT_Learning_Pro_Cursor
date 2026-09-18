import type Database from "better-sqlite3";
import { KaiwaError } from "./repository";
import {
  alignSegmentsToAttempt,
  type AlignmentReport,
} from "../../../shared/kaiwa/alignment";

function fail(status: number, message: string): never {
  throw new KaiwaError(status, message);
}

export function createAlignmentService(db: Database.Database) {
  function alignAttempt(
    ownerId: string,
    attemptId: string,
    body?: { offsetMs?: number },
  ): AlignmentReport {
    const attempt = db
      .prepare("SELECT * FROM kaiwa_attempts WHERE id=? AND owner_id=?")
      .get(attemptId, ownerId) as Record<string, unknown> | undefined;
    if (!attempt) fail(404, "Không tìm thấy bản thu.");

    const revision = db
      .prepare("SELECT * FROM kaiwa_revisions WHERE id=?")
      .get(String(attempt.revision_id)) as
      | { payload: string }
      | undefined;
    if (!revision) fail(404, "Không tìm thấy revision của lần thu.");

    let segments: Array<{
      id: string;
      startMs: number;
      endMs: number;
      ja?: string;
      assessable?: boolean;
    }> = [];
    try {
      const payload = JSON.parse(revision.payload || '{"segments":[]}');
      segments = Array.isArray(payload.segments) ? payload.segments : [];
    } catch {
      segments = [];
    }

    let clocks: { tailMissing?: boolean; mix?: { offsetMs?: number } } = {};
    try {
      clocks = JSON.parse(String(attempt.clocks_json || "{}"));
    } catch {
      clocks = {};
    }

    let device: { mix?: { offsetMs?: number } } = {};
    try {
      device = JSON.parse(String(attempt.device_json || "{}"));
    } catch {
      device = {};
    }

    const offsetMs =
      body?.offsetMs ??
      device.mix?.offsetMs ??
      clocks.mix?.offsetMs ??
      0;

    const report = alignSegmentsToAttempt(segments, {
      attemptDurationMs: Number(attempt.duration_ms) || 0,
      completion: attempt.completion ? String(attempt.completion) : null,
      tailMissing: Boolean(clocks.tailMissing),
      offsetMs: Number(offsetMs) || 0,
    });

    const nextClocks = { ...clocks, alignment: report };
    db.prepare(
      "UPDATE kaiwa_attempts SET clocks_json=? WHERE id=? AND owner_id=?",
    ).run(JSON.stringify(nextClocks), attemptId, ownerId);

    return report;
  }

  function getStored(ownerId: string, attemptId: string): AlignmentReport | null {
    const attempt = db
      .prepare("SELECT clocks_json FROM kaiwa_attempts WHERE id=? AND owner_id=?")
      .get(attemptId, ownerId) as { clocks_json: string } | undefined;
    if (!attempt) fail(404, "Không tìm thấy bản thu.");
    try {
      const clocks = JSON.parse(attempt.clocks_json || "{}") as {
        alignment?: AlignmentReport;
      };
      return clocks.alignment ?? null;
    } catch {
      return null;
    }
  }

  return { alignAttempt, getStored };
}

export type AlignmentService = ReturnType<typeof createAlignmentService>;
