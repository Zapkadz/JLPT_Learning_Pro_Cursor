import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, Check } from "lucide-react";
import { useAuth } from "../App";
import { post } from "../lib/api";
import { Field, Status } from "../components/ui";
export function Auth() {
  const { user, setUser } = useAuth();
  const [register, setRegister] = useState(true);
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    document.title = "Bắt đầu học · Kotoba";
  }, []);
  if (user) return <Navigate to="/" replace />;
  return (
    <div className="auth-page">
      <div className="auth-story">
        <div className="brand">
          <span className="brand-mark" lang="ja">
            学
          </span>
          <strong>Kotoba</strong>
        </div>
        <div>
          <h1>
            Một chút hôm nay.
            <br />
            Một bước xa hơn
            <br />
            ngày mai.
          </h1>
          <p>
            Không gian học tiếng Nhật của riêng bạn.
            <br />
            Từ kiến thức đầu tiên đến những điều nhớ lâu.
          </p>
          <div className="auth-japanese" lang="ja">
            学ぶ<span>まなぶ · Học hỏi</span>
          </div>
        </div>
        <div className="auth-points">
          <span>
            <Check size={18} /> Ôn tập đúng thời điểm
          </span>
          <span>
            <Check size={18} /> Luyện tập trong ngữ cảnh
          </span>
        </div>
      </div>
      <div className="auth-form-wrap">
        <form
          noValidate
          onSubmit={async (e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const values = new FormData(form);
            const email = String(values.get("email"));
            const password = String(values.get("password"));
            if (
              !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
              password.length < (register ? 10 : 1) ||
              (register && !String(values.get("name")).trim())
            ) {
              setError(
                "Nhập tên, email hợp lệ và mật khẩu ít nhất 10 ký tự khi tạo tài khoản.",
              );
              (form.querySelector("input") as HTMLInputElement)?.focus();
              return;
            }
            setBusy(true);
            setError("");
            try {
              setUser(
                await post(
                  `/auth/${register ? "register" : "login"}`,
                  Object.fromEntries(values),
                ),
              );
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <h2>
            {register ? "Bắt đầu hành trình của bạn" : "Chào mừng bạn trở lại"}
          </h2>
          <p>
            {register
              ? "Tạo tài khoản để lưu bộ thẻ và tiến độ học."
              : "Đăng nhập để tiếp tục nhịp học của bạn."}
          </p>
          {register && (
            <Field label="Tên của bạn">
              <input
                name="name"
                autoComplete="name"
                maxLength={60}
                placeholder="Bạn muốn được gọi là gì?"
              />
            </Field>
          )}
          <Field label="Email">
            <input
              name="email"
              type="email"
              autoComplete="email"
              placeholder="ban@example.com"
              maxLength={254}
            />
          </Field>
          <Field
            label="Mật khẩu"
            hint={
              register
                ? "Ít nhất 10 ký tự. Có thể dán từ trình quản lý mật khẩu."
                : undefined
            }
          >
            <span className="password-field">
              <input
                name="password"
                type={show ? "text" : "password"}
                autoComplete={register ? "new-password" : "current-password"}
                maxLength={128}
              />
              <button
                type="button"
                className="icon-btn"
                aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                onClick={() => setShow(!show)}
              >
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </span>
          </Field>
          <Status>{error}</Status>
          <button className="btn full" disabled={busy}>
            {busy ? "Đang xử lý…" : register ? "Tạo tài khoản" : "Đăng nhập"}
            <ArrowRight size={18} />
          </button>
          <p className="auth-switch">
            {register ? "Đã có tài khoản?" : "Chưa có tài khoản?"}{" "}
            <button
              type="button"
              className="text-button"
              onClick={() => {
                setRegister(!register);
                setError("");
              }}
            >
              {register ? "Đăng nhập" : "Tạo tài khoản"}
            </button>
          </p>
          <small>
            Dữ liệu học được lưu trên máy chủ Kotoba đang chạy. Email dùng để
            đăng nhập; bản cài đặt này chưa hỗ trợ khôi phục mật khẩu qua email.
          </small>
        </form>
      </div>
    </div>
  );
}
