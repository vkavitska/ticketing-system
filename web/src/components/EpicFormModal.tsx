import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Modal from "./Modal";
import { useToast } from "./Toast";
import { ui } from "../lib/ui";
import { createEpic, updateEpic, type Epic } from "../api/epics";
import type { ApiError } from "../lib/api";

interface Props {
  mode: "create" | "edit";
  teamId: string;
  teamName: string;
  epic?: Epic;
  onClose: () => void;
}

export default function EpicFormModal({
  mode,
  teamId,
  teamName,
  epic,
  onClose,
}: Props) {
  const [title, setTitle] = useState(epic?.title ?? "");
  const [description, setDescription] = useState(epic?.description ?? "");
  const [error, setError] = useState<string | null>(null);
  const qc = useQueryClient();
  const toast = useToast();

  const mutation = useMutation({
    mutationFn: () => {
      const desc = description.trim() ? description.trim() : null;
      return mode === "create"
        ? createEpic({ teamId, title: title.trim(), description: desc })
        : // Note: teamId is intentionally omitted — an epic's team is immutable.
          updateEpic(epic!.id, { title: title.trim(), description: desc });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["epics"] });
      toast.success(mode === "create" ? "Epic created" : "Epic updated");
      onClose();
    },
    onError: (err) => {
      setError(
        (err as unknown as ApiError).message ??
          "Something went wrong. Try again.",
      );
    },
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) {
      setError("Epic title is required.");
      return;
    }
    mutation.mutate();
  }

  return (
    <Modal
      title={mode === "create" ? "New epic" : "Edit epic"}
      onClose={onClose}
    >
      <form onSubmit={onSubmit} noValidate>
        <label className={ui.label} htmlFor="epic-title">
          Title
        </label>
        <input
          id="epic-title"
          className={ui.input}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Login flow"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "epic-title-error" : undefined}
        />

        <label className={ui.label} htmlFor="epic-description">
          Description <span className="font-normal text-slate-400">(optional)</span>
        </label>
        <textarea
          id="epic-description"
          className={`${ui.input} min-h-[5rem] resize-y`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What is this epic about?"
        />

        <label className={ui.label} htmlFor="epic-team">
          Team
        </label>
        <input
          id="epic-team"
          className={`${ui.input} bg-slate-50 text-slate-500`}
          value={teamName}
          readOnly
          aria-describedby="epic-team-note"
        />
        <p id="epic-team-note" className="mt-1 text-xs text-slate-400">
          An epic&rsquo;s team can&rsquo;t be changed after it&rsquo;s created.
        </p>

        {error && (
          <p id="epic-title-error" role="alert" className={ui.statusError}>
            {error}
          </p>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className={ui.btn} onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            className={ui.btnPrimary}
            disabled={mutation.isPending}
          >
            {mutation.isPending
              ? "Saving…"
              : mode === "create"
                ? "Create epic"
                : "Save changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
