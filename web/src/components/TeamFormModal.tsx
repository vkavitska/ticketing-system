import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Modal from "./Modal";
import { useToast } from "./Toast";
import { ui } from "../lib/ui";
import { createTeam, renameTeam, type Team } from "../api/teams";
import type { ApiError } from "../lib/api";

interface Props {
  mode: "create" | "rename";
  team?: Team;
  onClose: () => void;
}

export default function TeamFormModal({ mode, team, onClose }: Props) {
  const [name, setName] = useState(team?.name ?? "");
  const [error, setError] = useState<string | null>(null);
  const qc = useQueryClient();
  const toast = useToast();

  const mutation = useMutation({
    mutationFn: (value: string) =>
      mode === "create" ? createTeam(value) : renameTeam(team!.id, value),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teams"] });
      toast.success(mode === "create" ? "Team created" : "Team renamed");
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
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Team name is required.");
      return;
    }
    mutation.mutate(trimmed);
  }

  return (
    <Modal
      title={mode === "create" ? "New team" : "Rename team"}
      onClose={onClose}
    >
      <form onSubmit={onSubmit} noValidate>
        <label className={ui.label} htmlFor="team-name">
          Name
        </label>
        <input
          id="team-name"
          className={ui.input}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Platform"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "team-name-error" : undefined}
        />
        {error && (
          <p id="team-name-error" role="alert" className={ui.statusError}>
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
                ? "Create team"
                : "Save changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
