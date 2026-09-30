import { execFileSync, spawn } from "node:child_process";
import { cp, mkdtemp, readdir, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

// M3.1-A: a real CLI process interrupted while frames render (renderMedia)
// leaves the previous preview current, cleans up after itself, leaves no
// browser processes behind, and the next forced render publishes normally.
// Cancellation during bundling, composition selection or post-processing is
// not covered here.

const repositoryRoot = fileURLToPath(new URL("../../../..", import.meta.url));
const sampleRoot = join(repositoryRoot, "samples", "krakatau-draft");
const cliEntry = join(repositoryRoot, "packages", "cli", "dist", "index.js");
const temporaryRoots: string[] = [];
const processes: OwnedProcess[] = [];

interface Event {
  status: string;
  success: boolean;
  buildId: string | null;
  issues: Array<{ code: string }>;
  data: Record<string, unknown>;
}

interface ProcessIdentity {
  pid: number;
  ppid: number;
  pgid: number;
  start: string;
  command: string;
}

afterEach(async () => {
  // Never remove a project's files while one of its verified processes lives.
  await teardownProcesses();
  await Promise.all(
    temporaryRoots
      .splice(0)
      .map((root) => rm(root, { recursive: true, force: true })),
  );
});

const cli = async (project: string, ...args: string[]): Promise<Event> => {
  const child = ownedSpawn(process.execPath, [
    cliEntry,
    ...args,
    project,
    "--json",
  ]);
  const exit = await child.wait(180_000);
  expect(exit, child.stderr).toEqual({ code: 0, signal: null });
  const stdout = child.stdout;
  const lines = stdout.trim().split("\n").filter(Boolean);
  expect(lines).toHaveLength(1);
  return JSON.parse(lines[0] ?? "{}") as Event;
};

const processTable = (): ProcessIdentity[] =>
  execFileSync("ps", ["-A", "-o", "pid=,ppid=,pgid=,lstart=,command="], {
    encoding: "utf8",
  })
    .split("\n")
    .flatMap((line) => {
      const match = line
        .trim()
        .match(
          /^(\d+)\s+(\d+)\s+(\d+)\s+(\w{3}\s+\w{3}\s+\d+\s+[\d:]+\s+\d{4})\s+(.*)$/,
        );
      return match
        ? [
            {
              pid: Number(match[1]),
              ppid: Number(match[2]),
              pgid: Number(match[3]),
              start: match[4] ?? "",
              command: match[5] ?? "",
            },
          ]
        : [];
    });

const descendantsOf = (root: number): ProcessIdentity[] => {
  const table = processTable();
  const found: ProcessIdentity[] = [];
  const queue = [root];
  while (queue.length > 0) {
    const parent = queue.shift();
    for (const row of table) {
      if (row.ppid === parent) {
        found.push(row);
        queue.push(row.pid);
      }
    }
  }
  return found;
};

/** The same process (pid, start time and command), wherever it is parented now. */
const stillRunning = (identity: ProcessIdentity): boolean =>
  processTable().some(
    (row) =>
      row.pid === identity.pid &&
      row.start === identity.start &&
      row.command === identity.command,
  );

const listing = async (path: string): Promise<string[]> => {
  try {
    return (await readdir(path)).sort();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    return [];
  }
};

const exists = async (path: string): Promise<boolean> =>
  stat(path).then(
    () => true,
    (error: NodeJS.ErrnoException) => {
      if (error.code !== "ENOENT") throw error;
      return false;
    },
  );

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const sameProcess = (a: ProcessIdentity, b: ProcessIdentity) =>
  a.pid === b.pid && a.start === b.start && a.command === b.command;

class OwnedProcess {
  readonly child;
  readonly identities = new Map<number, ProcessIdentity>();
  stdout = "";
  stderr = "";
  private readonly completion: Promise<{
    code: number | null;
    signal: string | null;
  }>;
  private readonly tracker;
  private captureError: unknown;

  constructor(command: string, args: string[]) {
    processTable(); // Fail before spawning if ownership inspection is unavailable.
    // A dedicated session lets us discover descendants even after reparenting.
    this.child = spawn(command, args, {
      detached: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
    this.completion = new Promise((resolve, reject) => {
      this.child.once("error", reject);
      this.child.once("exit", (code, signal) => {
        clearInterval(this.tracker);
        const drain = setTimeout(
          () => reject(new Error("Output did not close within 2 s.")),
          2_000,
        );
        this.child.once("close", () => {
          clearTimeout(drain);
          resolve({ code, signal });
        });
      });
    });
    // Spawn errors can arrive before callers begin awaiting completion.
    void this.completion.catch(() => {});
    this.child.stdout.on("data", (chunk) => {
      this.stdout = (this.stdout + chunk).slice(-16 * 1024 * 1024);
    });
    this.child.stderr.on("data", (chunk) => {
      this.stderr = (this.stderr + chunk).slice(-16 * 1024 * 1024);
    });
    this.tracker = setInterval(() => {
      try {
        this.capture();
      } catch (error) {
        this.captureError = error;
      }
    }, 50);
    try {
      this.capture();
    } catch (error) {
      this.captureError = error;
    }
  }

  capture() {
    if (!this.child.pid) return;
    const table = processTable();
    const root = table.find((row) => row.pid === this.child.pid);
    const knownRoot = this.identities.get(this.child.pid);
    const anchored =
      (root && (!knownRoot || sameProcess(root, knownRoot))) ||
      table.some((row) => {
        const known = this.identities.get(row.pid);
        return known && sameProcess(row, known);
      });
    if (anchored)
      for (const row of table) {
        if (row.pgid === this.child.pid) this.identities.set(row.pid, row);
      }
  }

  async wait(timeout: number) {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let inspection: ReturnType<typeof setInterval> | undefined;
    try {
      if (this.captureError) throw this.captureError;
      return await Promise.race([
        this.completion,
        new Promise<never>((_, reject) => {
          timer = setTimeout(
            () => reject(new Error(`Process timed out after ${timeout} ms.`)),
            timeout,
          );
        }),
        new Promise<never>((_, reject) => {
          inspection = setInterval(() => {
            if (this.captureError) reject(this.captureError);
          }, 50);
        }),
      ]);
    } catch (error) {
      this.capture();
      // Snapshot BEFORE teardown: cleanup cannot erase the original finding.
      throw new Error(
        `${String(error)}\nstdout: ${this.stdout}\nstderr: ${this.stderr}\nsurvivors: ${JSON.stringify([...this.identities.values()].filter(stillRunning))}`,
        { cause: error },
      );
    } finally {
      clearTimeout(timer);
      clearInterval(inspection);
    }
  }

  async teardown() {
    clearInterval(this.tracker);
    this.capture();
    for (const signal of ["SIGTERM", "SIGKILL"] as const) {
      for (const identity of [...this.identities.values()].reverse()) {
        if (stillRunning(identity)) {
          try {
            process.kill(identity.pid, signal);
          } catch (error) {
            if ((error as NodeJS.ErrnoException).code !== "ESRCH") throw error;
          }
        }
      }
      const deadline = Date.now() + 2_000;
      while (
        [...this.identities.values()].some(stillRunning) &&
        Date.now() < deadline
      )
        await pause(50);
    }
    const survivors = [...this.identities.values()].filter(stillRunning);
    if (survivors.length)
      throw new Error(`Teardown survivors: ${JSON.stringify(survivors)}`);
    // An orphan may have held these pipes open. Destroy only after processes stop.
    this.child.stdout.destroy();
    this.child.stderr.destroy();
  }
}

const ownedSpawn = (command: string, args: string[]) => {
  const child = new OwnedProcess(command, args);
  processes.push(child);
  return child;
};
const teardownProcesses = async () => {
  const results = await Promise.allSettled(
    processes.map((child) => child.teardown()),
  );
  const failures = results.flatMap((result) =>
    result.status === "rejected" ? [result.reason] : [],
  );
  if (failures.length)
    throw new AggregateError(
      failures,
      "Test process teardown failed; temporary files retained.",
    );
  processes.length = 0;
};

const withTeardown = async (trial: () => Promise<void>) => {
  let failure: unknown;
  let cleanupFailure: unknown;
  try {
    await trial();
  } catch (error) {
    failure = error;
    // Preserve assertion/spawn/timeout evidence before emergency cleanup.
    const survivors = processes.flatMap((child) =>
      [...child.identities.values()].filter(stillRunning),
    );
    failure = new Error(
      `${String(error)}\nSurvivors before teardown: ${JSON.stringify(survivors)}`,
      { cause: error },
    );
  } finally {
    try {
      await teardownProcesses();
    } catch (cleanupError) {
      cleanupFailure = cleanupError;
    }
  }
  if (cleanupFailure)
    throw new AggregateError(
      failure ? [failure, cleanupFailure] : [cleanupFailure],
      "Teardown failed; original failure retained and temporary files kept.",
    );
  if (failure) throw failure;
};

describe("interruption during rendering", () => {
  it("keeps the previous preview, cleans up, leaves no browser behind, and recovers", async () => {
    await withTeardown(async () => {
      const root = await mkdtemp(join(tmpdir(), "naraframe-interrupt-"));
      temporaryRoots.push(root);
      const project = join(root, "project");
      await cp(sampleRoot, project, {
        recursive: true,
        filter: (source) =>
          !/[\\/](\.naraframe|preview|revisions)([\\/]|$)/.test(
            source.slice(sampleRoot.length),
          ),
      });

      const baseline = await cli(project, "preview", "--draft");
      expect(baseline.success).toBe(true);
      const pointerPath = join(project, "preview", "current.json");
      const pointerBefore = await readFile(pointerPath, "utf8");
      const buildsBefore = await listing(join(project, "preview", "builds"));

      // The CLI itself, not a wrapper, so the signal reaches its own handler.
      const owned = ownedSpawn(process.execPath, [
        cliEntry,
        "preview",
        project,
        "--draft",
        "--rerender",
        "--json",
      ]);
      const child = owned.child;
      let stderr = "";
      let trigger: number | null = null;
      let reachedEnd = false;
      let descendants: ProcessIdentity[] = [];
      child.stderr.on("data", (chunk) => {
        stderr += chunk;
        if (trigger !== null) return;
        const progress = [...stderr.matchAll(/Render (\d+)%/g)].map((match) =>
          Number(match[1]),
        );
        if (progress.some((value) => value >= 100)) reachedEnd = true;
        const inRender = progress.find((value) => value >= 10 && value <= 90);
        if (inRender !== undefined && !reachedEnd) {
          trigger = inRender;
          owned.capture();
          descendants = descendantsOf(child.pid ?? -1);
          child.kill("SIGINT");
        }
      });
      const exit = await owned.wait(120_000);

      // Interrupted while rendering frames, not after.
      expect(trigger, stderr.slice(-400)).not.toBeNull();
      expect(reachedEnd).toBe(false);
      expect(descendants.length).toBeGreaterThan(0);

      expect(exit).toEqual({ code: 130, signal: null });
      const lines = owned.stdout.trim().split("\n").filter(Boolean);
      expect(lines).toHaveLength(1);
      const interrupted = JSON.parse(lines[0] ?? "{}") as Event;
      expect(interrupted.status).toBe("interrupted");
      expect(interrupted.success).toBe(false);
      expect(interrupted.issues.map((issue) => issue.code)).toEqual([
        "COMMAND_INTERRUPTED",
      ]);

      // The previous preview stays current and nothing partial is published.
      expect(await readFile(pointerPath, "utf8")).toBe(pointerBefore);
      expect(await listing(join(project, "preview", "builds"))).toEqual(
        buildsBefore,
      );
      // Cleanup is automatic: no attempt, no lock.
      expect(await listing(join(project, ".naraframe", "attempts"))).toEqual(
        [],
      );
      expect(await exists(join(project, ".naraframe", "lock"))).toBe(false);

      // No browser process of this run survives, orphaned or not.
      const deadline = Date.now() + 10_000;
      let survivors = descendants.filter(stillRunning);
      while (survivors.length > 0 && Date.now() < deadline) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        survivors = descendants.filter(stillRunning);
      }
      expect(survivors.map((row) => `${row.pid} ${row.command}`)).toEqual([]);

      // The next forced render publishes a fresh build.
      const recovered = await cli(project, "preview", "--draft", "--rerender");
      expect(recovered.success).toBe(true);
      expect(recovered.data.reusedFromBuildId).toBeNull();
      expect(recovered.buildId).not.toBe(baseline.buildId);
    });
  }, 600_000);
});

describe("harness teardown", () => {
  const treeScript = `const {spawn}=require('node:child_process');
    const child=spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{stdio:'inherit'});
    console.log('ready '+child.pid); setInterval(()=>{},1000);`;
  const ready = async (child: OwnedProcess) => {
    const deadline = Date.now() + 5_000;
    while (!child.stdout.includes("ready ") && Date.now() < deadline)
      await pause(25);
    expect(child.stdout).toContain("ready ");
    child.capture();
    expect(child.identities.size).toBeGreaterThan(1);
  };

  it("harness preserves timeout survivors and stops the owned tree", async () => {
    const child = ownedSpawn(process.execPath, ["-e", treeScript]);
    await expect(
      withTeardown(async () => {
        await ready(child);
        await child.wait(30);
      }),
    ).rejects.toThrow(/timed out.*[\s\S]*survivors: \[\{/);
    expect([...child.identities.values()].filter(stillRunning)).toEqual([]);
  });

  it("harness retains an assertion failure while finally stops descendants", async () => {
    const child = ownedSpawn(process.execPath, ["-e", treeScript]);
    const trial = () =>
      withTeardown(async () => {
        await ready(child);
        expect([...child.identities.values()].filter(stillRunning)).toEqual([]);
      });
    await expect(trial()).rejects.toThrow(/Survivors before teardown: \[\{/);
    expect([...child.identities.values()].filter(stillRunning)).toEqual([]);
  });

  it("harness handles spawn errors and drains successful output", async () => {
    try {
      const missing = ownedSpawn("/naraframe-test-missing-executable", []);
      await expect(missing.wait(1_000)).rejects.toThrow(/ENOENT/);
      const child = ownedSpawn(process.execPath, [
        "-e",
        "process.stdout.write('complete');process.stderr.write('diagnostic');",
      ]);
      expect(await child.wait(5_000)).toEqual({ code: 0, signal: null });
      expect(child.stdout).toBe("complete");
      expect(child.stderr).toBe("diagnostic");
    } finally {
      await teardownProcesses();
    }
  });
});
