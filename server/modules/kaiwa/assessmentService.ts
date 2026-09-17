import type Database from "better-sqlite3";
import { KaiwaError } from "./repository";
import {
  aggregateAttemptAssessment,
  assessmentFingerprint,
  canReuseAssessment,
  type AttemptAssessment,
} from "../../../shared/kaiwa/assessmentAggregate";
import { RUBRIC_VERSION } from "../../../shared/kaiwa/assessment";
import type { AudioQualityReport } from "../../../shared/kaiwa/audioQuality";
import type { AlignmentReport } from "../../../shared/kaiwa/alignment";
import type { AttemptPronunciationReport } from "../../../shared/kaiwa/assessment";
import type { ProsodyReport } from "../../../shared/kaiwa/prosody";
import type { PronunciationService } from "./pronunciationService";
import type { ProsodyService } from "./prosodyService";
import type { AlignmentService } from "./alignmentService";
import type { AudioQualityService } from "./audioQualityService";

function fail(status: number, message: string): never {
  throw new KaiwaError(status, message);
}

type ClocksBlob = {
  audioQuality?: AudioQualityReport;
  alignment?: AlignmentReport;
  pronunciation?: AttemptPronunciationReport;
  prosody?: ProsodyReport;
  assessment?: AttemptAssessment;
};

/**
 * Aggregate assessment with cache + version isolation (KAI-028).
 * charged always false — no provider billing in stub path.
 */
export function createAssessmentService(
  db: Database.Database,
  deps: {
    audioQuality: AudioQualityService;
    alignment: AlignmentService;
    pronunciation: PronunciationService;
    prosody: ProsodyService;
  },
) {
  function readClocks(ownerId: string, attemptId: string): ClocksBlob {
    const row = db
      .prepare(
        "SELECT clocks_json FROM kaiwa_attempts WHERE id=? AND owner_id=?",
      )
      .get(attemptId, ownerId) as { clocks_json: string } | undefined;
    if (!row) fail(404, "Không tìm thấy bản thu.");
    try {
      return JSON.parse(row.clocks_json || "{}") as ClocksBlob;
    } catch {
      return {};
    }
  }

  function writeClocks(
    ownerId: string,
    attemptId: string,
    clocks: ClocksBlob,
  ) {
    db.prepare(
      "UPDATE kaiwa_attempts SET clocks_json=? WHERE id=? AND owner_id=?",
    ).run(JSON.stringify(clocks), attemptId, ownerId);
  }

  function ensureLayers(ownerId: string, attemptId: string): ClocksBlob {
    let clocks = readClocks(ownerId, attemptId);
    if (!clocks.audioQuality) {
      deps.audioQuality.checkAttempt(ownerId, attemptId);
      clocks = readClocks(ownerId, attemptId);
    }
    if (!clocks.alignment) {
      deps.alignment.alignAttempt(ownerId, attemptId);
      clocks = readClocks(ownerId, attemptId);
    }
    if (!clocks.pronunciation) {
      deps.pronunciation.assessAttempt(ownerId, attemptId);
      clocks = readClocks(ownerId, attemptId);
    }
    if (!clocks.prosody) {
      deps.prosody.analyzeAttempt(ownerId, attemptId);
      clocks = readClocks(ownerId, attemptId);
    }
    return readClocks(ownerId, attemptId);
  }

  function segmentIdsFor(
    ownerId: string,
    attemptId: string,
  ): string[] {
    const attempt = db
      .prepare("SELECT revision_id FROM kaiwa_attempts WHERE id=? AND owner_id=?")
      .get(attemptId, ownerId) as { revision_id: string } | undefined;
    if (!attempt) fail(404, "Không tìm thấy bản thu.");
    const revision = db
      .prepare("SELECT payload FROM kaiwa_revisions WHERE id=?")
      .get(attempt.revision_id) as { payload: string } | undefined;
    try {
      const payload = JSON.parse(revision?.payload || '{"segments":[]}');
      const segs = Array.isArray(payload.segments) ? payload.segments : [];
      return segs
        .map((s: { id?: string }) => String(s.id || ""))
        .filter(Boolean);
    } catch {
      return [];
    }
  }

  function assessAttempt(
    ownerId: string,
    attemptId: string,
    opts?: { force?: boolean; rubricVersion?: string },
  ): { assessment: AttemptAssessment; reused: boolean } {
    const attempt = db
      .prepare("SELECT id FROM kaiwa_attempts WHERE id=? AND owner_id=?")
      .get(attemptId, ownerId);
    if (!attempt) fail(404, "Không tìm thấy bản thu.");

    const rubricVersion = opts?.rubricVersion ?? RUBRIC_VERSION;
    const clocks = ensureLayers(ownerId, attemptId);
    const nextFp = assessmentFingerprint(rubricVersion, {
      quality: clocks.audioQuality ?? null,
      alignment: clocks.alignment ?? null,
      pronunciation: clocks.pronunciation ?? null,
      prosody: clocks.prosody ?? null,
    });

    if (
      !opts?.force &&
      canReuseAssessment(clocks.assessment ?? null, nextFp, rubricVersion)
    ) {
      return { assessment: clocks.assessment!, reused: true };
    }

    // Different rubric/version stored → keep old under assessmentHistory, write new
    const prev = clocks.assessment;
    if (
      prev &&
      (prev.rubricVersion !== rubricVersion || prev.fingerprint !== nextFp)
    ) {
      const history = Array.isArray(
        (clocks as { assessmentHistory?: AttemptAssessment[] })
          .assessmentHistory,
      )
        ? (clocks as { assessmentHistory: AttemptAssessment[] })
            .assessmentHistory
        : [];
      history.push(prev);
      (clocks as { assessmentHistory: AttemptAssessment[] }).assessmentHistory =
        history.slice(-5);
    }

    const assessment = aggregateAttemptAssessment({
      attemptId,
      quality: clocks.audioQuality ?? null,
      alignment: clocks.alignment ?? null,
      pronunciation: clocks.pronunciation ?? null,
      prosody: clocks.prosody ?? null,
      segmentIds: segmentIdsFor(ownerId, attemptId),
      rubricVersion,
    });

    clocks.assessment = assessment;
    writeClocks(ownerId, attemptId, clocks);
    return { assessment, reused: false };
  }

  function getStored(
    ownerId: string,
    attemptId: string,
  ): AttemptAssessment | null {
    const clocks = readClocks(ownerId, attemptId);
    return clocks.assessment ?? null;
  }

  return { assessAttempt, getStored };
}

export type AssessmentService = ReturnType<typeof createAssessmentService>;
