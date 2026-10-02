import { defineConfig } from "vitest/config";

export default defineConfig({
  // Relative asset paths, so the build runs from any folder: a preview link or a sub-path like /ai-projects/pawn-swarm/.
  base: "./",
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
  },
});
