import { fileURLToPath } from "node:url";
import { runCli } from "@naraframe/cli";
import { afterEach, describe, expect, it, vi } from "vitest";

const sampleRoot = fileURLToPath(
  new URL("../../../../samples/krakatau-draft", import.meta.url),
);

afterEach(() => {
  vi.restoreAllMocks();
});

describe("validate command", () => {
  it("validates the runnable sample through the public CLI path", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    const exitCode = await runCli(["validate", sampleRoot]);

    expect(exitCode).toBe(0);
    expect(log).toHaveBeenCalledWith("Draft: 540x960 @ 30fps, 450 frames");
  });

  it("returns usage failure when the project argument is absent", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(runCli(["validate"])).resolves.toBe(3);
  });
});
