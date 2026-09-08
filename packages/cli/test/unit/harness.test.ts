import { describe, expect, it } from "vitest";

describe("CLI test discovery", () => {
  it("loads CLI and dependency source aliases", async () => {
    const { cliDependencies, cliPackage } = await import("@naraframe/cli");

    expect(cliPackage).toBe("@naraframe/cli");
    expect(cliDependencies).toEqual([
      "@naraframe/core",
      "@naraframe/renderer-remotion",
    ]);
  });
});
