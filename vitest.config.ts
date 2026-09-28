import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["./tests/unit/**/*.test.{ts,tsx}", "./tests/component/**/*.test.{ts,tsx}"],
    css: false,
    // Page-level component tests render whole pages over MSW; with every file
    // running in parallel the first render can pass 5s on slower machines.
    testTimeout: 15000,
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@tests": fileURLToPath(new URL("./tests", import.meta.url)),
    },
  },
});