import { useEffect, useRef, useState } from "react";
import {
  createMeter,
  listInputDevices,
  openMicStream,
  recordTestClip,
  stopStream,
  type MicDevice,
  type PreflightState,
} from "./micPreflight";

type Props = {
  onReady: (info: { deviceId: string; label: string }) => void;
};

export function MicPreflightPanel({ onReady }: Props) {
  const [state, setState] = useState<PreflightState>("idle");
  const [devices, setDevices] = useState<MicDevice[]>([]);
  const [deviceId, setDeviceId] = useState("");
  const [level, setLevel] = useState(0);
  const [message, setMessage] = useState("");
  const [testUrl, setTestUrl] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const meterRef = useRef<ReturnType<typeof createMeter> | null>(null);
  const rafRef = useRef(0);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      meterRef.current?.close();
      meterRef.current = null;
      stopStream(streamRef.current);
      streamRef.current = null;
      if (testUrl) URL.revokeObjectURL(testUrl);
    };
  }, [testUrl]);

  async function refreshDevices() {
    const list = await listInputDevices();
    setDevices(list);
    if (!deviceId && list[0]) setDeviceId(list[0].deviceId);
  }

  async function requestMic() {
    setState("requesting");
    setMessage("");
    stopStream(streamRef.current);
    meterRef.current?.close();
    try {
      const stream = await openMicStream(deviceId || undefined);
      streamRef.current = stream;
      const track = stream.getAudioTracks()[0];
      track.addEventListener("ended", () => {
        setState("disconnected");
        setMessage("Micro bị ngắt — hãy chọn lại thiết bị.");
        stopStream(streamRef.current);
        streamRef.current = null;
      });
      const meter = createMeter(stream);
      meterRef.current = meter;
      const tick = () => {
        setLevel(meter.level());
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
      await refreshDevices();
      setState("ready");
      const label =
        devices.find((d) => d.deviceId === (deviceId || track.getSettings().deviceId))
          ?.label ||
        track.label ||
        "Micro";
      onReady({
        deviceId: deviceId || track.getSettings().deviceId || "default",
        label,
      });
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (code === "denied") setState("denied");
      else if (code === "no_device") setState("no_device");
      else setState("error");
      setMessage((e as Error).message);
    }
  }

  async function onTest() {
    if (!streamRef.current) return;
    setMessage("Đang thu thử cục bộ (không gửi lên máy chủ)…");
    try {
      const blob = await recordTestClip(streamRef.current, 1200);
      if (testUrl) URL.revokeObjectURL(testUrl);
      const url = URL.createObjectURL(blob);
      setTestUrl(url);
      setMessage("Đã thu thử — nghe lại bên dưới (chỉ trên máy này).");
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  return (
    <div className="panel kaiwa-preflight">
      <h2>Kiểm tra micro</h2>
      <p className="kaiwa-privacy-note">
        Thử micro chỉ chạy trên máy bạn — không gửi tới nhà cung cấp ngoài.
      </p>

      {devices.length > 0 && (
        <label className="kaiwa-field">
          Thiết bị
          <select
            value={deviceId}
            onChange={(e) => setDeviceId(e.target.value)}
            disabled={state === "requesting"}
          >
            {devices.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="kaiwa-meter" aria-label="Mức micro">
        <div
          className="kaiwa-meter-bar"
          style={{ width: `${Math.round(level * 100)}%` }}
        />
        <span>{Math.round(level * 100)}%</span>
      </div>

      <div className="kaiwa-actions">
        <button
          type="button"
          className="btn"
          onClick={() => void requestMic()}
          disabled={state === "requesting"}
        >
          {state === "ready" ? "Đổi / làm mới micro" : "Cho phép micro"}
        </button>
        {state === "ready" && (
          <button type="button" className="btn secondary" onClick={() => void onTest()}>
            Thu thử 1 giây
          </button>
        )}
      </div>

      {state === "denied" && (
        <p role="alert">Quyền micro bị từ chối — mở cài đặt trình duyệt để cho phép.</p>
      )}
      {state === "no_device" && (
        <p role="alert">Không có micro — cắm thiết bị rồi thử lại.</p>
      )}
      {state === "disconnected" && (
        <p role="alert">{message || "Micro đã ngắt kết nối."}</p>
      )}
      {message && state !== "disconnected" && <p role="status">{message}</p>}

      {testUrl && (
        <audio controls src={testUrl} preload="metadata">
          Nghe thử
        </audio>
      )}
    </div>
  );
}
