import { describe, expect, it } from "vitest";

describe("CLI test discovery", () => {
  it("loads CLI and dependency source aliases", async () => {
    const cli = await import("@naraframe/cli");

    expect(cli.cliPackage).toBe("@naraframe/cli");
    expect(cli.cliDependencies).toEqual([
      "@naraframe/core",
      "@naraframe/renderer-remotion",
    ]);
    expect(cli.runCli).toEqual(expect.any(Function));
    expect(cli.runCliProcess).toEqual(expect.any(Function));
  });
});
