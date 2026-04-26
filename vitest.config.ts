import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.vitest.ts", "tests/**/*.vitest.tsx"],
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "."),
      "bun:sqlite": resolve(__dirname, "tests/__stubs__/bun-sqlite.ts"),
    },
  },
});
