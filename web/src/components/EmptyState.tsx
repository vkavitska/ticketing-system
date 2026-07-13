import type { ReactNode } from "react";

interface Props {
  title: string;
  description?: string;
  /** Optional decorative glyph/SVG; rendered muted and aria-hidden. */
  icon?: ReactNode;
  /** Optional call-to-action (e.g. a button). */
  action?: ReactNode;
}

export default function EmptyState({ title, description, icon, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      {icon && (
        <div aria-hidden="true" className="mb-3 text-slate-300">
          {icon}
        </div>
      )}
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      {description && (
        <p className="mt-1 max-w-xs text-pretty text-sm text-slate-500">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
