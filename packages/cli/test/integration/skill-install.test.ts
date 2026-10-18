import { execFile } from "node:child_process";
import {
  cp,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rm,
  symlink,
  unlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { promisify } from "node:util";
import { afterEach, describe, expect, it, vi } from "vitest";
// Public installation helper; no renderer/private authoring API.
// @ts-expect-error Node script has no declarations.
import { installSkill } from "../../../../scripts/install-skill.mjs";

const run = promisify(execFile);
const injection = vi.hoisted(() => ({
  failPublication: false,
  concurrentWriter: false,
}));
vi.mock("node:fs/promises", async (importOriginal) => {
  const original = await importOriginal<typeof import("node:fs/promises")>();
  return {
    ...original,
    rename: async (from: string, to: string) => {
      if (injection.failPublication && from.endsWith("/candidate")) {
        if (injection.concurrentWriter) {
          await original.mkdir(to);
          await original.writeFile(
            join(to, "owner.txt"),
            "Concurrent owner files.",
          );
        }
        throw new Error("Injected publication failure");
      }
      return original.rename(from, to);
    },
  };
});
const roots: string[] = [];
afterEach(async () => {
  injection.failPublication = false;
  injection.concurrentWriter = false;
  await Promise.all(
    roots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
  );
});
const fixture = async () => {
  const root = await realpath(
    await mkdtemp(join(tmpdir(), "naraframe-skill-")),
  );
  roots.push(root);
  const engine = join(root, "engine with spaces"),
    project = join(root, "consumer project");
  await mkdir(join(engine, "skills/naraframe"), { recursive: true });
  await mkdir(project);
  await writeFile(
    join(engine, "skills/naraframe/SKILL.md"),
    "---\nname: naraframe\ndescription: Make videos.\n---\nRead [guide](guide.md).\n",
  );
  await writeFile(
    join(engine, "skills/naraframe/guide.md"),
    "Public engine instructions.\n",
  );
  // The launcher is a maintained file of the canonical skill, not generated.
  await mkdir(join(engine, "skills/naraframe/scripts"), { recursive: true });
  await cp(
    resolve("skills/naraframe/scripts/naraframe.mjs"),
    join(engine, "skills/naraframe/scripts/naraframe.mjs"),
  );
  const data = {
    version: "0.1.0",
    skillApiVersion: 1,
    sourceSchemaVersion: 1,
    renderEngine: "naraframe-draft/13",
    engineIdentity: "a".repeat(64),
    resourceRoot: engine,
  };
  const entry = join(engine, "cli.mjs");
  await writeFile(
    entry,
    `console.log(JSON.stringify({success:true,command:process.argv[2],data:${JSON.stringify(data)}}));\n`,
  );
  return { root, engine, project, entry, data };
};
const options = (f: Awaited<ReturnType<typeof fixture>>, host = "codex") => ({
  host,
  scope: "project",
  project: f.project,
  engineEntry: f.entry,
});
const expectCode = async (operation: Promise<unknown>, code: string) => {
  await expect(operation).rejects.toMatchObject({ code });
};

describe("canonical skill installation", () => {
  it("dry-run resolves version and destinations without writing host folders", async () => {
    const f = await fixture();
    const r = await installSkill({ ...options(f), dryRun: true });
    expect(r.writesPerformed).toBe(false);
    expect(r.destination).toBe(join(f.project, ".agents/skills/naraframe"));
    await expect(
      readFile(join(r.destination, "SKILL.md")),
    ).rejects.toMatchObject({ code: "ENOENT" });
  });
  it("installs the repository skill with its director-plan template and a resolvable Start here", async () => {
    const f = await fixture();
    await rm(join(f.engine, "skills/naraframe"), { recursive: true });
    await cp(resolve("skills/naraframe"), join(f.engine, "skills/naraframe"), {
      recursive: true,
    });
    const r = await installSkill(options(f));
    const receipt = JSON.parse(
      await readFile(join(r.destination, "installation.json"), "utf8"),
    );
    expect(Object.keys(receipt.files)).toContain("examples/director-plan.md");
    const plan = await readFile(
      join(r.destination, "examples/director-plan.md"),
      "utf8",
    );
    expect(plan).toContain("Not validated, not rendered");
    expect(plan.trimEnd().split("\n").at(-1)).toContain("install the engine");
    const skill = await readFile(join(r.destination, "SKILL.md"), "utf8");
    const lines = skill.split("\n");
    const start = lines.indexOf("## Start here");
    expect(start).toBeGreaterThan(0);
    // The orientation comes before any workflow and stays short.
    expect(start).toBeLessThan(lines.indexOf("## Workflow"));
    expect(lines.indexOf("## Workflow") - start).toBeLessThanOrEqual(15);
    expect(skill).toContain("profile list");
    expect(skill).toContain("profile new");
    expect(skill).toContain("SOURCES_WAIVED");
    // One first message carries the explanation, the question and the install options.
    expect(skill).toContain("as one message");
    expect(skill).toContain("one-off video or a series?");
    expect(skill).toContain("examples/director-plan.md");
  });
  it.each(["codex", "claude"])(
    "installs complete resources for %s and forwards argv outside checkout",
    async (host) => {
      const f = await fixture();
      const r = await installSkill(options(f, host));
      expect(await readFile(join(r.destination, "guide.md"), "utf8")).toBe(
        "Public engine instructions.\n",
      );
      const receipt = JSON.parse(
        await readFile(join(r.destination, "installation.json"), "utf8"),
      );
      expect(receipt.engineVersion).toBe("0.1.0");
      expect(receipt.resourceRoot).toBe(f.engine);
      const { stdout } = await run(
        process.execPath,
        [join(r.destination, "scripts/naraframe.mjs"), "schema", "--json"],
        { cwd: f.project },
      );
      expect(JSON.parse(stdout).command).toBe("schema");
    },
  );
  it("installs under an explicit isolated user root", async () => {
    const f = await fixture();
    const r = await installSkill({
      host: "claude",
      scope: "user",
      userRoot: f.project,
      engineEntry: f.entry,
    });
    expect(r.destination).toBe(join(f.project, ".claude/skills/naraframe"));
  });
  it("requires explicit update and refuses an edited install without changing it", async () => {
    const f = await fixture(),
      o = options(f);
    const r = await installSkill(o);
    await expectCode(installSkill(o), "SKILL_INSTALL_EXISTS");
    const target = join(r.destination, "guide.md");
    await writeFile(target, "Owner edits.\n");
    await expectCode(
      installSkill({ ...o, update: true }),
      "SKILL_INSTALL_EDITED",
    );
    await expectCode(
      installSkill({ ...o, remove: true }),
      "SKILL_INSTALL_EDITED",
    );
    expect(await readFile(target, "utf8")).toBe("Owner edits.\n");
  });
  it("updates unchanged owned files, then removes only that owned install", async () => {
    const f = await fixture(),
      o = options(f);
    const first = await installSkill(o);
    await writeFile(
      join(f.engine, "skills/naraframe/guide.md"),
      "Updated guide.\n",
    );
    const preview = await installSkill({ ...o, update: true, dryRun: true });
    expect(preview.writesPerformed).toBe(false);
    expect(await readFile(join(first.destination, "guide.md"), "utf8")).toBe(
      "Public engine instructions.\n",
    );
    await installSkill({ ...o, update: true });
    expect(await readFile(join(first.destination, "guide.md"), "utf8")).toBe(
      "Updated guide.\n",
    );
    await expectCode(
      installSkill({
        host: "claude",
        scope: "user",
        userRoot: f.project,
        remove: true,
      }),
      "SKILL_INSTALL_MISSING",
    );
    await installSkill({ ...o, remove: true });
    await expect(
      readFile(join(first.destination, "SKILL.md")),
    ).rejects.toMatchObject({ code: "ENOENT" });
    expect(
      await readFile(join(f.engine, "skills/naraframe/guide.md"), "utf8"),
    ).toBe("Updated guide.\n");
  });
  it("refuses unrelated folders and symlink destinations", async () => {
    const f = await fixture(),
      o = options(f),
      destination = join(f.project, ".agents/skills/naraframe");
    await mkdir(destination, { recursive: true });
    await writeFile(join(destination, "SKILL.md"), "Unrelated owner skill.");
    await expectCode(
      installSkill({ ...o, update: true }),
      "SKILL_INSTALL_CONFLICT",
    );
    expect(await readFile(join(destination, "SKILL.md"), "utf8")).toBe(
      "Unrelated owner skill.",
    );
    const second = await fixture();
    await mkdir(join(second.project, ".agents/skills"), { recursive: true });
    await symlink(
      join(second.engine, "skills/naraframe"),
      join(second.project, ".agents/skills/naraframe"),
    );
    await expectCode(installSkill(options(second)), "SKILL_INSTALL_CONFLICT");
  });
  it("restores the exact existing install when publishing an update fails", async () => {
    const f = await fixture(),
      o = options(f);
    const r = await installSkill(o);
    const before = await readFile(
      join(r.destination, "installation.json"),
      "utf8",
    );
    await writeFile(
      join(f.engine, "skills/naraframe/guide.md"),
      "New guide.\n",
    );
    injection.failPublication = true;
    await expect(installSkill({ ...o, update: true })).rejects.toThrow(
      "Injected publication failure",
    );
    expect(
      await readFile(join(r.destination, "installation.json"), "utf8"),
    ).toBe(before);
    expect(await readFile(join(r.destination, "guide.md"), "utf8")).toBe(
      "Public engine instructions.\n",
    );
  });
  it("refuses symlinked parents and canonical source entries", async () => {
    const f = await fixture();
    await symlink(f.engine, join(f.project, ".agents"));
    await expectCode(installSkill(options(f)), "SKILL_INSTALL_UNSAFE");
    const second = await fixture();
    await symlink(
      second.entry,
      join(second.engine, "skills/naraframe/unsafe.mjs"),
    );
    await expectCode(installSkill(options(second)), "SKILL_INSTALL_UNSAFE");
  });
  it("retains the old backup and concurrent owner files when publication fails", async () => {
    const f = await fixture();
    const r = await installSkill(options(f));
    const before = await readFile(
      join(r.destination, "installation.json"),
      "utf8",
    );
    const warning = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      injection.failPublication = true;
      injection.concurrentWriter = true;
      await expect(
        installSkill({ ...options(f), update: true }),
      ).rejects.toThrow("Injected publication failure");
      expect(await readFile(join(r.destination, "owner.txt"), "utf8")).toBe(
        "Concurrent owner files.",
      );
      const message = warning.mock.calls.find(([value]) =>
        String(value).startsWith("SKILL_INSTALL_RECOVERY:"),
      )?.[0];
      expect(message).toBeDefined();
      const backup = String(message).slice("SKILL_INSTALL_RECOVERY: ".length);
      expect(await readFile(join(backup, "installation.json"), "utf8")).toBe(
        before,
      );
      expect(await readFile(join(backup, "guide.md"), "utf8")).toBe(
        "Public engine instructions.\n",
      );
    } finally {
      warning.mockRestore();
    }
  });
  it("refuses a parent replaced during engine inspection without writing through it", async () => {
    const f = await fixture();
    const unrelated = join(f.root, "unrelated");
    await mkdir(unrelated);
    await mkdir(join(f.project, ".agents"));
    await writeFile(
      f.entry,
      [
        "import {rm,symlink} from 'node:fs/promises';",
        "await rm(" +
          JSON.stringify(join(f.project, ".agents")) +
          ",{recursive:true});",
        "await symlink(" +
          JSON.stringify(unrelated) +
          "," +
          JSON.stringify(join(f.project, ".agents")) +
          ");",
        "console.log(JSON.stringify({success:true,command:'version',data:" +
          JSON.stringify(f.data) +
          "}));",
      ].join("\n"),
    );
    await expectCode(installSkill(options(f)), "SKILL_INSTALL_UNSAFE");
    await expect(
      readFile(join(unrelated, "skills/naraframe/SKILL.md")),
    ).rejects.toMatchObject({ code: "ENOENT" });
  });
  it("refuses a same-version runtime identity change until an explicit update", async () => {
    const f = await fixture();
    const r = await installSkill(options(f));
    await writeFile(
      f.entry,
      "console.log(JSON.stringify({success:true,command:process.argv[2],data:" +
        JSON.stringify({ ...f.data, engineIdentity: "b".repeat(64) }) +
        "}));",
    );
    await expect(
      run(process.execPath, [
        join(r.destination, "scripts/naraframe.mjs"),
        "version",
        "--json",
      ]),
    ).rejects.toMatchObject({
      code: 2,
      stderr: expect.stringContaining("SKILL_ENGINE_CHANGED"),
    });
    await installSkill({ ...options(f), update: true });
    expect(
      JSON.parse(
        (
          await run(process.execPath, [
            join(r.destination, "scripts/naraframe.mjs"),
            "version",
            "--json",
          ])
        ).stdout,
      ).data.engineIdentity,
    ).toBe("b".repeat(64));
  });
  it("refuses incomplete relative references and an invalid canonical manifest", async () => {
    const f = await fixture();
    await rm(join(f.engine, "skills/naraframe/guide.md"));
    await expectCode(installSkill(options(f)), "SKILL_REFERENCE_MISSING");
    await writeFile(
      join(f.engine, "skills/naraframe/SKILL.md"),
      "No canonical frontmatter.",
    );
    await expectCode(installSkill(options(f)), "SKILL_SOURCE_INVALID");
  });
  it("installs the engine's own launcher file unchanged and records its hash", async () => {
    const f = await fixture();
    const r = await installSkill(options(f));
    const canonical = await readFile(
      join(f.engine, "skills/naraframe/scripts/naraframe.mjs"),
    );
    expect(
      await readFile(join(r.destination, "scripts/naraframe.mjs")),
    ).toEqual(canonical);
    const receipt = JSON.parse(
      await readFile(join(r.destination, "installation.json"), "utf8"),
    );
    expect(Object.keys(receipt.files)).toContain("scripts/naraframe.mjs");
    // An update with a changed launcher in the engine replaces it like any other file.
    await writeFile(
      join(f.engine, "skills/naraframe/scripts/naraframe.mjs"),
      "// changed launcher\n",
    );
    await installSkill({ ...options(f), update: true });
    expect(
      await readFile(join(r.destination, "scripts/naraframe.mjs"), "utf8"),
    ).toBe("// changed launcher\n");
  });
  it("refuses a canonical skill that ships no launcher", async () => {
    const f = await fixture();
    await rm(join(f.engine, "skills/naraframe/scripts"), { recursive: true });
    await expectCode(installSkill(options(f)), "SKILL_SOURCE_MISSING");
    await expect(
      readFile(join(f.project, ".agents/skills/naraframe/SKILL.md")),
    ).rejects.toMatchObject({ code: "ENOENT" });
  });
  it("refuses a missing/incompatible engine without creating an installation", async () => {
    const f = await fixture();
    await expectCode(
      installSkill({ ...options(f), engineEntry: join(f.root, "missing") }),
      "SKILL_ENGINE_MISSING",
    );
    await writeFile(
      f.entry,
      `console.log(JSON.stringify({success:true,command:'version',data:{skillApiVersion:2}}));\n`,
    );
    await expectCode(installSkill(options(f)), "SKILL_ENGINE_INCOMPATIBLE");
    await expect(
      readFile(join(f.project, ".agents/skills/naraframe/SKILL.md")),
    ).rejects.toMatchObject({ code: "ENOENT" });
  });
  it("launcher refuses a changed pinned engine rather than using it silently", async () => {
    const f = await fixture();
    const r = await installSkill(options(f));
    await writeFile(
      f.entry,
      `console.log(JSON.stringify({success:true,command:'version',data:${JSON.stringify({ ...f.data, version: "0.2.0" })}}));\n`,
    );
    await expect(
      run(process.execPath, [
        join(r.destination, "scripts/naraframe.mjs"),
        "schema",
        "--json",
      ]),
    ).rejects.toMatchObject({
      code: 2,
      stderr: expect.stringContaining("SKILL_ENGINE_CHANGED"),
    });
  });
  it("extra files are local edits, and invalid options never mutate an install", async () => {
    const f = await fixture();
    const r = await installSkill(options(f));
    await writeFile(join(r.destination, "extra.txt"), "Keep this.");
    await expectCode(
      installSkill({ ...options(f), update: true }),
      "SKILL_INSTALL_EDITED",
    );
    await expectCode(
      installSkill({ ...options(f), scope: "user" }),
      "SKILL_INSTALL_USAGE",
    );
    await expectCode(
      installSkill({ ...options(f), update: true, remove: true }),
      "SKILL_INSTALL_USAGE",
    );
  });
  describe("adopting a copied skill folder", () => {
    // A folder copied from the repository: canonical files, no receipt, no launcher.
    const copied = async (f: Awaited<ReturnType<typeof fixture>>) => {
      const destination = join(f.project, ".agents/skills/naraframe");
      await mkdir(join(f.project, ".agents/skills"), { recursive: true });
      await cp(join(f.engine, "skills/naraframe"), destination, {
        recursive: true,
      });
      return destination;
    };
    it("is refused without the flag, as before", async () => {
      const f = await fixture();
      await copied(f);
      await expectCode(installSkill(options(f)), "SKILL_INSTALL_CONFLICT");
    });
    it("binds a byte-identical copy: receipt, launcher, same files", async () => {
      const f = await fixture();
      const destination = await copied(f);
      const result = await installSkill({ ...options(f), adopt: true });
      expect(result).toMatchObject({
        action: "adopt",
        destination,
        writesPerformed: true,
      });
      const receipt = JSON.parse(
        await readFile(join(destination, "installation.json"), "utf8"),
      );
      expect(receipt.adopted).toBe(true);
      expect(receipt.engineVersion).toBe("0.1.0");
      expect(Object.keys(receipt.files).sort()).toEqual([
        "SKILL.md",
        "guide.md",
        "scripts/naraframe.mjs",
      ]);
      expect(await readFile(join(destination, "guide.md"), "utf8")).toBe(
        "Public engine instructions.\n",
      );
      const { stdout } = await run(
        process.execPath,
        [join(destination, "scripts/naraframe.mjs"), "schema", "--json"],
        { cwd: f.project },
      );
      expect(JSON.parse(stdout).command).toBe("schema");
      // Now an ordinary owned install: it needs --update, and --adopt does not bypass that.
      await expectCode(
        installSkill({ ...options(f), adopt: true }),
        "SKILL_INSTALL_EXISTS",
      );
      await installSkill({ ...options(f), update: true });
    });
    it("installs normally when nothing is there", async () => {
      const f = await fixture();
      const result = await installSkill({ ...options(f), adopt: true });
      expect(result.action).toBe("install");
    });
    it("refuses an edited file, leaving the folder untouched", async () => {
      const f = await fixture();
      const destination = await copied(f);
      await writeFile(join(destination, "guide.md"), "Local edit.\n");
      await expect(
        installSkill({ ...options(f), adopt: true }),
      ).rejects.toMatchObject({
        code: "SKILL_INSTALL_CONFLICT",
        message: expect.stringContaining("edited guide.md"),
      });
      expect(await readFile(join(destination, "guide.md"), "utf8")).toBe(
        "Local edit.\n",
      );
      await expect(
        readFile(join(destination, "installation.json")),
      ).rejects.toMatchObject({ code: "ENOENT" });
    });
    it("refuses an extra file or a missing file", async () => {
      const f = await fixture();
      const destination = await copied(f);
      await writeFile(join(destination, "notes.txt"), "Mine.\n");
      await expect(
        installSkill({ ...options(f), adopt: true }),
      ).rejects.toMatchObject({
        code: "SKILL_INSTALL_CONFLICT",
        message: expect.stringContaining("extra notes.txt"),
      });
      expect(await readFile(join(destination, "notes.txt"), "utf8")).toBe(
        "Mine.\n",
      );
      await unlink(join(destination, "notes.txt"));
      await unlink(join(destination, "guide.md"));
      await expect(
        installSkill({ ...options(f), adopt: true }),
      ).rejects.toMatchObject({
        code: "SKILL_INSTALL_CONFLICT",
        message: expect.stringContaining("missing guide.md"),
      });
    });
    it("refuses symlinks, an unreadable receipt and a symlinked destination", async () => {
      const f = await fixture();
      const destination = await copied(f);
      await unlink(join(destination, "guide.md"));
      await symlink(f.entry, join(destination, "guide.md"));
      await expectCode(
        installSkill({ ...options(f), adopt: true }),
        "SKILL_INSTALL_UNSAFE",
      );
      await unlink(join(destination, "guide.md"));
      await cp(
        join(f.engine, "skills/naraframe/guide.md"),
        join(destination, "guide.md"),
      );
      await writeFile(join(destination, "installation.json"), "{not json");
      await expectCode(
        installSkill({ ...options(f), adopt: true }),
        "SKILL_INSTALL_CONFLICT",
      );
      expect(
        await readFile(join(destination, "installation.json"), "utf8"),
      ).toBe("{not json");
      const second = await fixture();
      await mkdir(join(second.project, ".agents/skills"), { recursive: true });
      await symlink(
        join(second.engine, "skills/naraframe"),
        join(second.project, ".agents/skills/naraframe"),
      );
      await expectCode(
        installSkill({ ...options(second), adopt: true }),
        "SKILL_INSTALL_CONFLICT",
      );
    });
    it("dry-run reports the adoption, or the refusal, and writes nothing", async () => {
      const f = await fixture();
      const destination = await copied(f);
      const result = await installSkill({
        ...options(f),
        adopt: true,
        dryRun: true,
      });
      expect(result).toMatchObject({ action: "adopt", writesPerformed: false });
      await expect(
        readFile(join(destination, "installation.json")),
      ).rejects.toMatchObject({ code: "ENOENT" });
      await writeFile(join(destination, "SKILL.md"), "Changed.\n");
      await expectCode(
        installSkill({ ...options(f), adopt: true, dryRun: true }),
        "SKILL_INSTALL_CONFLICT",
      );
    });
    it("cannot be combined with update or remove", async () => {
      const f = await fixture();
      await expectCode(
        installSkill({ ...options(f), adopt: true, update: true }),
        "SKILL_INSTALL_USAGE",
      );
      await expectCode(
        installSkill({ ...options(f), adopt: true, remove: true }),
        "SKILL_INSTALL_USAGE",
      );
    });
  });
  describe("launcher bootstrap failures", () => {
    const launch = async (destination: string) => {
      try {
        await run(process.execPath, [
          join(destination, "scripts/naraframe.mjs"),
          "version",
          "--json",
        ]);
      } catch (error) {
        return error as { code: number; stderr: string; stdout: string };
      }
      throw new Error("The launcher unexpectedly succeeded.");
    };
    const expectOneLine = (stderr: string, code: string) => {
      expect(stderr.endsWith("\n")).toBe(true);
      expect(stderr.trimEnd().split("\n")).toHaveLength(1);
      expect(stderr).toMatch(
        new RegExp(`^${code}: .+\\. Next: .+ \\(see installation\\.md\\)\\n$`),
      );
      expect(stderr).not.toMatch(/Node\.js v|\n\s+at |node:internal|Error:/);
    };
    it("prints one line, no stack trace, when the engine entry is gone", async () => {
      const f = await fixture();
      const r = await installSkill(options(f));
      await rm(f.entry);
      const failed = await launch(r.destination);
      expect(failed.code).toBe(2);
      expect(failed.stdout).toBe("");
      expectOneLine(failed.stderr, "SKILL_ENGINE_MISSING");
      expect(failed.stderr).toContain("setup-engine.mjs");
    });
    it("hides the stack trace of an engine that crashes", async () => {
      const f = await fixture();
      const r = await installSkill(options(f));
      await writeFile(
        f.entry,
        "function broken(){throw new Error('internal failure');}\nbroken();\n",
      );
      const failed = await launch(r.destination);
      expect(failed.code).toBe(2);
      expectOneLine(failed.stderr, "SKILL_ENGINE_MISSING");
    });
    it("prints one line for an unreadable receipt and for a changed engine", async () => {
      const f = await fixture();
      const r = await installSkill(options(f));
      await writeFile(
        f.entry,
        `console.log(JSON.stringify({success:true,command:'version',data:${JSON.stringify({ ...f.data, version: "0.2.0" })}}));\n`,
      );
      expectOneLine(
        (await launch(r.destination)).stderr,
        "SKILL_ENGINE_CHANGED",
      );
      await writeFile(join(r.destination, "installation.json"), "nope");
      const failed = await launch(r.destination);
      expect(failed.code).toBe(2);
      expectOneLine(failed.stderr, "SKILL_INSTALL_INVALID");
    });
  });
  it("the public helper emits one JSON result for incorrect usage", async () => {
    const script = resolve("scripts/install-skill.mjs");
    await expect(
      run(process.execPath, [
        script,
        "--host",
        "codex",
        "--host",
        "claude",
        "--json",
      ]),
    ).rejects.toMatchObject({
      code: 1,
      stdout: expect.stringContaining('"SKILL_INSTALL_USAGE"'),
    });
  });
});
