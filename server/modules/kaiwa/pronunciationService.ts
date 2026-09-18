import type Database from "better-sqlite3";
import { KaiwaError } from "./repository";
import {
  notConfiguredAttemptReport,
  type AttemptPronunciationReport,
} from "../../../shared/kaiwa/assessment";
import type { AlignmentReport } from "../../../shared/kaiwa/alignment";

function fail(status: number, message: string): never {
  throw new KaiwaError(status, message);
}

/**
 * Pronunciation assessment stub (KAI-026).
 * No live ja-JP provider — returns unavailable; never invents scores.
 */
export function createPronunciationService(db: Database.Database) {
  function persist(
    ownerId: string,
    attemptId: string,
    report: AttemptPronunciationReport,
  ) {
    const row = db
      .prepare(
        "SELECT clocks_json FROM kaiwa_attempts WHERE id=? AND owner_id=?",
      )
      .get(attemptId, ownerId) as { clocks_json: string } | undefined;
    if (!row) return;
    let clocks: Record<string, unknown> = {};
    try {
      clocks = JSON.parse(row.clocks_json || "{}");
    } catch {
      clocks = {};
    }
    clocks.pronunciation = report;
    db.prepare(
      "UPDATE kaiwa_attempts SET clocks_json=? WHERE id=? AND owner_id=?",
    ).run(JSON.stringify(clocks), attemptId, ownerId);
  }

  function assessAttempt(
    ownerId: string,
    attemptId: string,
  ): AttemptPronunciationReport {
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

    let segmentIds: string[] = [];
    try {
      const payload = JSON.parse(revision.payload || '{"segments":[]}');
      const segs = Array.isArray(payload.segments) ? payload.segments : [];
      segmentIds = segs
        .map((s: { id?: string }) => String(s.id || ""))
        .filter(Boolean);
    } catch {
      segmentIds = [];
    }

    let clocks: { alignment?: AlignmentReport } = {};
    try {
      clocks = JSON.parse(String(attempt.clocks_json || "{}"));
    } catch {
      clocks = {};
    }

    const alignmentHints =
      clocks.alignment?.segments.map((s) => ({
        segmentId: s.segmentId,
        status: s.status,
        startMs: s.alignedStartMs,
        endMs: s.alignedEndMs,
      })) ?? undefined;

    const report = notConfiguredAttemptReport(
      attemptId,
      segmentIds,
      alignmentHints,
    );
    persist(ownerId, attemptId, report);
    return report;
  }

  function getStored(
    ownerId: string,
    attemptId: string,
  ): AttemptPronunciationReport | null {
    const row = db
      .prepare(
        "SELECT clocks_json FROM kaiwa_attempts WHERE id=? AND owner_id=?",
      )
      .get(attemptId, ownerId) as { clocks_json: string } | undefined;
    if (!row) fail(404, "Không tìm thấy bản thu.");
    try {
      const clocks = JSON.parse(row.clocks_json || "{}") as {
        pronunciation?: AttemptPronunciationReport;
      };
      return clocks.pronunciation ?? null;
    } catch {
      return null;
    }
  }

  return { assessAttempt, getStored };
}

export type PronunciationService = ReturnType<
  typeof createPronunciationService
>;
