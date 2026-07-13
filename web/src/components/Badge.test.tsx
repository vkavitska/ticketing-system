import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StateBadge, TypeBadge } from "./Badge";

describe("Badge", () => {
  it("renders a humanized type label", () => {
    render(<TypeBadge type="feature" />);
    expect(screen.getByText("Feature")).toBeInTheDocument();
  });

  it("renders a humanized state label", () => {
    render(<StateBadge state="ready_for_acceptance" />);
    expect(screen.getByText("Ready for acceptance")).toBeInTheDocument();
  });
});
