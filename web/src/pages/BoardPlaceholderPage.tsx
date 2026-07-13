import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { ui } from "../lib/ui";

/**
 * Temporary landing page after login. Confirms the authenticated session
 * (protected route + /me hydration + logout). The real Kanban board arrives
 * in Milestone 5.
 */
export default function BoardPlaceholderPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function onLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div>
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
        <strong className="tracking-wide">TICKET TRACKER</strong>
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

      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="mb-2 text-2xl font-bold">You're logged in 🎉</h1>
        <p className={ui.muted}>
          Authentication is working end to end. Teams, epics, tickets, and the
          Kanban board arrive in the next milestones.
        </p>
      </main>
    </div>
  );
}
