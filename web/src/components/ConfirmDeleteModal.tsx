import { useState } from "react";
import Modal from "./Modal";
import { useToast } from "./Toast";
import { ui } from "../lib/ui";
import type { ApiError } from "../lib/api";

interface Props {
  title: string;
  /** Plain-language summary of what is being deleted. */
  description: string;
  confirmLabel: string;
  successMessage: string;
  /**
   * When we already know the delete is blocked (e.g. the team has epics), the
   * reason is shown up front and the confirm button is disabled. The server's
   * 409 is still handled as the authoritative fallback (e.g. tickets we can't
   * see from here).
   */
  blockedReason?: string | null;
  onConfirm: () => Promise<unknown>;
  onClose: () => void;
}

export default function ConfirmDeleteModal({
  title,
  description,
  confirmLabel,
  successMessage,
  blockedReason,
  onConfirm,
  onClose,
}: Props) {
  const [conflict, setConflict] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  // Proactive reason wins; otherwise show whatever the server reported.
  const reason = blockedReason ?? conflict;

  async function handleConfirm() {
    setConflict(null);
    setSubmitting(true);
    try {
      await onConfirm();
      toast.success(successMessage);
      onClose();
    } catch (err) {
      const e = err as ApiError;
      if (e.status === 409) {
        setConflict(e.message ?? "This item is still referenced and can't be deleted.");
      } else {
        setConflict(e.message ?? "Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title={title} onClose={onClose} description={description}>
      {reason && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          {reason}
        </p>
      )}

      <div className="mt-5 flex justify-end gap-2">
        <button type="button" className={ui.btn} onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          className={ui.btnDanger}
          onClick={handleConfirm}
          disabled={submitting || Boolean(blockedReason)}
        >
          {submitting ? "Deleting…" : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
