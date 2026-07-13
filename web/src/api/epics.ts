import { apiFetch } from "../lib/api";

export interface Epic {
  id: string;
  teamId: string;
  title: string;
  description: string | null;
  createdAt: string;
  modifiedAt: string;
}

export function listEpics(teamId?: string) {
  const qs = teamId ? `?teamId=${encodeURIComponent(teamId)}` : "";
  return apiFetch<{ epics: Epic[] }>(`/epics${qs}`).then((r) => r.epics);
}

export function createEpic(input: {
  teamId: string;
  title: string;
  description?: string | null;
}) {
  return apiFetch<{ epic: Epic }>("/epics", {
    method: "POST",
    body: JSON.stringify(input),
  }).then((r) => r.epic);
}

export function updateEpic(
  id: string,
  input: { title?: string; description?: string | null },
) {
  return apiFetch<{ epic: Epic }>(`/epics/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  }).then((r) => r.epic);
}

export function deleteEpic(id: string) {
  return apiFetch<null>(`/epics/${id}`, { method: "DELETE" });
}
