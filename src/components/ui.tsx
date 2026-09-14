import {
  useEffect,
  useRef,
  useId,
  Children,
  isValidElement,
  cloneElement,
  type ReactNode,
  type ReactElement,
} from "react";
import { Link } from "react-router-dom";
import { ArrowRight, LoaderCircle, BookOpen, X } from "lucide-react";
export function Status({
  children,
  tone = "error",
}: {
  children: ReactNode;
  tone?: "error" | "success" | "info";
}) {
  return children ? (
    <div
      className={`status ${tone}`}
      role={tone === "error" ? "alert" : "status"}
    >
      {children}
    </div>
  ) : null;
}
export function Loading() {
  return (
    <div className="loading" role="status">
      <LoaderCircle className="spin" /> Đang tải không gian học…
    </div>
  );
}
export function ErrorState({
  message,
  retry,
}: {
  message: string;
  retry?: () => void;
}) {
  return (
    <div className="panel empty">
      <Status>{message}</Status>
      {retry && (
        <button className="btn secondary" onClick={retry}>
          Thử lại
        </button>
      )}
      <a href="/login">Đăng nhập lại</a>
    </div>
  );
}
export function PageHead({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-head">
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {children}
    </div>
  );
}
export function Field({
  label,
  children,
  hint,
  error,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
  error?: string;
}) {
  const id = useId();
  const describe =
    [hint ? `${id}-hint` : "", error ? `${id}-error` : ""]
      .filter(Boolean)
      .join(" ") || undefined;
  const attach = (nodes: ReactNode): ReactNode =>
    Children.map(nodes, (node) => {
      if (!isValidElement(node)) return node;
      const element = node as ReactElement<any>;
      if (["input", "select", "textarea"].includes(String(element.type)))
        return cloneElement(element, {
          id,
          "aria-describedby": describe,
          "aria-invalid": error ? true : undefined,
        });
      if (element.props.children)
        return cloneElement(element, {}, attach(element.props.children));
      return element;
    });
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {attach(children)}
      {hint && <small id={`${id}-hint`}>{hint}</small>}
      {error && (
        <small className="field-error" id={`${id}-error`}>
          {error}
        </small>
      )}
    </div>
  );
}
export function Empty({
  title,
  children,
  to,
  label = "Tạo bộ thẻ đầu tiên",
}: {
  title: string;
  children: ReactNode;
  to?: string;
  label?: string;
}) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <BookOpen />
      </span>
      <h2>{title}</h2>
      <p>{children}</p>
      {to && (
        <Link className="btn" to={to}>
          {label}
          <ArrowRight size={18} />
        </Link>
      )}
    </div>
  );
}
export function Modal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (open && !dialog?.open) dialog?.showModal();
    if (!open && dialog?.open) dialog.close();
  }, [open]);
  return (
    <dialog ref={ref} onCancel={onClose} aria-labelledby="dialog-title">
      <div className="dialog-head">
        <h2 id="dialog-title">{title}</h2>
        <button
          className="icon-btn"
          aria-label="Đóng hộp thoại"
          onClick={onClose}
          autoFocus
        >
          <X />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function ProgressRing({ value, goal }: { value: number; goal: number }) {
  const progress = Math.min(value / goal, 1) * 427;
  return (
    <div className="ring">
      <svg viewBox="0 0 160 160" aria-hidden="true">
        <circle cx="80" cy="80" r="68" />
        <circle
          className="ring-value"
          cx="80"
          cy="80"
          r="68"
          strokeDasharray={`${progress} 427`}
          opacity={value > 0 ? 1 : 0}
        />
      </svg>
      <div>
        <strong>
          {value} / {goal}
        </strong>
        <small>lượt học</small>
      </div>
    </div>
  );
}
