import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const alias = {
  "@naraframe/core/image-placement": fileURLToPath(
    new URL("./packages/core/src/asset/image-placement.ts", import.meta.url),
  ),
  // Before the package alias, which would otherwise swallow the subpath.
  "@naraframe/core/count-format": fileURLToPath(
    new URL("./packages/core/src/count-format.ts", import.meta.url),
  ),
  "@naraframe/cli": fileURLToPath(
    new URL("./packages/cli/src/index.ts", import.meta.url),
  ),
  "@naraframe/core": fileURLToPath(
    new URL("./packages/core/src/index.ts", import.meta.url),
  ),
  "@naraframe/renderer-remotion": fileURLToPath(
    new URL("./packages/renderer-remotion/src/index.ts", import.meta.url),
  ),
};

export default defineConfig({
  test: {
    projects: [
      {
        resolve: { alias },
        test: {
          name: "unit",
          include: ["packages/**/test/unit/**/*.test.{ts,tsx}"],
        },
      },
      {
        resolve: { alias },
        test: {
          name: "integration",
          include: ["packages/**/test/integration/**/*.test.{ts,tsx}"],
          testTimeout: 120_000,
        },
      },
      {
        resolve: { alias },
        test: {
          name: "e2e",
          include: ["packages/**/test/e2e/**/*.test.{ts,tsx}"],
          fileParallelism: false,
          testTimeout: 300_000,
        },
      },
    ],
  },
});
