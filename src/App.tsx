import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  NavLink,
  Outlet,
  Link,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  BookOpen,
  House,
  RotateCcw,
  Layers,
  Languages,
  Mic2,
  ChartNoAxesCombined,
  TrendingUp,
  Settings,
  LogOut,
} from "lucide-react";
import { api } from "./lib/api";
import { Loading, ErrorState } from "./components/ui";
export type User = {
  id: string;
  name: string;
  email: string;
  settings: { dailyGoal: number; level: string; retention: number };
};
const AuthContext = createContext<{
  user: User | null;
  setUser: (u: User | null) => void;
}>({ user: null, setUser: () => {} });
export const useAuth = () => useContext(AuthContext);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    api<User>("/me")
      .then(setUser)
      .catch((e) => {
        if (e.status !== 401) setError(e.message);
      })
      .finally(() => setReady(true));
  }, []);
  if (!ready) return <Loading />;
  if (error)
    return <ErrorState message={error} retry={() => location.reload()} />;
  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}
const nav = [
  ["/", "Tổng quan", House],
  ["/review", "Ôn tập", RotateCcw],
  ["/decks", "Bộ thẻ", Layers],
  ["/kana", "Hiragana & Katakana", Languages],
  ["/grammar", "Học ngữ pháp", BookOpen],
  ["/kaiwa", "Kaiwa", Mic2],
  ["/practice", "Luyện thi JLPT", ChartNoAxesCombined],
  ["/progress", "Tiến độ", TrendingUp],
  ["/settings", "Cài đặt", Settings],
] as const;
export function Layout() {
  const { user, setUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  useEffect(() => {
    const title =
      nav.find(([p]) =>
        p === "/" ? location.pathname === "/" : location.pathname.startsWith(p),
      )?.[1] || "Không tìm thấy";
    document.title = `${title} · Kotoba`;
    window.scrollTo(0, 0);
  }, [location.pathname]);
  if (!user) return <Navigate to="/login" replace />;
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Đến nội dung chính
      </a>
      <aside className="sidebar">
        <Link to="/" className="brand">
          <span className="brand-mark" lang="ja">
            学
          </span>
          <span>
            <strong>Kotoba</strong>
            <small>Học một chút, nhớ thật lâu.</small>
          </span>
        </Link>
        <nav aria-label="Điều hướng chính">
          {nav.map(([path, label, Icon]) => (
            <NavLink end={path === "/"} key={path} to={path}>
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <p>
            “Ngôn ngữ mở ra
            <br />
            một thế giới mới.”
          </p>
          <small>— ことば (Kotoba)</small>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <span>
            <BookOpen size={18} /> Không gian học tập
          </span>
          <div>
            <span className="user-name">{user.name}</span>
            <span className="avatar" aria-label={user.name}>
              {user.name.charAt(0).toUpperCase()}
            </span>
            <button
              className="icon-btn"
              aria-label="Đăng xuất"
              onClick={async () => {
                try {
                  await api("/auth/logout", { method: "POST" });
                  setUser(null);
                  navigate("/login");
                } catch (e) {
                  setError((e as Error).message);
                }
              }}
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>
        <main id="main">
          {error && <ErrorState message={error} />}
          <Outlet />
        </main>
        <footer className="app-footer">
          Kotoba · Từng bước nhỏ, đi xa hơn.
          <span>
            Nội dung luyện tập độc lập, không phải đề JLPT chính thức.
          </span>
        </footer>
      </div>
    </div>
  );
}
