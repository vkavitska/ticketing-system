import { useDroppable } from "@dnd-kit/core";
import type { ReactNode } from "react";
import { ui } from "../lib/ui";

interface Props {
  id: string;
  label: string;
  count: number;
  children: ReactNode;
}

export default function BoardColumn({ id, label, count, children }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <section
      ref={setNodeRef}
      aria-label={label}
      className={`${ui.boardColumn} ${isOver ? ui.boardColumnOver : ""}`}
    >
      <header className="flex items-center justify-between border-b border-slate-200 px-3 py-2">
        <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">
          {label}
        </h2>
        <span className={ui.badge}>{count}</span>
      </header>
      <div className="flex min-h-[5rem] flex-1 flex-col gap-2 p-2">
        {children}
      </div>
    </section>
  );
}
