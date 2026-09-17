import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Mic2, Upload } from "lucide-react";
import { ApiError, dateTime, post, useData } from "../../lib/api";
import { ErrorState, Loading, PageHead, Status } from "../../components/ui";
import {
  cancelUpload,
  loadResume,
  uploadFileChunked,
} from "./uploadClient";
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
        <p>Bước tiếp theo (các task sau): soạn phụ đề và vào phòng thu.</p>
        <Link className="btn secondary" to="/kaiwa/new">
          Tải video khác
        </Link>
      </div>
    </div>
  );
}
