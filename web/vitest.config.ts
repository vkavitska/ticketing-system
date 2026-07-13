import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Standalone from vite.config.ts so the production `tsc && vite build` is
// unaffected. jsdom + Testing Library for component tests.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    css: false,
  },
});
