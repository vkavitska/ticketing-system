import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EmptyState from "./EmptyState";
import ErrorState from "./ErrorState";

describe("EmptyState", () => {
  it("renders the title and description", () => {
    render(<EmptyState title="No teams yet" description="Create your first team" />);
    expect(screen.getByText("No teams yet")).toBeInTheDocument();
    expect(screen.getByText("Create your first team")).toBeInTheDocument();
  });
});

describe("ErrorState", () => {
  it("calls onRetry when Retry is clicked", async () => {
    const onRetry = vi.fn();
    render(<ErrorState message="Couldn’t load." onRetry={onRetry} />);
    await userEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("omits the Retry button when no handler is given", () => {
    render(<ErrorState message="Couldn’t load." />);
    expect(screen.queryByRole("button", { name: "Retry" })).toBeNull();
  });
});
