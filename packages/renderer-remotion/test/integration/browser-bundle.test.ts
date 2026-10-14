import { rm } from "node:fs/promises";
import { resolve } from "node:path";
import { bundle } from "@remotion/bundler";
import { expect, it } from "vitest";

// Regression: a runtime import from the core root pulls node:child_process
// into Webpack and fails before the first cropped preview can start.
it("bundles the actual renderer entry with the browser-safe image geometry export", async () => {
  const directory = await bundle({
    entryPoint: resolve("packages/renderer-remotion/src/remotion/entry.tsx"),
    rootDir: resolve("packages/renderer-remotion"),
    webpackOverride: (configuration) => ({
      ...configuration,
      resolve: {
        ...configuration.resolve,
        extensionAlias: {
          ...configuration.resolve?.extensionAlias,
          ".js": [".tsx", ".ts", ".js"],
        },
      },
    }),
  });
  try {
    expect(directory).toContain("remotion-webpack-bundle-");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
