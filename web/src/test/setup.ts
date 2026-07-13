import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// Unmount React trees and restore any global stubs (e.g. fetch) between tests.
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
