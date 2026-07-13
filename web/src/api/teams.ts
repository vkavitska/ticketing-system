import { apiFetch } from "../lib/api";

export interface Team {
  id: string;
  name: string;
  createdAt: string;
  modifiedAt: string;
}

export function listTeams() {
  return apiFetch<{ teams: Team[] }>("/teams").then((r) => r.teams);
}

export function createTeam(name: string) {
  return apiFetch<{ team: Team }>("/teams", {
    method: "POST",
    body: JSON.stringify({ name }),
  }).then((r) => r.team);
}

export function renameTeam(id: string, name: string) {
  return apiFetch<{ team: Team }>(`/teams/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ name }),
  }).then((r) => r.team);
}

export function deleteTeam(id: string) {
  return apiFetch<null>(`/teams/${id}`, { method: "DELETE" });
}
