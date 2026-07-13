import { useEffect, useState } from "react";

type Health = { status: string };

export default function App() {
  const [health, setHealth] = useState<Health | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<Health>;
      })
      .then(setHealth)
      .catch((err: unknown) => setError(String(err)));
  }, []);

  return (
    <main className="page">
      <h1>Ticket Tracker</h1>
      <p className="muted">
        Milestone 1 — scaffold running. Authentication, teams, epics, tickets,
        and the Kanban board arrive in later milestones.
      </p>

      <section className="card">
        <h2>Backend connectivity</h2>
        {error && <p className="status status--error">API error: {error}</p>}
        {!error && !health && <p className="status">Checking API…</p>}
        {health && (
          <p className="status status--ok">API status: {health.status}</p>
        )}
      </section>
    </main>
  );
}
