import AppHeader from "../components/AppHeader";
import { ui } from "../lib/ui";

/**
 * Temporary landing page after login. Confirms the authenticated session
 * (protected route + /me hydration + logout). The real Kanban board arrives
 * in Milestone 5.
 */
export default function BoardPlaceholderPage() {
  return (
    <div className="min-h-screen bg-slate-100">
      <AppHeader />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="mb-2 text-2xl font-bold">You're logged in 🎉</h1>
        <p className={ui.muted}>
          Authentication is working end to end. Manage teams and epics from the{" "}
          <strong>Teams</strong> tab — the Kanban board arrives in the next
          milestones.
        </p>
      </main>
    </div>
  );
}
