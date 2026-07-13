import { describe, it, expect } from "vitest";
import { stateLabel, typeLabel } from "./format";

describe("stateLabel", () => {
  it("humanizes underscored state enums", () => {
    expect(stateLabel("new")).toBe("New");
    expect(stateLabel("in_progress")).toBe("In progress");
    expect(stateLabel("ready_for_implementation")).toBe(
      "Ready for implementation",
    );
  });
});

describe("typeLabel", () => {
  it("capitalizes the type", () => {
    expect(typeLabel("bug")).toBe("Bug");
    expect(typeLabel("feature")).toBe("Feature");
    expect(typeLabel("fix")).toBe("Fix");
  });
});
