import { createHash } from "node:crypto";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runCli } from "@naraframe/cli";
import type { PlanSource } from "@naraframe/core";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  narratedScene,
  narratedSource,
} from "../../../core/test/integration/narrated-source.js";

const roots: string[] = [];

interface Event {
  success: boolean;
  issues: Array<{ code: string; severity: string; artifact: string }>;
}

const run = async (
  ...args: string[]
): Promise<{ exitCode: number; event: Event }> => {
  const writes: string[] = [];
  vi.spyOn(process.stdout, "write").mockImplementation(((value: string) => {
    writes.push(String(value));
    return true;
  }) as typeof process.stdout.write);
  vi.spyOn(process.stderr, "write").mockImplementation(
    (() => true) as typeof process.stderr.write,
  );
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  const exitCode = await runCli([...args, "--json"]);
  vi.restoreAllMocks();
  return { exitCode, event: JSON.parse(writes.at(-1) ?? "{}") as Event };
};

afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all(
    roots.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
  );
});

/** A silent, strict-sourcing project with one scene on disk. */
const makeProject = async (
  scene: { carriesFactualClaim?: boolean; sourceIds?: string[] },
  sources?: Array<{ id: string; title: string }>,
  options: { requireSourcing?: boolean; sourcing?: unknown } = {},
): Promise<string> => {
  const root = await mkdtemp(join(tmpdir(), "naraframe-claims-"));
  roots.push(root);
  await mkdir(join(root, "assets"), { recursive: true });
  const base = narratedSource({
    requireSourcing: options.requireSourcing ?? true,
  });
  const source: PlanSource = {
    ...base,
    profile: {
      ...base.profile,
      direction: {
        text: "Probe direction.",
        sha256: createHash("sha256").update("Probe direction.").digest("hex"),
      },
    },
    scenes: {
      schemaVersion: 1,
      ...(sources ? { sources } : {}),
      scenes: [{ ...narratedScene("s1"), ...scene }],
    },
    assets: { schemaVersion: 1, assets: [] },
  };
  const write = (name: string, value: unknown) =>
    writeFile(join(root, name), JSON.stringify(value, null, 2));
  await write("naraframe.json", {
    ...source.project,
    audioMode: "silent",
    ...(options.sourcing ? { sourcing: options.sourcing } : {}),
  });
  await write("profile.lock.json", source.profile);
  await write("scenes.json", source.scenes);
  await write("assets/manifest.json", source.assets);
  return root;
};

const issueCodes = (event: Event) => event.issues.map((issue) => issue.code);

describe("validate: claim labelling under a strict profile", () => {
  it("reports one info note and still passes when nothing is labelled", async () => {
    const root = await makeProject({ carriesFactualClaim: false });
    for (const stage of ["plan", "production"]) {
      const { exitCode, event } = await run("validate", root, "--stage", stage);
      expect(exitCode, `${stage}: ${JSON.stringify(event.issues)}`).toBe(0);
      expect(event.success).toBe(true);
      const notes = event.issues.filter(
        (issue) => issue.code === "CLAIMS_UNLABELLED",
      );
      expect(notes, stage).toEqual([
        expect.objectContaining({ severity: "info", artifact: "scenes.json" }),
      ]);
    }
  });

  it("reports neither code for a labelled claim that cites a declared source", async () => {
    const root = await makeProject(
      { carriesFactualClaim: true, sourceIds: ["pvmbg"] },
      [{ id: "pvmbg", title: "PVMBG bulletin" }],
    );
    for (const stage of ["plan", "production"]) {
      const { exitCode, event } = await run("validate", root, "--stage", stage);
      expect(exitCode, `${stage}: ${JSON.stringify(event.issues)}`).toBe(0);
      expect(issueCodes(event)).not.toContain("CLAIMS_UNLABELLED");
      expect(issueCodes(event)).not.toContain("SOURCE_MISSING");
    }
  });

  it("fails with SOURCE_MISSING as an error, and no unlabelled note, once the source is removed", async () => {
    const root = await makeProject({ carriesFactualClaim: true });
    for (const stage of ["plan", "production"]) {
      const { exitCode, event } = await run("validate", root, "--stage", stage);
      expect(exitCode, stage).toBe(1);
      expect(event.success).toBe(false);
      expect(
        event.issues.filter((issue) => issue.code === "SOURCE_MISSING"),
      ).toEqual([expect.objectContaining({ severity: "error" })]);
      expect(issueCodes(event)).not.toContain("CLAIMS_UNLABELLED");
    }
  });
});

describe("validate: the owner's no-sources decision", () => {
  const sourcing = {
    ownerDecision: "no-sources",
    decidedBy: "Rina",
    decidedAt: "2026-10-18T09:30:00+07:00",
    reason: "A personal explainer.",
  };

  it("turns the per-claim warning into one info note when the profile does not require sourcing", async () => {
    const before = await run(
      "validate",
      await makeProject({ carriesFactualClaim: true }, undefined, {
        requireSourcing: false,
      }),
      "--stage",
      "plan",
    );
    expect(issueCodes(before.event)).toContain("SOURCE_MISSING");
    const after = await run(
      "validate",
      await makeProject({ carriesFactualClaim: true }, undefined, {
        requireSourcing: false,
        sourcing,
      }),
      "--stage",
      "plan",
    );
    expect(after.exitCode).toBe(0);
    expect(issueCodes(after.event)).not.toContain("SOURCE_MISSING");
    expect(issueCodes(after.event)).toContain("SOURCES_WAIVED");
  });

  it("does not relax a profile that requires sourcing", async () => {
    const result = await run(
      "validate",
      await makeProject({ carriesFactualClaim: true }, undefined, { sourcing }),
      "--stage",
      "plan",
    );
    expect(result.exitCode).toBe(1);
    expect(issueCodes(result.event)).toContain("SOURCE_MISSING");
    expect(issueCodes(result.event)).not.toContain("SOURCES_WAIVED");
  });
});
