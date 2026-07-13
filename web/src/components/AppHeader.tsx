import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { ui } from "../lib/ui";

const navLink = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-2 py-1 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${
    isActive ? "text-slate-900" : "text-slate-500 hover:text-slate-900"
  }`;

/** Shared top bar: product mark, primary nav, and the current session. */
export default function AppHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function onLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
      <div className="flex items-center gap-6">
        <strong className="tracking-wide">TICKET TRACKER</strong>
        <nav className="flex items-center gap-1" aria-label="Primary">
          <NavLink to="/teams" className={navLink}>
            Teams
          </NavLink>
          <NavLink to="/" end className={navLink}>
            Board
          </NavLink>
        </nav>
      </div>
      <div className="flex items-center gap-4 text-sm">
        <span className={ui.muted}>{user?.email}</span>
        <button
          className={`${ui.btn} ${ui.btnSm}`}
          type="button"
          onClick={onLogout}
        >
          Log out
        </button>
      </div>
    </header>
  );
}
