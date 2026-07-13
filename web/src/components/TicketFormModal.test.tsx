import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import TicketFormModal from "./TicketFormModal";
import { ToastProvider } from "./Toast";

function renderModal(props: Partial<Parameters<typeof TicketFormModal>[0]> = {}) {
  const qc = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <ToastProvider>
        <TicketFormModal
          teamId="t1"
          teamName="Alpha"
          epics={[]}
          onClose={() => {}}
          onCreated={() => {}}
          {...props}
        />
      </ToastProvider>
    </QueryClientProvider>,
  );
}

describe("TicketFormModal", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 201,
        text: async () =>
          JSON.stringify({
            ticket: {
              id: "k1",
              teamId: "t1",
              epicId: null,
              type: "bug",
              state: "new",
              title: "Cannot log in",
              body: "Steps",
              createdById: "u1",
              createdAt: "",
              modifiedAt: "",
            },
          }),
      })),
    );
  });

  it("shows a validation error and does not call the API when the title is empty", async () => {
    renderModal();
    await userEvent.click(screen.getByRole("button", { name: "Create ticket" }));
    expect(await screen.findByText("Title is required.")).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("submits a POST and calls onCreated on success", async () => {
    const onCreated = vi.fn();
    renderModal({ onCreated });
    await userEvent.type(screen.getByLabelText("Title"), "Cannot log in");
    await userEvent.type(screen.getByLabelText("Body"), "Steps to reproduce");
    await userEvent.click(screen.getByRole("button", { name: "Create ticket" }));

    await waitFor(() => expect(onCreated).toHaveBeenCalled());
    expect(fetch).toHaveBeenCalledWith(
      "/api/tickets",
      expect.objectContaining({ method: "POST" }),
    );
  });
});
