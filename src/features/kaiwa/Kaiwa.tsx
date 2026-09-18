import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { Mic2, Upload } from "lucide-react";
import { ApiError, api, dateTime, post, useData } from "../../lib/api";
import { ErrorState, Loading, PageHead, Status } from "../../components/ui";
import {
  cancelUpload,
  loadResume,
  uploadFileChunked,
} from "./uploadClient";
import {
  findOverlaps,
  mergeSegments,
  parseSubtitles,
  parseUntimedScript,
  splitSegment,
} from "../../../shared/kaiwa/subtitles";
import {
  markReadingStaleOnJaChange,
  readingToRomaji,
  tokensWithRomaji,
} from "../../../shared/kaiwa/romaji";
import type { KaiwaRubyToken, KaiwaSegment } from "../../../shared/kaiwa/types";
import {
  countTimingStatuses,
  isNeedsReviewSegment,
  isSpeakableSegment,
  isUnmatchedSegment,
  summarizeAlignResultVi,
} from "../../../shared/kaiwa/timingStatus";
import {
  anchorsFromLocks,
  applySegmentTiming,
  mergeRealignPreservingLocks,
  popTimingUndo,
  pushTimingUndo,
  rangeBetweenLocks,
  toggleTimingLock,
  type TimingSnapshot,
} from "../../../shared/kaiwa/timingEdit";
import { useAuth } from "../../App";
import { MicPreflightPanel } from "./MicPreflightPanel";
import { ContinuousRecorder } from "./ContinuousRecorder";
import { SegmentStudio } from "./SegmentStudio";
import { ScriptHelpLayers } from "./ScriptHelpLayers";
import { TimingWaveform } from "./TimingWaveform";
import "./kaiwa.css";

type ProjectRow = {
  id: string;
  title: string;
  status: string;
  version: number;
  source_asset_id: string | null;
  proxy_asset_id: string | null;
  updated_at: string;
  created_at: string;
};

const MAX_UPLOAD_LABEL = "250 MB";
const MAX_DURATION_LABEL = "10 phút";

function statusLabel(status: string) {
  switch (status) {
    case "ready":
      return "Sẵn sàng";
    case "processing":
      return "Đang xử lý";
    case "failed":
      return "Lỗi xử lý";
    case "draft":
      return "Nháp";
    default:
      return status;
  }
}

export function KaiwaLibrary() {
  const { data, error, reload } = useData<{ projects: ProjectRow[] }>(
    "/kaiwa/projects",
  );
  if (error) return <ErrorState message={error} retry={reload} />;
  if (!data) return <Loading />;
  const projects = data.projects;

  return (
    <div className="kaiwa-page">
      <PageHead
        title="Kaiwa"
        description="Thư viện video riêng tư — lồng tiếng liên tục toàn video."
      >
        <Link className="btn secondary" to="/kaiwa/history">
          Lịch sử
        </Link>
        <Link className="btn" to="/kaiwa/new">
          <Upload size={18} /> Tải video mới
        </Link>
      </PageHead>

      {projects.length === 0 ? (
        <div className="panel empty kaiwa-empty">
          <Mic2 className="empty-icon" size={40} aria-hidden />
          <h2>Chưa có video nào</h2>
          <p>Tải video đầu tiên để bắt đầu luyện lồng tiếng.</p>
          <Link className="btn" to="/kaiwa/new">
            Tải video đầu tiên
          </Link>
        </div>
      ) : (
        <ul className="kaiwa-grid">
          {projects.map((p) => (
            <li key={p.id}>
              <Link className="kaiwa-card" to={`/kaiwa/projects/${p.id}`}>
                <strong>{p.title}</strong>
                <span className={`kaiwa-badge status-${p.status}`}>
                  {statusLabel(p.status)}
                </span>
                <small>Cập nhật {dateTime(p.updated_at)}</small>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function KaiwaUpload() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<
    "idle" | "uploading" | "preparing" | "done" | "error"
  >("idle");
  const [message, setMessage] = useState("");
  const [canResume, setCanResume] = useState(false);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  function pick(f: File | null) {
    setFile(f);
    setMessage("");
    setProgress(0);
    setPhase("idle");
    if (f) {
      setTitle((t) => t || f.name.replace(/\.[^.]+$/, "").slice(0, 200));
      setCanResume(!!loadResume(f));
    } else {
      setCanResume(false);
    }
  }

  async function startUpload() {
    if (!file || !title.trim()) return;
    if (file.size > 250 * 1024 * 1024) {
      setPhase("error");
      setMessage(`Tệp vượt giới hạn ${MAX_UPLOAD_LABEL}.`);
      return;
    }
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setPhase("uploading");
    setMessage("");
    try {
      const { assetId } = await uploadFileChunked(file, {
        signal: ac.signal,
        onProgress: setProgress,
      });
      setPhase("preparing");
      const project = await post<ProjectRow>("/kaiwa/projects", {
        title: title.trim(),
        sourceAssetId: assetId,
      });
      await post(`/kaiwa/projects/${project.id}/prepare-media`);
      setPhase("done");
      navigate(`/kaiwa/projects/${project.id}`, { replace: true });
    } catch (e) {
      if ((e as Error).name === "AbortError") {
        setPhase("idle");
        setMessage("Đã hủy tải lên. Có thể tiếp tục sau nếu phiên còn hiệu lực.");
        setCanResume(!!file && !!loadResume(file));
        return;
      }
      setPhase("error");
      setMessage(
        e instanceof ApiError || e instanceof Error
          ? e.message
          : "Tải lên thất bại.",
      );
      setCanResume(!!file && !!loadResume(file));
    }
  }

  async function onCancel() {
    abortRef.current?.abort();
    if (file) {
      try {
        await cancelUpload(file);
      } catch {
        /* ignore */
      }
      setCanResume(false);
    }
    setPhase("idle");
    setProgress(0);
    setMessage("Đã hủy và giải phóng chỗ đặt trước.");
  }

  return (
    <div className="kaiwa-page">
      <PageHead
        title="Tải video Kaiwa"
        description={`Giới hạn thử nghiệm: tối đa ${MAX_DURATION_LABEL} / ${MAX_UPLOAD_LABEL} (ADR-015).`}
      >
        <Link className="btn secondary" to="/kaiwa">
          Thư viện
        </Link>
      </PageHead>

      <div className="panel kaiwa-upload">
        <label className="kaiwa-dropzone">
          <input
            ref={inputRef}
            type="file"
            accept="video/mp4,video/webm,video/*"
            hidden
            onChange={(e) => pick(e.target.files?.[0] || null)}
          />
          <Upload size={28} aria-hidden />
          <span>
            {file
              ? `${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB)`
              : "Chọn hoặc kéo thả video"}
          </span>
          <button
            type="button"
            className="btn secondary"
            onClick={() => inputRef.current?.click()}
            disabled={phase === "uploading" || phase === "preparing"}
          >
            Chọn tệp
          </button>
        </label>

        <label className="kaiwa-field">
          Tên dự án
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            disabled={phase === "uploading" || phase === "preparing"}
          />
        </label>

        {(phase === "uploading" || phase === "preparing") && (
          <div className="kaiwa-progress" role="status" aria-live="polite">
            <div
              className="kaiwa-progress-bar"
              style={{
                width: `${phase === "preparing" ? 100 : Math.round(progress * 100)}%`,
              }}
            />
            <span>
              {phase === "preparing"
                ? "Đang chuẩn bị phát lại…"
                : `Đang tải ${Math.round(progress * 100)}%`}
            </span>
          </div>
        )}

        {message && (
          <Status tone={phase === "error" ? "error" : "info"}>{message}</Status>
        )}

        <div className="kaiwa-actions">
          {(phase === "idle" || phase === "error") && (
            <button
              className="btn"
              disabled={!file || !title.trim()}
              onClick={startUpload}
            >
              {canResume ? "Tiếp tục tải lên" : "Bắt đầu tải lên"}
            </button>
          )}
          {(phase === "uploading" || phase === "preparing") && (
            <button className="btn secondary" onClick={onCancel}>
              Hủy
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function KaiwaProject() {
  const { id } = useParams();
  const { data, error, reload } = useData<ProjectRow>(
    id ? `/kaiwa/projects/${id}` : "",
  );
  const {
    data: attemptData,
    error: attemptError,
    reload: reloadAttempts,
  } = useData<{ attempts: AttemptListRow[] }>(
    id ? `/kaiwa/projects/${id}/attempts` : "",
  );
  const [prepError, setPrepError] = useState("");
  const [preparing, setPreparing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  const playbackUrl = useMemo(() => {
    if (!data?.proxy_asset_id) return null;
    return `/api/kaiwa/assets/${data.proxy_asset_id}/content`;
  }, [data?.proxy_asset_id]);

  async function retryPrepare() {
    if (!id) return;
    setPreparing(true);
    setPrepError("");
    try {
      await post(`/kaiwa/projects/${id}/prepare-media`);
      reload();
    } catch (e) {
      setPrepError(e instanceof Error ? e.message : "Chuẩn bị thất bại.");
    } finally {
      setPreparing(false);
    }
  }

  async function deleteProject() {
    if (!id || !data) return;
    if (
      !window.confirm(
        `Xóa dự án «${data.title}»? File media sẽ được dọn khi không còn tham chiếu.`,
      )
    )
      return;
    setDeleting(true);
    setPrepError("");
    try {
      await api(`/kaiwa/projects/${id}`, { method: "DELETE" });
      navigate("/kaiwa", { replace: true });
    } catch (e) {
      setPrepError(e instanceof Error ? e.message : "Xóa thất bại.");
      setDeleting(false);
    }
  }

  if (!id) return <ErrorState message="Thiếu mã dự án." />;
  if (error) return <ErrorState message={error} retry={reload} />;
  if (!data) return <Loading />;

  const attempts = attemptData?.attempts ?? [];

  return (
    <div className="kaiwa-page">
      <PageHead title={data.title} description={`Trạng thái: ${statusLabel(data.status)}`}>
        <Link className="btn secondary" to="/kaiwa">
          Thư viện
        </Link>
      </PageHead>

      {prepError && <Status>{prepError}</Status>}

      {data.status === "failed" || (!data.proxy_asset_id && data.source_asset_id) ? (
        <div className="panel">
          <p>Video chưa sẵn sàng để xem. Thử chuẩn bị lại sau khi tải lên.</p>
          <button className="btn" disabled={preparing} onClick={retryPrepare}>
            {preparing ? "Đang chuẩn bị…" : "Chuẩn bị phát lại"}
          </button>
        </div>
      ) : null}

      {playbackUrl ? (
        <div className="panel kaiwa-player">
          <video
            key={playbackUrl}
            controls
            playsInline
            preload="metadata"
            src={playbackUrl}
          >
            Trình duyệt không phát được video này.
          </video>
          <p className="kaiwa-privacy-note">
            Phát qua phiên đăng nhập (cookie). URL có UUID ngẫu nhiên — không dùng
            đường dẫn đoán được công khai.
          </p>
        </div>
      ) : data.status === "processing" ? (
        <div className="panel">
          <Loading />
          <button className="btn secondary" onClick={reload}>
            Làm mới trạng thái
          </button>
        </div>
      ) : null}

      <div className="panel kaiwa-hub-actions">
        <p>Soạn lời thoại, xem lại trên màn chuẩn bị, rồi bắt đầu lần thu (snapshot bất biến).</p>
        <div className="kaiwa-actions">
          <Link className="btn" to={`/kaiwa/projects/${data.id}/edit`}>
            Soạn phụ đề
          </Link>
          <Link className="btn" to={`/kaiwa/projects/${data.id}/prep`}>
            Chuẩn bị học
          </Link>
          <Link className="btn secondary" to="/kaiwa/new">
            Tải video khác
          </Link>
          <button
            type="button"
            className="btn secondary"
            disabled={deleting}
            onClick={() => void deleteProject()}
          >
            {deleting ? "Đang xóa…" : "Xóa dự án"}
          </button>
        </div>
      </div>

      <div className="panel">
        <h2 className="kaiwa-section-title">Lịch sử lần thu</h2>
        <p className="kaiwa-privacy-note">
          Mỗi lần thu là một bản riêng — thu lại không ghi đè bản cũ.
        </p>
        {attemptError ? (
          <Status tone="error">
            {attemptError}{" "}
            <button type="button" className="btn secondary" onClick={reloadAttempts}>
              Thử lại
            </button>
          </Status>
        ) : !attemptData ? (
          <Loading />
        ) : attempts.length === 0 ? (
          <p>Chưa có lần thu nào. Bắt đầu từ màn chuẩn bị học.</p>
        ) : (
          <ul className="kaiwa-attempt-list">
            {attempts.map((a) => {
              const mix = parseMix(a.device_json);
              return (
                <li key={a.id}>
                  <Link
                    className="kaiwa-attempt-row"
                    to={`/kaiwa/attempts/${a.id}`}
                  >
                    <span>
                      {dateTime(a.created_at)}
                      {mix.keep ? " · giữ" : ""}
                    </span>
                    <span>
                      {a.record_state}
                      {a.completion ? ` · ${a.completion}` : ""}
                      {a.duration_ms != null
                        ? ` · ${(a.duration_ms / 1000).toFixed(1)}s`
                        : ""}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

type RevisionView = {
  revisionId: string;
  version: number;
  state: string;
  payload: { segments: KaiwaSegment[] };
  source_json?: {
    source?: string;
    alignEngine?: string;
    generatedAt?: string;
  };
};

type HelpPrefs = { furigana: boolean; romaji: boolean; vi: boolean };

function loadHelpPrefs(userId: string): HelpPrefs {
  try {
    const raw = localStorage.getItem(`kaiwa-help:${userId}`);
    if (!raw) return { furigana: true, romaji: false, vi: true };
    return { furigana: true, romaji: false, vi: true, ...JSON.parse(raw) };
  } catch {
    return { furigana: true, romaji: false, vi: true };
  }
}

function saveHelpPrefs(userId: string, prefs: HelpPrefs) {
  localStorage.setItem(`kaiwa-help:${userId}`, JSON.stringify(prefs));
}

type CaptureModePref = "segment" | "continuous";

function loadCaptureModePref(userId: string): CaptureModePref {
  try {
    const raw = localStorage.getItem(`kaiwa-capture-mode:${userId}`);
    if (raw === "continuous" || raw === "segment") return raw;
  } catch {
    /* default */
  }
  return "segment";
}

function saveCaptureModePref(userId: string, mode: CaptureModePref) {
  localStorage.setItem(`kaiwa-capture-mode:${userId}`, mode);
}

function msToInput(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const rem = s % 60;
  const frac = String(ms % 1000).padStart(3, "0");
  return `${String(h).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}:${String(rem).padStart(2, "0")}.${frac}`;
}

function inputToMs(value: string): number | null {
  const m = /^(?:(\d{1,2}):)?(\d{1,2}):(\d{1,2})(?:[.,](\d{1,3}))?$/.exec(
    value.trim(),
  );
  if (!m) return null;
  const h = m[1] ? Number(m[1]) : 0;
  const min = Number(m[2]);
  const sec = Number(m[3]);
  const ms = m[4] ? Number(m[4].padEnd(3, "0")) : 0;
  return ((h * 60 + min) * 60 + sec) * 1000 + ms;
}

export function KaiwaEdit() {
  const { user } = useAuth();
  const { id } = useParams();
  const { data: project, error: projectError, reload: reloadProject } =
    useData<ProjectRow>(id ? `/kaiwa/projects/${id}` : "");
  const { data: speechCap } = useData<{
    transcription: { status: string; messageVi: string };
    translation: { status: string; messageVi: string };
    scriptAlign?: {
      status: string;
      messageVi: string;
      engine: string | null;
    };
  }>("/kaiwa/capabilities/speech");
  const [revision, setRevision] = useState<RevisionView | null>(null);
  const [segments, setSegments] = useState<KaiwaSegment[]>([]);
  const [loadError, setLoadError] = useState("");
  const [message, setMessage] = useState("");
  const [issues, setIssues] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [aligning, setAligning] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [scriptPaste, setScriptPaste] = useState("");
  const [alignConsent, setAlignConsent] = useState(false);
  const [asrConsent, setAsrConsent] = useState(false);
  const [timingFilter, setTimingFilter] = useState<
    "all" | "needs_review" | "unmatched"
  >("all");
  const [undoStack, setUndoStack] = useState<TimingSnapshot[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [realigning, setRealigning] = useState(false);
  const [prefs, setPrefs] = useState<HelpPrefs>(() =>
    loadHelpPrefs(user?.id || "anon"),
  );
  const videoRef = useRef<HTMLVideoElement>(null);
  const playStopRef = useRef(0);
  const overlapSet = useMemo(
    () => new Set(findOverlaps(segments)),
    [segments],
  );
  const timingCounts = useMemo(
    () => countTimingStatuses(segments),
    [segments],
  );

  useEffect(() => {
    if (user?.id) setPrefs(loadHelpPrefs(user.id));
  }, [user?.id]);

  function togglePref(key: keyof HelpPrefs) {
    setPrefs((p) => {
      const next = { ...p, [key]: !p[key] };
      if (user?.id) saveHelpPrefs(user.id, next);
      return next;
    });
  }

  const playbackUrl = project?.proxy_asset_id
    ? `/api/kaiwa/assets/${project.proxy_asset_id}/content`
    : null;

  async function loadRevision() {
    if (!id) return;
    setLoadError("");
    try {
      const data = await api<RevisionView>(
        `/kaiwa/projects/${id}/active-revision`,
      );
      setRevision(data);
      setSegments(data.payload?.segments || []);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Không tải được lời thoại.");
    }
  }

  useEffect(() => {
    loadRevision();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function runTranscription() {
    if (!id || !revision) return;
    if (!asrConsent) {
      setMessage("Hãy xác nhận đã đọc cảnh báo trước khi tạo phụ đề ASR.");
      return;
    }
    setTranscribing(true);
    setMessage("");
    try {
      const result = await post<{
        alignEngine: string;
        revision: {
          id: string;
          version: number;
          state: string;
          payload: { segments: KaiwaSegment[] };
          source_json?: RevisionView["source_json"];
        };
      }>(`/kaiwa/projects/${id}/transcriptions`, {
        expectedRevisionVersion: revision.version,
      });
      setRevision({
        revisionId: result.revision.id,
        version: result.revision.version,
        state: result.revision.state,
        payload: result.revision.payload,
        source_json: result.revision.source_json,
      });
      setSegments(result.revision.payload?.segments || []);
      setMessage(
        `Đã tạo ${result.revision.payload?.segments?.length || 0} đoạn từ video (${result.alignEngine}). ${summarizeAlignResultVi(result.revision.payload?.segments || [])}. Chữ máy có thể sai — hãy kiểm tra kỹ trước khi luyện.`,
      );
      reloadProject();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "ASR thất bại.");
    } finally {
      setTranscribing(false);
    }
  }

  async function runScriptAlign() {
    if (!id || !revision) return;
    const fromPaste = scriptPaste.trim();
    const fromSegments = segments
      .map((s) => s.ja.trim())
      .filter(Boolean)
      .join("\n");
    const text = fromPaste || fromSegments;
    if (!text) {
      setMessage(
        "Hãy dán lời thoại hoặc Áp dụng lời vào danh sách đoạn trước khi đồng bộ.",
      );
      return;
    }
    if (!alignConsent) {
      setMessage("Hãy xác nhận đã đọc lưu ý trước khi đồng bộ.");
      return;
    }
    setAligning(true);
    setMessage("");
    try {
      const result = await post<{
        alignEngine: string;
        revision: {
          id: string;
          version: number;
          state: string;
          payload: { segments: KaiwaSegment[] };
          source_json?: RevisionView["source_json"];
        };
      }>(`/kaiwa/projects/${id}/script-align`, {
        expectedRevisionVersion: revision.version,
        text,
      });
      setRevision({
        revisionId: result.revision.id,
        version: result.revision.version,
        state: result.revision.state,
        payload: result.revision.payload,
        source_json: result.revision.source_json,
      });
      setSegments(result.revision.payload?.segments || []);
      setScriptPaste("");
      setMessage(
        `Đã đồng bộ ${result.revision.payload?.segments?.length || 0} đoạn (${result.alignEngine}). ${summarizeAlignResultVi(result.revision.payload?.segments || [])}. Bản nháp máy — hãy kiểm tra mốc trước khi luyện.`,
      );
      reloadProject();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Đồng bộ thất bại.");
    } finally {
      setAligning(false);
    }
  }

  function applyUntimedScript(text: string, label: string) {
    const parsed = parseUntimedScript(text);
    setIssues(
      parsed.issues.map(
        (i) =>
          `${i.code}: ${i.message}${i.cueIndex != null ? ` (#${i.cueIndex + 1})` : ""}`,
      ),
    );
    if (parsed.segments.length) {
      setSegments(parsed.segments);
      setMessage(
        `Đã nhập ${parsed.segments.length} đoạn từ ${label} (${parsed.sourceFormat}). Mốc thời gian tạm — chỉnh tay hoặc đồng bộ sau. Nhớ lưu nháp.`,
      );
    } else {
      setMessage("Không có đoạn hợp lệ sau khi làm sạch script.");
    }
  }

  async function onImportFile(file: File) {
    const text = await file.text();
    const name = file.name.toLowerCase();
    const isPlainScript =
      name.endsWith(".txt") ||
      name.endsWith(".md") ||
      file.type === "text/plain" ||
      file.type === "text/markdown";

    if (isPlainScript) {
      applyUntimedScript(text, file.name || ".txt");
      return;
    }

    const durationMs = videoRef.current?.duration
      ? Math.round(videoRef.current.duration * 1000)
      : null;
    const parsed = parseSubtitles(text, { durationMs });
    setIssues(
      parsed.issues.map(
        (i) => `${i.code}: ${i.message}${i.cueIndex != null ? ` (#${i.cueIndex + 1})` : ""}`,
      ),
    );
    if (parsed.segments.length) {
      setSegments(parsed.segments);
      setMessage(
        `Đã nhập ${parsed.segments.length} đoạn (${parsed.format.toUpperCase()}). Nhớ lưu nháp.`,
      );
      return;
    }

    // Timed parse failed — try untimed (e.g. SRT with zero/bogus times).
    const untimed = parseUntimedScript(text);
    if (untimed.segments.length) {
      applyUntimedScript(text, file.name || "script");
      return;
    }
    setMessage("Không có đoạn hợp lệ sau khi phân tích.");
  }

  function updateSeg(index: number, patch: Partial<KaiwaSegment>) {
    setSegments((prev) => {
      const timingTouch =
        patch.startMs != null ||
        patch.endMs != null ||
        patch.timingLocked != null;
      if (timingTouch) {
        setUndoStack((stack) => pushTimingUndo(stack, prev));
      }
      return prev.map((s, i) => {
        if (i !== index) return s;
        let next = { ...s, ...patch };
        if (patch.ja != null && patch.ja !== s.ja) {
          const stale = markReadingStaleOnJaChange(s.ja, patch.ja, s.tokens);
          next = {
            ...next,
            tokens: stale.tokens,
            readingStale: stale.readingStale || next.readingStale,
          };
        }
        if (patch.startMs != null || patch.endMs != null) {
          const start = patch.startMs ?? s.startMs;
          const end = patch.endMs ?? s.endMs;
          next = applySegmentTiming(
            { ...next, timingLocked: s.timingLocked },
            start,
            end,
          );
          if (s.timingLocked) next = { ...next, timingLocked: true };
        }
        return next;
      });
    });
  }

  function undoTiming() {
    setUndoStack((stack) => {
      const { stack: next, restored } = popTimingUndo(stack);
      if (restored) setSegments(restored);
      return next;
    });
  }

  function setTimingFromWave(index: number, startMs: number, endMs: number) {
    setSegments((prev) => {
      const cur = prev[index];
      if (!cur || cur.timingLocked) return prev;
      setUndoStack((stack) => pushTimingUndo(stack, prev));
      const prevNeighbor = index > 0 ? prev[index - 1] : null;
      const nextNeighbor =
        index < prev.length - 1 ? prev[index + 1] : null;
      const minStart = prevNeighbor ? prevNeighbor.startMs : 0;
      const maxEnd = nextNeighbor ? nextNeighbor.endMs : startMs + 600_000;
      // Soft clamp: don't require non-overlap strictly, but keep positive window
      void minStart;
      void maxEnd;
      return prev.map((s, i) =>
        i === index ? applySegmentTiming(s, startMs, endMs) : s,
      );
    });
  }

  function toggleLockAt(index: number) {
    setSegments((prev) => {
      setUndoStack((stack) => pushTimingUndo(stack, prev));
      return prev.map((s, i) =>
        i === index ? toggleTimingLock(s) : s,
      );
    });
  }

  function toggleSelectId(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function realignKeepingLocks(
    range: { rangeStart: number; rangeEnd: number },
    label: string,
  ) {
    if (!id || !revision) return;
    if (!alignConsent) {
      setMessage("Hãy xác nhận đã đọc lưu ý trước khi căn lại.");
      return;
    }
    const text = segments
      .map((s) => s.ja.trim())
      .filter(Boolean)
      .join("\n");
    if (!text) {
      setMessage("Không có lời để căn lại.");
      return;
    }
    setRealigning(true);
    setMessage("");
    try {
      const result = await post<{
        alignEngine: string;
        revision: {
          id: string;
          version: number;
          state: string;
          payload: { segments: KaiwaSegment[] };
          source_json?: RevisionView["source_json"];
        };
      }>(`/kaiwa/projects/${id}/script-align`, {
        expectedRevisionVersion: revision.version,
        text,
        anchors: anchorsFromLocks(segments),
      });
      const aligned = result.revision.payload?.segments || [];
      const before = segments;
      setUndoStack((stack) => pushTimingUndo(stack, before));
      const merged = mergeRealignPreservingLocks(before, aligned, range);
      const saved = await api<{ id?: string; version: number }>(
        `/kaiwa/projects/${id}/draft`,
        {
          method: "PUT",
          body: JSON.stringify({
            expectedRevisionVersion: result.revision.version,
            payload: { segments: merged.segments },
          }),
        },
      );
      setSegments(merged.segments);
      setRevision({
        revisionId: saved.id || result.revision.id,
        version: saved.version ?? result.revision.version,
        state: result.revision.state,
        payload: { segments: merged.segments },
        source_json: result.revision.source_json,
      });
      setMessage(
        `${label}: đổi ${merged.changedIds.length} đoạn, giữ ${merged.preservedIds.length} (khóa/ngoài vùng). ${summarizeAlignResultVi(merged.segments)}. Đã ghi nháp.`,
      );
      reloadProject();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Căn lại thất bại.");
    } finally {
      setRealigning(false);
    }
  }

  /** Play segment window ± context; unmatched uses neighboring timed lines. */
  function playSegWithContext(index: number) {
    const v = videoRef.current;
    if (!v || !playbackUrl) {
      setMessage("Cần video đã chuẩn bị để nghe ngữ cảnh.");
      return;
    }
    const CONTEXT_MS = 800;
    const seg = segments[index];
    if (!seg) return;
    let start: number;
    let end: number;
    if (isSpeakableSegment(seg)) {
      start = Math.max(0, seg.startMs - CONTEXT_MS);
      end = seg.endMs + CONTEXT_MS;
    } else {
      const prev = [...segments.slice(0, index)]
        .reverse()
        .find((s) => isSpeakableSegment(s));
      const next = segments.slice(index + 1).find((s) => isSpeakableSegment(s));
      if (prev && next) {
        start = Math.max(0, prev.endMs - CONTEXT_MS);
        end = next.startMs + CONTEXT_MS;
      } else if (prev) {
        start = Math.max(0, prev.endMs - CONTEXT_MS);
        end = prev.endMs + 2500;
      } else if (next) {
        start = Math.max(0, next.startMs - 2500);
        end = next.startMs + CONTEXT_MS;
      } else {
        setMessage("Không có đoạn lân cận có mốc để nghe ngữ cảnh.");
        return;
      }
    }
    window.clearTimeout(playStopRef.current);
    v.currentTime = start / 1000;
    void v.play().catch(() => setMessage("Không phát được video."));
    const dur = Math.max(200, end - start);
    playStopRef.current = window.setTimeout(() => {
      v.pause();
    }, dur);
  }

  function setTokenLine(index: number, kind: "reading" | "romaji", value: string) {
    setSegments((prev) =>
      prev.map((s, i) => {
        if (i !== index) return s;
        const surface = s.ja || "·";
        const reading =
          kind === "reading"
            ? value
            : s.tokens?.[0]?.reading || value;
        const token: KaiwaRubyToken = {
          surface,
          reading,
          romaji:
            kind === "romaji"
              ? value
              : readingToRomaji(reading, { surface }),
          manual: true,
        };
        return {
          ...s,
          tokens: tokensWithRomaji([token]),
          readingStale: false,
        };
      }),
    );
  }

  function addManual() {
    const last = segments[segments.length - 1];
    const startMs = last ? last.endMs : 0;
    setSegments((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        startMs,
        endMs: startMs + 1000,
        ja: "",
        reviewState: "draft",
        assessable: true,
      },
    ]);
  }

  function doSplit(index: number) {
    const seg = segments[index];
    const mid = Math.round((seg.startMs + seg.endMs) / 2);
    const parts = splitSegment(seg, mid);
    if (!parts) return;
    setSegments((prev) => [
      ...prev.slice(0, index),
      parts[0],
      parts[1],
      ...prev.slice(index + 1),
    ]);
  }

  function doMerge(index: number) {
    if (index >= segments.length - 1) return;
    const merged = mergeSegments(segments[index], segments[index + 1]);
    if (!merged) {
      setMessage("Chỉ gộp được hai đoạn liền / chồng nhẹ.");
      return;
    }
    setSegments((prev) => [
      ...prev.slice(0, index),
      merged,
      ...prev.slice(index + 2),
    ]);
  }

  async function saveDraft() {
    if (!id || !revision) return;
    setSaving(true);
    setMessage("");
    try {
      const invalid = segments.find((s) => s.endMs <= s.startMs || !s.ja.trim());
      if (invalid) {
        setMessage("Mỗi đoạn cần end>start và có nội dung tiếng Nhật.");
        return;
      }
      const saved = await api<RevisionView & { version: number }>(
        `/kaiwa/projects/${id}/draft`,
        {
          method: "PUT",
          body: JSON.stringify({
            expectedRevisionVersion: revision.version,
            payload: { segments },
          }),
        },
      );
      setRevision((r) =>
        r
          ? {
              ...r,
              version: saved.version ?? r.version,
              payload: { segments },
            }
          : r,
      );
      setMessage("Đã lưu nháp.");
      reloadProject();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Lưu thất bại.");
    } finally {
      setSaving(false);
    }
  }

  async function publish() {
    if (!id || !revision) return;
    setSaving(true);
    try {
      await post(`/kaiwa/projects/${id}/revisions`, {
        expectedRevisionVersion: revision.version,
      });
      setMessage("Đã chốt bản lời thoại (reviewed).");
      await loadRevision();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Chốt thất bại.");
    } finally {
      setSaving(false);
    }
  }

  if (!id) return <ErrorState message="Thiếu mã dự án." />;
  if (projectError)
    return <ErrorState message={projectError} retry={reloadProject} />;
  if (!project) return <Loading />;
  if (loadError) return <ErrorState message={loadError} retry={loadRevision} />;
  if (!revision) return <Loading />;

  const hasScriptForAlign =
    Boolean(scriptPaste.trim()) ||
    segments.some((s) => Boolean(s.ja.trim()));
  const syncDisabledReason = !playbackUrl
    ? "Cần video đã chuẩn bị (prepare media)."
    : !hasScriptForAlign
      ? "Cần dán lời hoặc đã có đoạn JA trong danh sách (sau «Áp dụng lời đã dán» cũng được)."
      : !alignConsent
        ? "Hãy tích ô xác nhận bên dưới."
        : aligning
          ? "Đang đồng bộ…"
          : null;

  return (
    <div className="kaiwa-page">
      <PageHead
        title={`Soạn phụ đề · ${project.title}`}
        description="Nhập SRT/VTT, dán lời không thời gian, hoặc gõ tay. Markup HTML bị gỡ. Overlap được đánh dấu."
      >
        <Link className="btn secondary" to={`/kaiwa/projects/${project.id}`}>
          Về dự án
        </Link>
      </PageHead>

      {speechCap?.transcription.status === "not_configured" && (
        <Status tone="info">
          {speechCap.transcription.messageVi}{" "}
          {speechCap.translation.messageVi}
        </Status>
      )}

      {revision?.source_json?.source === "script_align" && (
        <Status tone="info">
          Bản nháp máy tạo — hãy kiểm tra mốc thời gian trước khi luyện.
          {revision.source_json.alignEngine
            ? ` (${revision.source_json.alignEngine})`
            : ""}
        </Status>
      )}

      {revision?.source_json?.source === "asr" && (
        <Status tone="info">
          Bản nháp ASR từ video — chữ và mốc đều có thể sai. Hãy sửa trước khi
          luyện.
          {revision.source_json.alignEngine
            ? ` (${revision.source_json.alignEngine})`
            : ""}
        </Status>
      )}

      {playbackUrl && (
        <div className="panel kaiwa-player">
          <video
            ref={videoRef}
            controls
            playsInline
            preload="metadata"
            src={playbackUrl}
          />
        </div>
      )}

      <div className="panel kaiwa-upload">
        <div className="kaiwa-toggles" role="group" aria-label="Lớp trợ giúp">
          <button
            type="button"
            className={prefs.furigana ? "btn" : "btn secondary"}
            onClick={() => togglePref("furigana")}
          >
            Furigana {prefs.furigana ? "bật" : "tắt"}
          </button>
          <button
            type="button"
            className={prefs.romaji ? "btn" : "btn secondary"}
            onClick={() => togglePref("romaji")}
          >
            Romaji {prefs.romaji ? "bật" : "tắt"}
          </button>
          <button
            type="button"
            className={prefs.vi ? "btn" : "btn secondary"}
            onClick={() => togglePref("vi")}
          >
            Việt {prefs.vi ? "bật" : "tắt"}
          </button>
        </div>
        <label className="kaiwa-field">
          Nhập SRT / VTT (có thời gian)
          <input
            type="file"
            accept=".srt,.vtt,text/vtt,application/x-subrip"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onImportFile(f);
              e.target.value = "";
            }}
          />
        </label>
        <label className="kaiwa-field">
          Lời thoại không thời gian (.txt / .md)
          <input
            type="file"
            accept=".txt,.md,text/plain,text/markdown"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onImportFile(f);
              e.target.value = "";
            }}
          />
        </label>
        <label className="kaiwa-field">
          Dán lời thoại (mỗi dòng / đoạn một câu)
          <textarea
            className="kaiwa-script-paste"
            rows={5}
            value={scriptPaste}
            placeholder={"こんにちは。\n今日はいい天気ですね。"}
            onChange={(e) => setScriptPaste(e.target.value)}
          />
        </label>
        <div className="kaiwa-actions">
          <button
            type="button"
            className="btn secondary"
            disabled={!scriptPaste.trim()}
            onClick={() => {
              applyUntimedScript(scriptPaste, "paste");
              setScriptPaste("");
            }}
          >
            Áp dụng lời đã dán
          </button>
        </div>

        <div className="panel kaiwa-script-align">
          <h3 className="kaiwa-subhead">Đồng bộ lời thoại với video</h3>
          {speechCap?.scriptAlign?.status === "ready" ||
          speechCap?.scriptAlign?.status === "degraded" ? (
            <>
              <p className="kaiwa-muted">
                {speechCap.scriptAlign.messageVi} Dùng lời trong ô dán{" "}
                <strong>hoặc</strong> các đoạn JA đã có trong danh sách.
              </p>
              <label className="kaiwa-check">
                <input
                  type="checkbox"
                  checked={alignConsent}
                  onChange={(e) => setAlignConsent(e.target.checked)}
                />
                <span>
                  Tôi sẽ kiểm tra mốc thời gian sau khi máy gán (audio xử lý cục
                  bộ khi dùng Whisper; không tự publish).
                </span>
              </label>
              <button
                type="button"
                className="btn"
                disabled={
                  aligning ||
                  !hasScriptForAlign ||
                  !alignConsent ||
                  !playbackUrl
                }
                onClick={() => void runScriptAlign()}
              >
                {aligning
                  ? "Đang đồng bộ…"
                  : "Đồng bộ lời thoại với video (tự gán thời gian)"}
              </button>
              {syncDisabledReason && (
                <Status tone="info">{syncDisabledReason}</Status>
              )}
            </>
          ) : (
            <Status tone="info">
              {speechCap?.scriptAlign?.messageVi ||
                "Chưa cấu hình tự động. Hãy nhập SRT/VTT hoặc soạn tay."}
            </Status>
          )}
        </div>

        <div className="panel kaiwa-script-align">
          <h3 className="kaiwa-subhead">Tự tạo phụ đề từ video (ASR)</h3>
          {speechCap?.transcription?.status === "ready" ? (
            <>
              <p className="kaiwa-muted">{speechCap.transcription.messageVi}</p>
              <label className="kaiwa-check">
                <input
                  type="checkbox"
                  checked={asrConsent}
                  onChange={(e) => setAsrConsent(e.target.checked)}
                />
                Tôi hiểu chữ máy có thể sai và sẽ sửa trước khi luyện (không tự
                publish).
              </label>
              <button
                type="button"
                className="btn"
                disabled={
                  transcribing || !asrConsent || !revision || !playbackUrl
                }
                onClick={() => void runTranscription()}
              >
                {transcribing
                  ? "Đang tạo phụ đề…"
                  : "Tự tạo phụ đề từ video (ASR)"}
              </button>
              {!playbackUrl && (
                <Status tone="info">
                  Cần video đã chuẩn bị (prepare media) trước khi ASR.
                </Status>
              )}
            </>
          ) : (
            <Status tone="info">
              {speechCap?.transcription?.messageVi ||
                "Chưa cấu hình ASR. Hãy nhập SRT/VTT hoặc soạn tay."}
            </Status>
          )}
        </div>

        {issues.length > 0 && (
          <ul className="kaiwa-issues">
            {issues.slice(0, 12).map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        )}
        <div className="kaiwa-actions">
          <button type="button" className="btn secondary" onClick={addManual}>
            Thêm đoạn
          </button>
          <button
            type="button"
            className="btn"
            disabled={saving}
            onClick={() => void saveDraft()}
          >
            Lưu nháp
          </button>
          <button
            type="button"
            className="btn secondary"
            disabled={saving}
            onClick={() => void publish()}
          >
            Chốt bản (publish)
          </button>
        </div>
        {message && <Status tone="info">{message}</Status>}
      </div>

      {(timingCounts.unmatched > 0 || timingCounts.needsReview > 0) && (
        <Status tone="info">{summarizeAlignResultVi(segments)}</Status>
      )}

      <div className="kaiwa-seg-filters" role="group" aria-label="Lọc theo trạng thái mốc">
        <button
          type="button"
          className={timingFilter === "all" ? "btn" : "btn secondary"}
          onClick={() => setTimingFilter("all")}
        >
          Tất cả ({timingCounts.total})
        </button>
        <button
          type="button"
          className={timingFilter === "needs_review" ? "btn" : "btn secondary"}
          onClick={() => setTimingFilter("needs_review")}
        >
          Cần kiểm tra ({timingCounts.needsReview})
        </button>
        <button
          type="button"
          className={timingFilter === "unmatched" ? "btn" : "btn secondary"}
          onClick={() => setTimingFilter("unmatched")}
        >
          Chưa khớp ({timingCounts.unmatched})
        </button>
      </div>

      <div className="kaiwa-actions" role="group" aria-label="Sửa mốc">
        <button
          type="button"
          className="btn secondary"
          disabled={undoStack.length === 0}
          onClick={undoTiming}
        >
          Hoàn tác mốc ({undoStack.length})
        </button>
        <button
          type="button"
          className="btn secondary"
          disabled={
            realigning || aligning || selectedIds.size === 0 || !alignConsent
          }
          onClick={() => {
            const indices = segments
              .map((s, i) => (selectedIds.has(s.id) ? i : -1))
              .filter((i) => i >= 0);
            if (!indices.length) return;
            void realignKeepingLocks(
              {
                rangeStart: Math.min(...indices),
                rangeEnd: Math.max(...indices) + 1,
              },
              "Căn lại vùng đã chọn",
            );
          }}
        >
          {realigning ? "Đang căn…" : "Căn lại đoạn đã chọn"}
        </button>
        <button
          type="button"
          className="btn secondary"
          disabled={realigning || aligning || !alignConsent}
          onClick={() => {
            const focus =
              segments.findIndex((s) => selectedIds.has(s.id)) >= 0
                ? segments.findIndex((s) => selectedIds.has(s.id))
                : 0;
            void realignKeepingLocks(
              rangeBetweenLocks(segments, focus),
              "Căn giữa hai khóa",
            );
          }}
        >
          Căn giữa hai khóa
        </button>
      </div>
      <p className="kaiwa-privacy-note">
        Khóa mốc để realign không ghi đè. Kéo waveform để chỉnh tay — hoàn tác
        chỉ cho mốc thời gian.
      </p>

      <ol className="kaiwa-segments">
        {segments.map((seg, index) => {
          const unmatched = isUnmatchedSegment(seg);
          const needsReview = isNeedsReviewSegment(seg);
          if (timingFilter === "unmatched" && !unmatched) return null;
          if (timingFilter === "needs_review" && !needsReview) return null;
          const viewPad = 1500;
          const viewStartMs = Math.max(0, seg.startMs - viewPad);
          const viewEndMs = Math.max(seg.endMs + viewPad, viewStartMs + 2000);
          return (
          <li
            key={seg.id}
            className={
              overlapSet.has(index)
                ? "kaiwa-seg overlap"
                : unmatched
                  ? "kaiwa-seg unmatched"
                  : seg.timingLocked
                    ? "kaiwa-seg locked"
                    : needsReview
                      ? "kaiwa-seg uncertain"
                      : "kaiwa-seg"
            }
          >
            {unmatched ? (
              <Status tone="error">
                Chưa tìm được vị trí trong audio — giữ lời; hãy chỉnh tay (không
                dùng mốc 0 giả để luyện).
              </Status>
            ) : needsReview ? (
              <Status tone="info">
                Đoạn này khớp chưa chắc
                {seg.timingReason ? ` (${seg.timingReason})` : ""} — nên sửa tay.
              </Status>
            ) : null}
            <div className="kaiwa-seg-times">
              <label className="kaiwa-check kaiwa-seg-select">
                <input
                  type="checkbox"
                  checked={selectedIds.has(seg.id)}
                  onChange={() => toggleSelectId(seg.id)}
                  aria-label={`Chọn đoạn ${index + 1}`}
                />
                Chọn
              </label>
              <button
                type="button"
                className={seg.timingLocked ? "btn" : "btn secondary"}
                onClick={() => toggleLockAt(index)}
                aria-pressed={Boolean(seg.timingLocked)}
              >
                {seg.timingLocked ? "Đã khóa" : "Khóa mốc"}
              </button>
              <button
                type="button"
                className="btn secondary"
                disabled={!playbackUrl}
                onClick={() => playSegWithContext(index)}
              >
                Nghe ± ngữ cảnh
              </button>
              <button
                type="button"
                className="btn secondary"
                disabled={!playbackUrl || unmatched}
                onClick={() => {
                  if (videoRef.current)
                    videoRef.current.currentTime = seg.startMs / 1000;
                }}
              >
                Seek
              </button>
              <input
                aria-label="Bắt đầu"
                value={msToInput(seg.startMs)}
                disabled={Boolean(seg.timingLocked)}
                onChange={(e) => {
                  const v = inputToMs(e.target.value);
                  if (v != null) updateSeg(index, { startMs: v });
                }}
              />
              <span>→</span>
              <input
                aria-label="Kết thúc"
                value={msToInput(seg.endMs)}
                disabled={Boolean(seg.timingLocked)}
                onChange={(e) => {
                  const v = inputToMs(e.target.value);
                  if (v != null) updateSeg(index, { endMs: v });
                }}
              />
            </div>
            {!unmatched && (
              <TimingWaveform
                audioUrl={playbackUrl}
                startMs={seg.startMs}
                endMs={seg.endMs}
                viewStartMs={viewStartMs}
                viewEndMs={viewEndMs}
                locked={Boolean(seg.timingLocked)}
                onChange={(s, e) => setTimingFromWave(index, s, e)}
                onPreview={(ms) => {
                  if (videoRef.current)
                    videoRef.current.currentTime = ms / 1000;
                }}
              />
            )}
            <textarea
              aria-label="Tiếng Nhật"
              rows={2}
              value={seg.ja}
              onChange={(e) => updateSeg(index, { ja: e.target.value })}
              lang="ja"
            />
            {seg.readingStale && (
              <Status tone="info">
                Câu Nhật đã đổi — hãy duyệt lại furigana/romaji.
              </Status>
            )}
            <div
              className={`kaiwa-ruby-preview ${prefs.furigana ? "ruby-on" : "ruby-off"}`}
              lang="ja"
            >
              {(seg.tokens && seg.tokens.length > 0
                ? seg.tokens
                : [{ surface: seg.ja || "…" }]
              ).map((t, ti) =>
                t.reading && prefs.furigana ? (
                  <ruby key={ti}>
                    {t.surface}
                    <rt>{t.reading}</rt>
                  </ruby>
                ) : (
                  <span key={ti}>{t.surface}</span>
                ),
              )}
            </div>
            {prefs.romaji && (
              <p className="kaiwa-romaji" lang="en">
                {seg.tokens?.map((t) => t.romaji || "").filter(Boolean).join(" ") ||
                  "— chưa có romaji —"}
              </p>
            )}
            <label className="kaiwa-field">
              Furigana (hiragana)
              <input
                value={seg.tokens?.[0]?.reading || ""}
                onChange={(e) => setTokenLine(index, "reading", e.target.value)}
                lang="ja"
                placeholder="vd. がっこう"
              />
            </label>
            <label className="kaiwa-field">
              Romaji (Hepburn)
              <input
                value={seg.tokens?.[0]?.romaji || ""}
                onChange={(e) => setTokenLine(index, "romaji", e.target.value)}
                placeholder="vd. gakkou / wa"
              />
            </label>
            {prefs.vi && (
              <textarea
                aria-label="Bản dịch Việt"
                rows={2}
                value={seg.vi || ""}
                onChange={(e) => updateSeg(index, { vi: e.target.value })}
                placeholder="Dịch Việt"
              />
            )}
            <div className="kaiwa-actions">
              <button
                type="button"
                className="btn secondary"
                onClick={() => doSplit(index)}
              >
                Tách
              </button>
              <button
                type="button"
                className="btn secondary"
                onClick={() => doMerge(index)}
                disabled={index >= segments.length - 1}
              >
                Gộp với sau
              </button>
              <button
                type="button"
                className="btn secondary"
                onClick={() =>
                  setSegments((prev) => prev.filter((_, i) => i !== index))
                }
              >
                Xóa
              </button>
            </div>
          </li>
          );
        })}
      </ol>
    </div>
  );
}

type MixPrefs = {
  originalGain: number;
  learnerGain: number;
  keep?: boolean;
  updatedAt?: string;
};

type AttemptDetail = {
  id: string;
  project_id: string;
  revision_id: string;
  projectTitle: string;
  proxyAssetId: string | null;
  audio_asset_id: string | null;
  record_state: string;
  completion: string | null;
  duration_ms: number | null;
  created_at: string;
  device_json: string | null;
  clocks_json?: string | null;
  assessableReady: boolean;
  assessableMessage: string | null;
  revision: {
    id: string;
    version: number;
    state: string;
    payload: { segments: KaiwaSegment[] };
  };
};

type AttemptListRow = {
  id: string;
  project_id: string;
  revision_id: string;
  audio_asset_id: string | null;
  record_state: string;
  completion: string | null;
  duration_ms: number | null;
  created_at: string;
  finalized_at: string | null;
  device_json: string | null;
};

function parseMix(deviceJson: string | null | undefined): MixPrefs {
  try {
    const device = JSON.parse(deviceJson || "{}") as { mix?: MixPrefs };
    const mix = device.mix;
    return {
      originalGain:
        typeof mix?.originalGain === "number" ? mix.originalGain : 0.5,
      learnerGain:
        typeof mix?.learnerGain === "number" ? mix.learnerGain : 1,
      keep: Boolean(mix?.keep),
      updatedAt: mix?.updatedAt,
    };
  } catch {
    return { originalGain: 0.5, learnerGain: 1, keep: false };
  }
}

export function KaiwaPrep() {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: project, error: projectError, reload } = useData<ProjectRow>(
    id ? `/kaiwa/projects/${id}` : "",
  );
  const [revision, setRevision] = useState<RevisionView | null>(null);
  const [prefs, setPrefs] = useState<HelpPrefs>(() =>
    loadHelpPrefs(user?.id || "anon"),
  );
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (user?.id) setPrefs(loadHelpPrefs(user.id));
  }, [user?.id]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await api<{
          revisionId: string;
          version: number;
          state: string;
          payload: { segments: KaiwaSegment[] };
        }>(`/kaiwa/projects/${id}/active-revision`);
        if (!cancelled) {
          setRevision({
            revisionId: data.revisionId,
            version: data.version,
            state: data.state,
            payload: data.payload,
          });
        }
      } catch (e) {
        if (!cancelled)
          setMessage(e instanceof Error ? e.message : "Lỗi tải lời thoại.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  function togglePref(key: keyof HelpPrefs) {
    setPrefs((p) => {
      const next = { ...p, [key]: !p[key] };
      if (user?.id) saveHelpPrefs(user.id, next);
      return next;
    });
  }

  const segments = revision?.payload.segments || [];
  const playbackUrl = project?.proxy_asset_id
    ? `/api/kaiwa/assets/${project.proxy_asset_id}/content`
    : null;

  async function startPractice() {
    if (!id || !revision) return;
    setBusy(true);
    setMessage("");
    try {
      const attempt = await post<AttemptDetail>(
        `/kaiwa/projects/${id}/start-practice`,
        {
          publish: true,
          expectedRevisionVersion: revision.version,
          captureMode: loadCaptureModePref(user?.id || "anon"),
        },
      );
      navigate(`/kaiwa/projects/${id}/studio?attempt=${attempt.id}`, {
        replace: true,
      });
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Không bắt đầu được lần thu.");
    } finally {
      setBusy(false);
    }
  }

  if (!id) return <ErrorState message="Thiếu mã dự án." />;
  if (projectError) return <ErrorState message={projectError} retry={reload} />;
  if (!project || !revision) return <Loading />;

  return (
    <div className="kaiwa-page">
      <PageHead
        title={`Chuẩn bị · ${project.title}`}
        description="Xem lời thoại đồng bộ với video. Ba lớp trợ giúp độc lập."
      >
        <Link className="btn secondary" to={`/kaiwa/projects/${id}`}>
          Về dự án
        </Link>
      </PageHead>

      <div className="kaiwa-toggles" role="group" aria-label="Lớp trợ giúp">
        <button
          type="button"
          className={prefs.furigana ? "btn" : "btn secondary"}
          onClick={() => togglePref("furigana")}
        >
          Furigana {prefs.furigana ? "bật" : "tắt"}
        </button>
        <button
          type="button"
          className={prefs.romaji ? "btn" : "btn secondary"}
          onClick={() => togglePref("romaji")}
        >
          Romaji {prefs.romaji ? "bật" : "tắt"}
        </button>
        <button
          type="button"
          className={prefs.vi ? "btn" : "btn secondary"}
          onClick={() => togglePref("vi")}
        >
          Việt {prefs.vi ? "bật" : "tắt"}
        </button>
      </div>

      {playbackUrl && (
        <div className="panel kaiwa-player">
          <video
            ref={videoRef}
            controls
            playsInline
            preload="metadata"
            src={playbackUrl}
          />
        </div>
      )}

      {segments.length === 0 ? (
        <div className="panel">
          <Status tone="info">
            Chưa có lời thoại — vẫn thu được, nhưng chưa đủ chuẩn để chấm phát âm.
          </Status>
          <Link className="btn secondary" to={`/kaiwa/projects/${id}/edit`}>
            Thêm phụ đề
          </Link>
        </div>
      ) : (
        <ol className="kaiwa-segments kaiwa-prep-list">
          {segments.map((seg, index) => (
            <li
              key={seg.id}
              className={
                index === activeIdx ? "kaiwa-seg kaiwa-seg-active" : "kaiwa-seg"
              }
            >
              <button
                type="button"
                className="kaiwa-seg-hit"
                onClick={() => {
                  setActiveIdx(index);
                  if (videoRef.current)
                    videoRef.current.currentTime = seg.startMs / 1000;
                }}
              >
                <span className="kaiwa-seg-time">{msToInput(seg.startMs)}</span>
                <ScriptHelpLayers seg={seg} prefs={prefs} compact />
              </button>
            </li>
          ))}
        </ol>
      )}

      {message && <Status>{message}</Status>}
      <div className="kaiwa-actions">
        <button
          type="button"
          className="btn"
          disabled={busy}
          onClick={() => void startPractice()}
        >
          {busy ? "Đang tạo lần thu…" : "Chốt & bắt đầu luyện"}
        </button>
      </div>
    </div>
  );
}

export function KaiwaStudio() {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const attemptId = new URLSearchParams(useLocation().search).get("attempt");
  const { data, error, reload } = useData<AttemptDetail>(
    attemptId ? `/kaiwa/attempts/${attemptId}` : "",
  );
  const [micReady, setMicReady] = useState<{
    deviceId: string;
    label: string;
  } | null>(null);
  const [mode, setMode] = useState<CaptureModePref>(() =>
    loadCaptureModePref(user?.id || "anon"),
  );
  const [prefs, setPrefs] = useState<HelpPrefs>(() =>
    loadHelpPrefs(user?.id || "anon"),
  );

  useEffect(() => {
    if (user?.id) {
      setPrefs(loadHelpPrefs(user.id));
      setMode(loadCaptureModePref(user.id));
    }
  }, [user?.id]);

  useEffect(() => {
    if (!data?.device_json) return;
    try {
      const device = JSON.parse(data.device_json) as { captureMode?: string };
      if (device.captureMode === "continuous" || device.captureMode === "segment")
        setMode(device.captureMode);
    } catch {
      /* keep preference */
    }
  }, [data?.device_json]);

  if (!id) return <ErrorState message="Thiếu mã dự án." />;
  if (!attemptId)
    return (
      <ErrorState
        message="Thiếu lần thu. Hãy bắt đầu từ màn chuẩn bị."
        retry={() => {
          window.location.href = `/kaiwa/projects/${id}/prep`;
        }}
      />
    );
  if (error) return <ErrorState message={error} retry={reload} />;
  if (!data) return <Loading />;

  const segs = data.revision.payload.segments;
  const playbackUrl = data.proxyAssetId
    ? `/api/kaiwa/assets/${data.proxyAssetId}/content`
    : null;

  async function switchMode(next: CaptureModePref) {
    if (!attemptId) return;
    setMode(next);
    saveCaptureModePref(user?.id || "anon", next);
    try {
      await api(`/kaiwa/attempts/${attemptId}/capture-mode`, {
        method: "PATCH",
        body: JSON.stringify({ captureMode: next }),
      });
    } catch {
      /* UI still switches; server may reject if finalized */
    }
  }

  return (
    <div className="kaiwa-page">
      <PageHead
        title={`Phòng thu · ${data.projectTitle}`}
        description={`Snapshot revision v${data.revision.version} (${data.revision.state}) — bất biến với lần thu này.`}
      >
        <Link className="btn secondary" to={`/kaiwa/projects/${id}/prep`}>
          Về chuẩn bị
        </Link>
      </PageHead>

      {!data.assessableReady && data.assessableMessage && (
        <Status tone="info">{data.assessableMessage}</Status>
      )}

      <div className="panel kaiwa-mode-picker">
        <p>
          <strong>Chế độ thu</strong>
        </p>
        <div className="kaiwa-actions">
          <button
            type="button"
            className={mode === "segment" ? "btn" : "btn secondary"}
            onClick={() => void switchMode("segment")}
          >
            Theo đoạn — dễ nói theo lời (khuyến nghị)
          </button>
          <button
            type="button"
            className={mode === "continuous" ? "btn" : "btn secondary"}
            onClick={() => void switchMode("continuous")}
          >
            Liên tục — thu cả video một lần (nâng cao)
          </button>
        </div>
        <p className="kaiwa-privacy-note">
          {mode === "continuous"
            ? "Chế độ nâng cao: vẫn hiện lời hiện tại trên video; không dừng từng câu. Bản ghép từ từng đoạn không được gọi là thu liên tục."
            : "Mặc định theo đoạn. Lựa chọn được nhớ trên thiết bị này. Bản ghép từ từng đoạn không được gọi là thu liên tục."}
        </p>
      </div>

      <MicPreflightPanel onReady={setMicReady} />

      {micReady && attemptId && mode === "segment" && (
        <SegmentStudio
          attemptId={attemptId}
          videoUrl={playbackUrl}
          segments={segs}
          deviceId={micReady.deviceId}
          prefs={prefs}
          onFinished={() => navigate(`/kaiwa/attempts/${attemptId}`)}
        />
      )}

      {micReady && attemptId && mode === "continuous" && (
        <ContinuousRecorder
          attemptId={attemptId}
          videoUrl={playbackUrl}
          segments={segs}
          prefs={prefs}
          deviceId={micReady.deviceId}
          onSaved={() => navigate(`/kaiwa/attempts/${attemptId}`)}
        />
      )}

      {micReady && !attemptId && (
        <Status tone="success">
          Micro sẵn sàng: {micReady.label}.
        </Status>
      )}

      {mode === "continuous" && playbackUrl && (
        <div className="panel">
          <p>
            Lời thoại ghim: <strong>{segs.length}</strong> đoạn · revision{" "}
            <code>{data.revision_id.slice(0, 8)}</code>
          </p>
          <p className="kaiwa-privacy-note">
            Overlay trên video hiện câu hiện tại + câu kế theo đồng hồ phát. Danh
            sách dưới chỉ là phụ.
          </p>
          <ol className="kaiwa-segments">
            {segs.map((seg) => (
              <li key={seg.id} className="kaiwa-seg">
                <small>
                  {msToInput(seg.startMs)} → {msToInput(seg.endMs)}
                </small>
                <div lang="ja">{seg.ja}</div>
                {seg.vi ? <div>{seg.vi}</div> : null}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

export function KaiwaReview() {
  const { id: attemptId } = useParams();
  const navigate = useNavigate();
  const { data, error, reload } = useData<AttemptDetail>(
    attemptId ? `/kaiwa/attempts/${attemptId}` : "",
  );
  const [mix, setMix] = useState<MixPrefs>({
    originalGain: 0.5,
    learnerGain: 1,
    keep: false,
  });
  const [saveNote, setSaveNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [rerecording, setRerecording] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportHref, setExportHref] = useState<string | null>(null);
  const [qualityNote, setQualityNote] = useState("");
  const [checkingQuality, setCheckingQuality] = useState(false);
  const [assessing, setAssessing] = useState(false);
  const [assessment, setAssessment] = useState<{
    status: string;
    messageVi: string;
    overallScore: null;
    coverage: {
      plannedSegments: number;
      assessableSegments: number;
      assessableRatio: number | null;
    };
    priorities: Array<{
      segmentId: string | null;
      kind: string;
      messageVi: string;
    }>;
    segments: Array<{
      segmentId: string;
      status: string;
      reason: string | null;
      listen: { startMs: number | null; endMs: number | null };
    }>;
  } | null>(null);
  const [assessmentNote, setAssessmentNote] = useState("");
  const [segClips, setSegClips] = useState<{
    captureMode: string;
    progress: {
      total: number;
      recorded: number;
      skipped: number;
      pending: number;
      partial: number;
    };
    clips: Array<{
      segmentId: string;
      status: string;
      audioAssetId: string | null;
      version: number;
    }>;
  } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const syncing = useRef(false);
  const clipStopRef = useRef(0);

  useEffect(() => {
    if (data) setMix(parseMix(data.device_json));
  }, [data]);

  useEffect(() => {
    if (!attemptId) return;
    void api<{
      captureMode: string;
      progress: {
        total: number;
        recorded: number;
        skipped: number;
        pending: number;
        partial: number;
      };
      clips: Array<{
        segmentId: string;
        status: string;
        audioAssetId: string | null;
        version: number;
      }>;
    }>(`/kaiwa/attempts/${attemptId}/segment-clips`)
      .then(setSegClips)
      .catch(() => setSegClips(null));
  }, [attemptId]);

  useEffect(() => {
    return () => window.clearTimeout(clipStopRef.current);
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (v) v.volume = mix.originalGain;
    const a = audioRef.current;
    if (a) a.volume = mix.learnerGain;
  }, [mix.originalGain, mix.learnerGain]);

  function syncFromVideo() {
    const v = videoRef.current;
    const a = audioRef.current;
    if (!v || !a || syncing.current) return;
    syncing.current = true;
    try {
      if (Math.abs(a.currentTime - v.currentTime) > 0.12) {
        a.currentTime = v.currentTime;
      }
    } catch {
      /* ignore seek race */
    } finally {
      syncing.current = false;
    }
  }

  async function saveMix(next: MixPrefs) {
    if (!attemptId) return;
    setSaving(true);
    setSaveNote("");
    try {
      await api(`/kaiwa/attempts/${attemptId}/mix`, {
        method: "PATCH",
        body: JSON.stringify({
          originalGain: next.originalGain,
          learnerGain: next.learnerGain,
          keep: next.keep,
        }),
      });
      setSaveNote("Đã lưu cấu hình mix.");
      reload();
    } catch (e) {
      setSaveNote(e instanceof Error ? e.message : "Lưu mix thất bại.");
    } finally {
      setSaving(false);
    }
  }

  async function startNewAttempt() {
    if (!data) return;
    setRerecording(true);
    try {
      const attempt = await post<AttemptDetail>(
        `/kaiwa/projects/${data.project_id}/attempts`,
      );
      navigate(
        `/kaiwa/projects/${data.project_id}/studio?attempt=${attempt.id}`,
      );
    } catch (e) {
      setSaveNote(e instanceof Error ? e.message : "Không tạo được lần thu mới.");
      setRerecording(false);
    }
  }

  async function startExport() {
    if (!attemptId) return;
    setExporting(true);
    setSaveNote("");
    try {
      const row = await post<{ id: string; state: string }>(
        `/kaiwa/attempts/${attemptId}/exports`,
        {
          originalGain: mix.originalGain,
          learnerGain: mix.learnerGain,
          offsetMs: 0,
        },
      );
      if (row.state === "ready") {
        setExportHref(`/api/kaiwa/exports/${row.id}/download`);
        setSaveNote("Xuất sẵn sàng — tải về bên dưới.");
      } else {
        setSaveNote(`Xuất đang xử lý (${row.state}).`);
      }
    } catch (e) {
      setSaveNote(e instanceof Error ? e.message : "Xuất thất bại.");
    } finally {
      setExporting(false);
    }
  }

  async function runQualityCheck() {
    if (!attemptId) return;
    setCheckingQuality(true);
    setQualityNote("");
    try {
      const report = await post<{
        verdict: string;
        messageVi: string;
        pronunciationScore: null;
      }>(`/kaiwa/attempts/${attemptId}/audio-quality`, {});
      setQualityNote(
        `${report.verdict}: ${report.messageVi} (điểm phát âm: ${report.pronunciationScore === null ? "không có" : report.pronunciationScore})`,
      );
    } catch (e) {
      setQualityNote(
        e instanceof Error ? e.message : "Kiểm tra chất lượng thất bại.",
      );
    } finally {
      setCheckingQuality(false);
    }
  }

  async function runAssessment() {
    if (!attemptId) return;
    setAssessing(true);
    setAssessmentNote("");
    try {
      const report = await post<{
        status: string;
        messageVi: string;
        overallScore: null;
        coverage: {
          plannedSegments: number;
          assessableSegments: number;
          assessableRatio: number | null;
        };
        priorities: Array<{
          segmentId: string | null;
          kind: string;
          messageVi: string;
        }>;
        segments: Array<{
          segmentId: string;
          status: string;
          reason: string | null;
          listen: { startMs: number | null; endMs: number | null };
        }>;
      }>(`/kaiwa/attempts/${attemptId}/assessment`, {});
      setAssessment(report);
      setAssessmentNote(report.messageVi);
    } catch (e) {
      setAssessment(null);
      setAssessmentNote(
        e instanceof Error
          ? e.message
          : "Phân tích phản hồi thất bại — vẫn nghe/xuất được.",
      );
    } finally {
      setAssessing(false);
    }
  }

  function seekToMs(ms: number | null) {
    const v = videoRef.current;
    if (!v || ms == null || !Number.isFinite(ms)) return;
    v.currentTime = Math.max(0, ms / 1000);
    void v.play().catch(() => undefined);
  }

  function seekClipWindow(startMs: number, endMs: number) {
    const v = videoRef.current;
    const a = audioRef.current;
    if (!v) return;
    window.clearTimeout(clipStopRef.current);
    const startSec = Math.max(0, startMs / 1000);
    const endSec = Math.max(startSec, endMs / 1000);
    v.currentTime = startSec;
    if (a) {
      try {
        a.currentTime = startSec;
      } catch {
        /* ignore */
      }
      void a.play().catch(() => undefined);
    }
    void v.play().catch(() => undefined);
    const dur = Math.max(0.2, (endSec - startSec) * 1000);
    clipStopRef.current = window.setTimeout(() => {
      v.pause();
      a?.pause();
    }, dur) as unknown as number;
  }

  async function playClipOnly(assetId: string | null) {
    if (!assetId) return;
    const a = new Audio(`/api/kaiwa/assets/${assetId}/content`);
    await a.play().catch(() => undefined);
  }

  if (!attemptId) return <ErrorState message="Thiếu mã lần thu." />;
  if (error) return <ErrorState message={error} retry={reload} />;
  if (!data) return <Loading />;

  const videoUrl = data.proxyAssetId
    ? `/api/kaiwa/assets/${data.proxyAssetId}/content`
    : null;
  const micUrl = data.audio_asset_id
    ? `/api/kaiwa/assets/${data.audio_asset_id}/content`
    : null;
  const finalized =
    data.record_state === "finalized" || Boolean(data.audio_asset_id);

  let captureMode = "unknown";
  let assembly: string | undefined;
  try {
    const device = JSON.parse(data.device_json || "{}") as {
      captureMode?: string;
      assembly?: string;
    };
    const clocks = JSON.parse(data.clocks_json || "{}") as {
      captureMode?: string;
      assembly?: string;
    };
    captureMode = device.captureMode || clocks.captureMode || "unknown";
    assembly = device.assembly || clocks.assembly;
  } catch {
    /* ignore */
  }

  const segs = data.revision?.payload?.segments ?? [];
  const clipById = new Map(
    (segClips?.clips ?? []).map((c) => [c.segmentId, c]),
  );

  return (
    <div className="kaiwa-page">
      <PageHead
        title={`Nghe lại · ${data.projectTitle}`}
        description={`${dateTime(data.created_at)} · ${data.record_state}${
          data.completion ? ` · ${data.completion}` : ""
        }`}
      >
        <Link
          className="btn secondary"
          to={`/kaiwa/projects/${data.project_id}`}
        >
          Dự án
        </Link>
      </PageHead>

      {!finalized && (
        <Status tone="info">
          Bản thu chưa chốt xong — vẫn có thể mở phòng thu để tiếp tục.
        </Status>
      )}

      <Status tone="info">
        Chấm phát âm tự động chưa cấu hình ở Gate A — bạn vẫn nghe lại và xuất MP4 được
        (không có điểm số giả).
      </Status>

      <div className="panel kaiwa-review-player">
        {videoUrl ? (
          <video
            ref={videoRef}
            className="kaiwa-record-video"
            src={videoUrl}
            controls
            playsInline
            preload="metadata"
            onPlay={() => {
              void audioRef.current?.play().catch(() => undefined);
              syncFromVideo();
            }}
            onPause={() => audioRef.current?.pause()}
            onSeeking={syncFromVideo}
            onTimeUpdate={syncFromVideo}
            onRateChange={() => {
              const a = audioRef.current;
              const v = videoRef.current;
              if (a && v) a.playbackRate = v.playbackRate;
            }}
          />
        ) : (
          <p>Chưa có video proxy để nghe lại.</p>
        )}
        {micUrl ? (
          <audio ref={audioRef} src={micUrl} preload="auto" />
        ) : (
          <p className="kaiwa-privacy-note">
            Chưa có audio micro đã chốt — thanh «Giọng mình» sẽ không có tín hiệu.
          </p>
        )}
      </div>

      {segs.length > 0 && (
        <div className="panel kaiwa-review-segments">
          <h2 className="kaiwa-section-title">Trạng thái từng đoạn</h2>
          <p className="kaiwa-privacy-note">
            Chế độ: <strong>{captureMode}</strong>
            {assembly ? ` · assembly=${assembly}` : ""}
            {captureMode === "segment"
              ? " — bản ghép không được gọi là thu liên tục."
              : ""}
            {segClips
              ? ` · Đã thu ${segClips.progress.recorded}/${segClips.progress.total}`
              : ""}
          </p>
          <ul className="kaiwa-seg-status-list">
            {segs.map((seg, i) => {
              const c = clipById.get(seg.id);
              const st = c?.status ?? "pending";
              return (
                <li key={seg.id} className="kaiwa-seg-chip-row">
                  <button
                    type="button"
                    className="kaiwa-seg-chip"
                    onClick={() => seekClipWindow(seg.startMs, seg.endMs)}
                    title="Tua cửa sổ đoạn trên video + giọng đã ghép"
                  >
                    {i + 1}. {st}
                    {c?.version ? ` v${c.version}` : ""}
                  </button>
                  {c?.audioAssetId ? (
                    <button
                      type="button"
                      className="kaiwa-seg-mark"
                      onClick={() => void playClipOnly(c.audioAssetId)}
                    >
                      Nghe clip
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="panel kaiwa-mix">
        <h2 className="kaiwa-section-title">Mix nghe lại</h2>
        <p className="kaiwa-privacy-note">
          Chỉ hai kênh: tiếng gốc (video) và giọng bạn (micro). Không có slider nhạc
          riêng khi không có track riêng.
        </p>
        <label className="kaiwa-mix-row">
          <span>Tiếng gốc</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={mix.originalGain}
            onChange={(e) =>
              setMix((m) => ({
                ...m,
                originalGain: Number(e.target.value),
              }))
            }
          />
          <span>{Math.round(mix.originalGain * 100)}%</span>
        </label>
        <label className="kaiwa-mix-row">
          <span>Giọng mình</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={mix.learnerGain}
            onChange={(e) =>
              setMix((m) => ({
                ...m,
                learnerGain: Number(e.target.value),
              }))
            }
          />
          <span>{Math.round(mix.learnerGain * 100)}%</span>
        </label>
        <label className="kaiwa-mix-keep">
          <input
            type="checkbox"
            checked={Boolean(mix.keep)}
            onChange={(e) =>
              setMix((m) => ({ ...m, keep: e.target.checked }))
            }
          />
          Đánh dấu giữ bản này
        </label>
        <div className="kaiwa-actions">
          <button
            type="button"
            className="btn"
            disabled={saving}
            onClick={() => void saveMix(mix)}
          >
            {saving ? "Đang lưu…" : "Lưu mix"}
          </button>
          <button
            type="button"
            className="btn"
            disabled={exporting || !finalized}
            onClick={() => void startExport()}
          >
            {exporting ? "Đang xuất…" : "Xuất MP4"}
          </button>
          <button
            type="button"
            className="btn secondary"
            disabled={checkingQuality || !finalized}
            onClick={() => void runQualityCheck()}
          >
            {checkingQuality ? "Đang kiểm…" : "Kiểm tra chất lượng thu"}
          </button>
          <button
            type="button"
            className="btn secondary"
            disabled={assessing || !finalized}
            onClick={() => void runAssessment()}
          >
            {assessing ? "Đang phân tích…" : "Phân tích phản hồi"}
          </button>
          <button
            type="button"
            className="btn secondary"
            disabled={rerecording}
            onClick={() => void startNewAttempt()}
          >
            {rerecording ? "Đang tạo…" : "Thu lại (bản mới)"}
          </button>
          {!finalized && (
            <Link
              className="btn secondary"
              to={`/kaiwa/projects/${data.project_id}/studio?attempt=${data.id}`}
            >
              Tiếp tục thu
            </Link>
          )}
        </div>
        {exportHref && (
          <p>
            <a className="btn secondary" href={exportHref}>
              Tải file xuất
            </a>
          </p>
        )}
        {qualityNote && <Status tone="info">{qualityNote}</Status>}
        {assessmentNote && <Status tone="info">{assessmentNote}</Status>}
        {assessment && (
          <div className="kaiwa-assessment-panel">
            <p>
              Điểm tổng:{" "}
              <strong>
                {assessment.overallScore === null
                  ? "không có (chưa hiệu chỉnh)"
                  : assessment.overallScore}
              </strong>
              {" · "}
              Coverage: {assessment.coverage.assessableSegments}/
              {assessment.coverage.plannedSegments} đoạn có thể chấm
              {assessment.coverage.assessableRatio != null
                ? ` (${Math.round(assessment.coverage.assessableRatio * 100)}%)`
                : ""}
            </p>
            {assessment.priorities.length > 0 ? (
              <ol className="kaiwa-assessment-priorities">
                {assessment.priorities.slice(0, 3).map((p, i) => {
                  const seg = p.segmentId
                    ? assessment.segments.find((s) => s.segmentId === p.segmentId)
                    : undefined;
                  return (
                    <li key={`${p.kind}-${p.segmentId ?? "all"}-${i}`}>
                      <span>{p.messageVi}</span>
                      {seg?.listen.startMs != null && (
                        <button
                          type="button"
                          className="btn secondary"
                          onClick={() => seekToMs(seg.listen.startMs)}
                        >
                          Nghe lại đoạn
                        </button>
                      )}
                    </li>
                  );
                })}
              </ol>
            ) : (
              <p className="kaiwa-privacy-note">
                Chưa có ưu tiên phản hồi cụ thể — provider chấm phát âm có thể chưa
                cấu hình. Nghe lại / xuất MP4 không bị chặn.
              </p>
            )}
          </div>
        )}
        {saveNote && <Status tone="info">{saveNote}</Status>}
      </div>
    </div>
  );
}

type HistoryPayload = {
  events: Array<{
    id: string;
    attempt_id: string | null;
    event_key: string;
    speaking_ms: number;
    occurred_at: string;
    day: string;
    project_id?: string | null;
    project_title?: string | null;
    completion?: string | null;
    record_state?: string | null;
    duration_ms?: number | null;
  }>;
  attempts: Array<{
    id: string;
    project_id: string;
    project_title: string;
    record_state: string;
    completion: string | null;
    duration_ms: number | null;
    created_at: string;
    finalized_at: string | null;
  }>;
  byDay: Array<{ day: string; takes: number; speaking_ms: number }>;
  today: string;
  timezone: string;
  xpNote: string;
};

export function KaiwaHistory() {
  const { data, error, reload } = useData<HistoryPayload>("/kaiwa/history");
  if (error) return <ErrorState message={error} retry={reload} />;
  if (!data) return <Loading />;

  return (
    <div className="kaiwa-page">
      <PageHead
        title="Lịch sử Kaiwa"
        description={`Ngày theo ${data.timezone}. Hôm nay: ${data.today}.`}
      >
        <Link className="btn secondary" to="/kaiwa">
          Thư viện
        </Link>
      </PageHead>

      <Status tone="info">{data.xpNote}</Status>

      <div className="panel">
        <h2 className="kaiwa-section-title">Theo ngày</h2>
        {data.byDay.length === 0 ? (
          <p>Chưa có sự kiện chốt bản thu.</p>
        ) : (
          <ul className="kaiwa-attempt-list">
            {data.byDay.map((d) => (
              <li key={d.day} className="kaiwa-attempt-row">
                <span>{d.day}</span>
                <span>
                  {d.takes} lần · {(d.speaking_ms / 1000).toFixed(0)}s ghi nhận
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="panel">
        <h2 className="kaiwa-section-title">Các lần thu gần đây</h2>
        {data.attempts.length === 0 ? (
          <p>Chưa có lần thu nào.</p>
        ) : (
          <ul className="kaiwa-attempt-list">
            {data.attempts.map((a) => (
              <li key={a.id}>
                <Link className="kaiwa-attempt-row" to={`/kaiwa/attempts/${a.id}`}>
                  <span>
                    {a.project_title} · {dateTime(a.finalized_at || a.created_at)}
                  </span>
                  <span>
                    {a.record_state}
                    {a.completion ? ` · ${a.completion}` : ""}
                    {a.duration_ms != null
                      ? ` · ${(a.duration_ms / 1000).toFixed(1)}s`
                      : ""}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
