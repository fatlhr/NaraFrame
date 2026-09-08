import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { runCli } from "@naraframe/cli";
import { afterEach, describe, expect, it, vi } from "vitest";

const sampleRoot = fileURLToPath(
  new URL("../../../../samples/krakatau-draft", import.meta.url),
);
const temporaryRoots: string[] = [];

afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all(
    temporaryRoots
      .splice(0)
      .map((root) => rm(root, { recursive: true, force: true })),
  );
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

  it("creates a project from a repository profile through the public CLI path", async () => {
    const root = await mkdtemp(join(tmpdir(), "naraframe-cli-create-"));
    temporaryRoots.push(root);
    const destination = join(root, "created-project");
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    const exitCode = await runCli([
      "create",
      destination,
      "--profile",
      "current-issues",
    ]);

    expect(exitCode).toBe(0);
    expect(log).toHaveBeenCalledWith(`Created project: ${destination}`);
    await expect(
      runCli(["create", destination, "--profile", "current-issues"]),
    ).resolves.toBe(1);
  });
});
