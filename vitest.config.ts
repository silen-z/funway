import { defineConfig, coverageConfigDefaults } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      include: ["packages/fiveway"],
      exclude: ["**/dist/**", ...coverageConfigDefaults.exclude],
    },
  },
});
