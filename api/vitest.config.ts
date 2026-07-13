import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Create + migrate a dedicated test database once per run.
    globalSetup: ["./tests/globalSetup.ts"],
    // Point env at the test database before any app module is imported.
    setupFiles: ["./tests/setupEnv.ts"],
    // Tests share one database; run files serially to avoid cross-talk.
    fileParallelism: false,
    hookTimeout: 30_000,
    testTimeout: 30_000,
  },
});
