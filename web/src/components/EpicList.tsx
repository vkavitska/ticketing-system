import EmptyState from "./EmptyState";
import ErrorState from "./ErrorState";
import Skeleton from "./Skeleton";
import { ui } from "../lib/ui";
import type { Team } from "../api/teams";
import type { Epic } from "../api/epics";

interface Props {
  team: Team | null;
  epics: Epic[];
  loading: boolean;
  error: boolean;
  onCreate: () => void;
  onEdit: (epic: Epic) => void;
  onDelete: (epic: Epic) => void;
  onRetry: () => void;
}

export default function EpicList({
  team,
  epics,
  loading,
  error,
  onCreate,
  onEdit,
  onDelete,
  onRetry,
}: Props) {
  return (
    <section className={`${ui.panel} flex flex-col`} aria-label="Epics">
      <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <h2 className="truncate text-sm font-bold uppercase tracking-wide text-slate-500">
          {team ? `Epics · ${team.name}` : "Epics"}
        </h2>
        {team && (
          <button
            type="button"
            className={`${ui.btnPrimary} ${ui.btnSm}`}
            onClick={onCreate}
          >
            + New epic
          </button>
        )}
      </header>

      <div className="p-4">
        {!team && (
          <EmptyState title="Select a team to view its epics." />
        )}

        {team && loading && (
          <div aria-busy="true" className="flex flex-col gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        )}

        {team && error && !loading && (
          <ErrorState message="Couldn’t load epics." onRetry={onRetry} />
        )}

        {team && !loading && !error && epics.length === 0 && (
          <EmptyState
            title="No epics in this team yet"
            description="Create an epic to organize its tickets."
          />
        )}

        {team && !loading && !error && epics.length > 0 && (
          <ul className="flex flex-col gap-2">
            {epics.map((epic) => (
              <li
                key={epic.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold">{epic.title}</p>
                  {epic.description && (
                    <p className="mt-0.5 line-clamp-2 text-sm text-slate-500">
                      {epic.description}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    className={ui.iconBtn}
                    aria-label={`Edit epic ${epic.title}`}
                    onClick={() => onEdit(epic)}
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    className={ui.iconBtn}
                    aria-label={`Delete epic ${epic.title}`}
                    onClick={() => onDelete(epic)}
                  >
                    🗑
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
