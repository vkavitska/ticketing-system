import { Link } from "react-router-dom";
import { useDraggable } from "@dnd-kit/core";
import { ui } from "../lib/ui";
import { TypeBadge } from "./Badge";
import type { Ticket } from "../api/tickets";

interface Props {
  ticket: Ticket;
  epicTitle: string | null;
}

/**
 * A board card. The body is a link to the ticket; a dedicated grip handle is
 * the drag activator (keyboard + pointer), keeping "open" and "move" distinct.
 */
export default function TicketCard({ ticket, epicTitle }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    isDragging,
  } = useDraggable({ id: ticket.id });

  // The moving preview is rendered by <DragOverlay> in BoardPage; the source
  // card just dims while it's being dragged.
  return (
    <div
      ref={setNodeRef}
      className={`${ui.boardCard} ${isDragging ? "opacity-40" : ""}`}
    >
      <div className="flex items-start gap-2">
        <button
          ref={setActivatorNodeRef}
          {...listeners}
          {...attributes}
          aria-label={`Drag ${ticket.title} to change its state`}
          className="mt-0.5 cursor-grab rounded text-slate-400 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
        >
          ⠿
        </button>
        <Link to={`/tickets/${ticket.id}`} className="block min-w-0 flex-1">
          <TypeBadge type={ticket.type} />
          <p className="mt-1 truncate text-sm font-medium">{ticket.title}</p>
          {epicTitle && (
            <p className="mt-0.5 truncate text-xs text-slate-500">{epicTitle}</p>
          )}
        </Link>
      </div>
    </div>
  );
}
