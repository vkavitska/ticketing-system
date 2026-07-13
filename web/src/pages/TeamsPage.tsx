import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import AppHeader from "../components/AppHeader";
import TeamSidebar from "../components/TeamSidebar";
import EpicList from "../components/EpicList";
import TeamFormModal from "../components/TeamFormModal";
import EpicFormModal from "../components/EpicFormModal";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import { deleteTeam, listTeams, type Team } from "../api/teams";
import { deleteEpic, listEpics, type Epic } from "../api/epics";

type ModalState =
  | { type: "create-team" }
  | { type: "rename-team"; team: Team }
  | { type: "delete-team"; team: Team }
  | { type: "create-epic" }
  | { type: "edit-epic"; epic: Epic }
  | { type: "delete-epic"; epic: Epic }
  | null;

export default function TeamsPage() {
  const qc = useQueryClient();

  const teamsQuery = useQuery({ queryKey: ["teams"], queryFn: listTeams });
  const epicsQuery = useQuery({ queryKey: ["epics"], queryFn: () => listEpics() });

  const teams = useMemo(() => teamsQuery.data ?? [], [teamsQuery.data]);
  const allEpics = useMemo(() => epicsQuery.data ?? [], [epicsQuery.data]);

  const epicCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const epic of allEpics) {
      counts[epic.teamId] = (counts[epic.teamId] ?? 0) + 1;
    }
    return counts;
  }, [allEpics]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>(null);

  // Keep a valid selection: default to the first team, and recover if the
  // selected team disappears (e.g. after a delete).
  useEffect(() => {
    if (teams.length === 0) {
      setSelectedId(null);
    } else if (!selectedId || !teams.some((t) => t.id === selectedId)) {
      setSelectedId(teams[0].id);
    }
  }, [teams, selectedId]);

  const selectedTeam = teams.find((t) => t.id === selectedId) ?? null;
  const selectedEpics = useMemo(
    () => allEpics.filter((e) => e.teamId === selectedId),
    [allEpics, selectedId],
  );

  const teamNameFor = (teamId: string) =>
    teams.find((t) => t.id === teamId)?.name ?? "";

  return (
    <div className="min-h-screen bg-slate-100">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="grid gap-4 md:grid-cols-[320px_1fr]">
          <TeamSidebar
            teams={teams}
            epicCounts={epicCounts}
            selectedId={selectedId}
            loading={teamsQuery.isPending}
            error={teamsQuery.isError}
            onSelect={setSelectedId}
            onCreate={() => setModal({ type: "create-team" })}
            onRename={(team) => setModal({ type: "rename-team", team })}
            onDelete={(team) => setModal({ type: "delete-team", team })}
            onRetry={() => teamsQuery.refetch()}
          />
          <EpicList
            team={selectedTeam}
            epics={selectedEpics}
            loading={epicsQuery.isPending}
            error={epicsQuery.isError}
            onCreate={() => setModal({ type: "create-epic" })}
            onEdit={(epic) => setModal({ type: "edit-epic", epic })}
            onDelete={(epic) => setModal({ type: "delete-epic", epic })}
            onRetry={() => epicsQuery.refetch()}
          />
        </div>
      </main>

      {modal?.type === "create-team" && (
        <TeamFormModal mode="create" onClose={() => setModal(null)} />
      )}
      {modal?.type === "rename-team" && (
        <TeamFormModal
          mode="rename"
          team={modal.team}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "delete-team" &&
        (() => {
          const count = epicCounts[modal.team.id] ?? 0;
          const blockedReason =
            count > 0
              ? `This team has ${count} epic${count === 1 ? "" : "s"}. Delete or reassign them before deleting the team.`
              : null;
          return (
            <ConfirmDeleteModal
              title={`Delete team “${modal.team.name}”?`}
              description="This can’t be undone."
              confirmLabel="Delete team"
              successMessage="Team deleted"
              blockedReason={blockedReason}
              onConfirm={async () => {
                await deleteTeam(modal.team.id);
                qc.invalidateQueries({ queryKey: ["teams"] });
              }}
              onClose={() => setModal(null)}
            />
          );
        })()}
      {modal?.type === "create-epic" && selectedTeam && (
        <EpicFormModal
          mode="create"
          teamId={selectedTeam.id}
          teamName={selectedTeam.name}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "edit-epic" && (
        <EpicFormModal
          mode="edit"
          teamId={modal.epic.teamId}
          teamName={teamNameFor(modal.epic.teamId)}
          epic={modal.epic}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "delete-epic" && (
        <ConfirmDeleteModal
          title={`Delete epic “${modal.epic.title}”?`}
          description="This can’t be undone."
          confirmLabel="Delete epic"
          successMessage="Epic deleted"
          onConfirm={async () => {
            await deleteEpic(modal.epic.id);
            qc.invalidateQueries({ queryKey: ["epics"] });
          }}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
