import {
  useCallback,
  useEffect,
  useId,
  useRef,
  type ReactNode,
} from "react";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Optional descriptive line rendered under the title. */
  description?: ReactNode;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Accessible modal dialog: role="dialog" + aria-modal, focus is trapped while
 * open, Escape closes, and focus returns to the triggering element on close.
 * Body scroll is locked for the lifetime of the dialog.
 */
export default function Modal({
  title,
  onClose,
  children,
  description,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();

  const focusables = useCallback(
    () =>
      Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [],
      ),
    [],
  );

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    // Prefer the first field in the body (a text input to type into) over the
    // close button; fall back to the first focusable control.
    const firstInBody =
      contentRef.current?.querySelector<HTMLElement>(FOCUSABLE);
    (firstInBody ?? focusables()[0])?.focus();

    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus();
    };
  }, [focusables, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        // Close only when the backdrop itself is clicked, not the dialog.
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        className="max-h-[90vh] w-full max-w-md overflow-y-auto overscroll-contain rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-lg font-bold">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            ✕
          </button>
        </div>
        {description && (
          <p id={descId} className="mt-1 text-sm text-slate-500">
            {description}
          </p>
        )}
        <div ref={contentRef} className="mt-4">
          {children}
        </div>
      </div>
    </div>
  );
}
