import { ui } from "../lib/ui";
import type { Team } from "../api/teams";

interface Props {
  teams: Team[];
  epicCounts: Record<string, number>;
  selectedId: string | null;
  loading: boolean;
  error: boolean;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onRename: (team: Team) => void;
  onDelete: (team: Team) => void;
  onRetry: () => void;
}

export default function TeamSidebar({
  teams,
  epicCounts,
  selectedId,
  loading,
  error,
  onSelect,
  onCreate,
  onRename,
  onDelete,
  onRetry,
}: Props) {
  return (
    <section className={`${ui.panel} flex flex-col`} aria-label="Teams">
      <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
          Teams
        </h2>
        <button
          type="button"
          className={`${ui.btnPrimary} ${ui.btnSm}`}
          onClick={onCreate}
        >
          + New team
        </button>
      </header>

      <div className="p-2">
        {loading && (
          <p className="px-3 py-6 text-center text-sm text-slate-500">
            Loading teams…
          </p>
        )}

        {error && !loading && (
          <div className="px-3 py-6 text-center">
            <p className={ui.statusError}>Couldn&rsquo;t load teams.</p>
            <button
              type="button"
              className={`${ui.btn} ${ui.btnSm} mt-3`}
              onClick={onRetry}
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && teams.length === 0 && (
          <div className="px-3 py-8 text-center">
            <p className="text-sm font-medium text-slate-900">No teams yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Create your first team to get started.
            </p>
          </div>
        )}

        {!loading && !error && teams.length > 0 && (
          <ul className="flex flex-col gap-0.5">
            {teams.map((team) => {
              const selected = team.id === selectedId;
              const count = epicCounts[team.id] ?? 0;
              return (
                <li key={team.id} className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onSelect(team.id)}
                    aria-current={selected ? "true" : undefined}
                    className={`${ui.listRow} flex-1 ${
                      selected ? ui.listRowActive : ""
                    }`}
                  >
                    <span className="flex-1 truncate">{team.name}</span>
                    <span
                      className={ui.badge}
                      title={`${count} epic${count === 1 ? "" : "s"}`}
                    >
                      {count}
                    </span>
                  </button>
                  <button
                    type="button"
                    className={ui.iconBtn}
                    aria-label={`Rename team ${team.name}`}
                    onClick={() => onRename(team)}
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    className={ui.iconBtn}
                    aria-label={`Delete team ${team.name}`}
                    onClick={() => onDelete(team)}
                  >
                    🗑
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
