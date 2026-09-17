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
  splitSegment,
} from "../../../shared/kaiwa/subtitles";
import {
  markReadingStaleOnJaChange,
  readingToRomaji,
  tokensWithRomaji,
} from "../../../shared/kaiwa/romaji";
import type { KaiwaRubyToken, KaiwaSegment } from "../../../shared/kaiwa/types";
import { useAuth } from "../../App";
import { MicPreflightPanel } from "./MicPreflightPanel";
import { ContinuousRecorder } from "./ContinuousRecorder";
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
  const [revision, setRevision] = useState<RevisionView | null>(null);
  const [segments, setSegments] = useState<KaiwaSegment[]>([]);
  const [loadError, setLoadError] = useState("");
  const [message, setMessage] = useState("");
  const [issues, setIssues] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [prefs, setPrefs] = useState<HelpPrefs>(() =>
    loadHelpPrefs(user?.id || "anon"),
  );
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlapSet = useMemo(
    () => new Set(findOverlaps(segments)),
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

  async function onImportFile(file: File) {
    const text = await file.text();
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
    } else {
      setMessage("Không có đoạn hợp lệ sau khi phân tích.");
    }
  }

  function updateSeg(index: number, patch: Partial<KaiwaSegment>) {
    setSegments((prev) =>
      prev.map((s, i) => {
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
        return next;
      }),
    );
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

  return (
    <div className="kaiwa-page">
      <PageHead
        title={`Soạn phụ đề · ${project.title}`}
        description="Nhập SRT/VTT hoặc gõ tay. Markup HTML bị gỡ. Overlap được đánh dấu."
      >
        <Link className="btn secondary" to={`/kaiwa/projects/${project.id}`}>
          Về dự án
        </Link>
      </PageHead>

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
          Nhập SRT / VTT
          <input
            type="file"
            accept=".srt,.vtt,text/vtt,application/x-subrip,text/plain"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onImportFile(f);
            }}
          />
        </label>
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

      <ol className="kaiwa-segments">
        {segments.map((seg, index) => (
          <li
            key={seg.id}
            className={
              overlapSet.has(index) ? "kaiwa-seg overlap" : "kaiwa-seg"
            }
          >
            <div className="kaiwa-seg-times">
              <button
                type="button"
                className="btn secondary"
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
                onChange={(e) => {
                  const v = inputToMs(e.target.value);
                  if (v != null) updateSeg(index, { startMs: v });
                }}
              />
              <span>→</span>
              <input
                aria-label="Kết thúc"
                value={msToInput(seg.endMs)}
                onChange={(e) => {
                  const v = inputToMs(e.target.value);
                  if (v != null) updateSeg(index, { endMs: v });
                }}
              />
            </div>
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
        ))}
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
                <span
                  className={`kaiwa-ruby-preview ${prefs.furigana ? "ruby-on" : "ruby-off"}`}
                  lang="ja"
                >
                  {(seg.tokens?.length
                    ? seg.tokens
                    : [{ surface: seg.ja }]
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
                </span>
                {prefs.romaji && (
                  <span className="kaiwa-romaji">
                    {seg.tokens?.map((t) => t.romaji).filter(Boolean).join(" ") ||
                      "—"}
                  </span>
                )}
                {prefs.vi && seg.vi ? <span>{seg.vi}</span> : null}
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

      <MicPreflightPanel onReady={setMicReady} />

      {micReady && attemptId && (
        <ContinuousRecorder
          attemptId={attemptId}
          videoUrl={
            data.proxyAssetId
              ? `/api/kaiwa/assets/${data.proxyAssetId}/content`
              : null
          }
          deviceId={micReady.deviceId}
          onSaved={() => navigate(`/kaiwa/attempts/${attemptId}`)}
        />
      )}

      {micReady && !attemptId && (
        <Status tone="success">
          Micro sẵn sàng: {micReady.label}.
        </Status>
      )}

      {playbackUrl && (
        <div className="panel kaiwa-player">
          <video controls playsInline preload="metadata" src={playbackUrl} />
        </div>
      )}

      <div className="panel">
        <p>
          Lời thoại ghim cho lần thu: <strong>{segs.length}</strong> đoạn · revision{" "}
          <code>{data.revision_id.slice(0, 8)}</code>
        </p>
        <p className="kaiwa-privacy-note">
          Sau khi chốt bản thu, bạn được chuyển sang trang nghe lại (gain gốc / giọng
          mình). Snapshot đã ghim và không đổi khi sửa nháp sau này.
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const syncing = useRef(false);

  useEffect(() => {
    if (data) setMix(parseMix(data.device_json));
  }, [data]);

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
        {saveNote && <Status tone="info">{saveNote}</Status>}
      </div>
    </div>
  );
}
