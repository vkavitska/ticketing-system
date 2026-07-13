import { stateLabel, typeLabel } from "../lib/format";

const base =
  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset";

// Subtle, enterprise-muted tints — soft background + darker text + hairline ring.
const TYPE_STYLES: Record<string, string> = {
  bug: "bg-rose-50 text-rose-700 ring-rose-600/20",
  feature: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
  fix: "bg-amber-50 text-amber-700 ring-amber-600/20",
};

const STATE_STYLES: Record<string, string> = {
  new: "bg-slate-100 text-slate-600 ring-slate-500/20",
  ready_for_implementation: "bg-sky-50 text-sky-700 ring-sky-600/20",
  in_progress: "bg-amber-50 text-amber-700 ring-amber-600/20",
  ready_for_acceptance: "bg-violet-50 text-violet-700 ring-violet-600/20",
  done: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
};

export function TypeBadge({ type }: { type: string }) {
  return (
    <span className={`${base} ${TYPE_STYLES[type] ?? TYPE_STYLES.bug}`}>
      {typeLabel(type)}
    </span>
  );
}

export function StateBadge({ state }: { state: string }) {
  return (
    <span className={`${base} ${STATE_STYLES[state] ?? STATE_STYLES.new}`}>
      {stateLabel(state)}
    </span>
  );
}
