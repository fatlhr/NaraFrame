import { cp, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { runCli } from "@naraframe/cli";
import { afterEach, describe, expect, it, vi } from "vitest";

const sampleRoot = fileURLToPath(
  new URL("../../../../samples/krakatau-draft", import.meta.url),
);
const temporaryRoots: string[] = [];

const captureJsonResult = async (
  args: readonly string[],
  options?: { signal?: AbortSignal },
): Promise<{ exitCode: number; events: unknown[] }> => {
  const writes: string[] = [];
  vi.spyOn(process.stdout, "write").mockImplementation(((value: string) => {
    writes.push(value);
    return true;
  }) as typeof process.stdout.write);
  vi.spyOn(process.stderr, "write").mockImplementation(
    (() => true) as typeof process.stderr.write,
  );
  vi.spyOn(console, "error").mockImplementation(() => undefined);

  const exitCode = await runCli(args, options);
  return {
    exitCode,
    events: writes.map((value) => JSON.parse(value)),
  };
};

afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all(
    temporaryRoots
      .splice(0)
      .map((root) => rm(root, { recursive: true, force: true })),
  );
});

describe("public CLI command contract", () => {
  it("writes exactly one versioned result event for schema and plan validation", async () => {
    const schema = await captureJsonResult(["schema", "--json"]);
    expect(schema.exitCode).toBe(0);
    expect(schema.events).toHaveLength(1);
    expect(schema.events[0]).toMatchObject({
      schemaVersion: 1,
      type: "command-result",
      command: "schema",
      success: true,
    });

    vi.restoreAllMocks();
    const validation = await captureJsonResult([
      "validate",
      sampleRoot,
      "--stage",
      "plan",
      "--json",
    ]);
    expect(validation.exitCode).toBe(0);
    expect(validation.events).toHaveLength(1);
    expect(validation.events[0]).toMatchObject({
      schemaVersion: 1,
      type: "command-result",
      command: "validate",
      success: true,
      readiness: "draft-only",
      mode: "draft",
    });
  });

  it("uses stable result events for usage, source, and cancellation failures", async () => {
    const usage = await captureJsonResult(["preview", sampleRoot, "--json"]);
    expect(usage.exitCode).toBe(3);
    expect(usage.events).toEqual([
      expect.objectContaining({
        command: "preview",
        status: "failed",
        success: false,
        issues: [expect.objectContaining({ code: "CLI_USAGE" })],
      }),
    ]);

    vi.restoreAllMocks();
    const source = await captureJsonResult([
      "preview",
      sampleRoot,
      "--draft",
      "--scene",
      "not-a-scene",
      "--json",
    ]);
    expect(source.exitCode).toBe(1);
    expect(source.events).toHaveLength(1);
    expect(source.events[0]).toMatchObject({
      command: "preview",
      status: "failed",
      success: false,
      readiness: "invalid",
    });

    const controller = new AbortController();
    controller.abort();
    vi.restoreAllMocks();
    const interrupted = await captureJsonResult(
      ["preview", sampleRoot, "--draft", "--json"],
      { signal: controller.signal },
    );
    expect(interrupted.exitCode).toBe(130);
    expect(interrupted.events).toEqual([
      expect.objectContaining({
        command: "preview",
        status: "interrupted",
        success: false,
        issues: [expect.objectContaining({ code: "COMMAND_INTERRUPTED" })],
      }),
    ]);
  });

  it("creates a project through JSON mode and reports an absent valid preview", async () => {
    const root = await mkdtemp(join(tmpdir(), "naraframe-command-contract-"));
    temporaryRoots.push(root);
    const destination = join(root, "created");
    vi.restoreAllMocks();
    const created = await captureJsonResult([
      "create",
      destination,
      "--profile",
      "current-issues",
      "--json",
    ]);
    expect(created.exitCode).toBe(0);
    expect(created.events).toEqual([
      expect.objectContaining({
        command: "create",
        success: true,
        data: expect.objectContaining({ projectRoot: destination }),
      }),
    ]);

    const sourceOnly = join(root, "source-only");
    await Promise.all([
      cp(join(sampleRoot, "assets"), join(sourceOnly, "assets"), {
        recursive: true,
      }),
      ...["naraframe.json", "profile.lock.json", "scenes.json"].map((file) =>
        cp(join(sampleRoot, file), join(sourceOnly, file)),
      ),
    ]);
    vi.restoreAllMocks();
    const status = await captureJsonResult(["status", sourceOnly, "--json"]);
    expect(status.exitCode).toBe(0);
    expect(status.events).toEqual([
      expect.objectContaining({
        command: "status",
        success: true,
        buildId: null,
        data: expect.objectContaining({ previewState: "absent" }),
      }),
    ]);

    await mkdir(join(sourceOnly, "preview"));
    await writeFile(join(sourceOnly, "preview", "current.json"), "not-json\n");
    vi.restoreAllMocks();
    const corruptStatus = await captureJsonResult([
      "status",
      sourceOnly,
      "--json",
    ]);
    expect(corruptStatus.exitCode).toBe(2);
    expect(corruptStatus.events).toEqual([
      expect.objectContaining({
        command: "status",
        success: false,
        issues: [expect.objectContaining({ code: "PREVIEW_METADATA_INVALID" })],
      }),
    ]);
  });
});
