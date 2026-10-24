import { execFile, execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  chmod,
  cp,
  lstat,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  realpath,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const run = promisify(execFile);
const repository = fileURLToPath(new URL("../../../../", import.meta.url));
// biome-ignore lint/suspicious/noExplicitAny: test helper reads arbitrary JSON files
const json = async (path: string): Promise<any> =>
  JSON.parse(await readFile(path, "utf8"));

let scratch: string;
let home: string;
let tools: Record<string, string>;
let tarball: string;
let wrongVersionTarball: string;
let counter = 0;

// A stand-in for the published package: the real installer and the real skill
// folder around a CLI that answers `version` and `doctor` like the engine does.
// It lets the real setup script run npm and the real installer without a network.
const fakeCli = `import {dirname,join} from 'node:path';
import {realpathSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const root=realpathSync(join(dirname(fileURLToPath(import.meta.url)),'../../..'));
const command=process.argv[2];
const event=(extra)=>JSON.stringify({schemaVersion:1,type:'command-result',command,...extra});
if(command==='version')console.log(event({success:true,data:{version:VERSION,skillApiVersion:1,sourceSchemaVersion:1,renderEngine:'naraframe-draft/13',engineIdentity:'c'.repeat(64),resourceRoot:root}}));
else if(command==='doctor'){
  const missing=process.env.FAKE_DOCTOR_FAIL==='1';
  console.log(event({success:!missing,issues:missing?[{code:'BROWSER_NOT_PROVISIONED',message:'Browser is not available.'}]:[],data:{checks:[{id:'browser',status:missing?'missing':'ready',detail:'fake'}]}}));
  process.exitCode=missing?2:0;
}else console.log(event({success:true,data:{argv:process.argv.slice(3)}}));
`;
const buildPackage = async (
  name: string,
  version: string,
  destination: string,
): Promise<string> => {
  const directory = join(scratch, `package-${name}`);
  await mkdir(join(directory, "packages/cli/dist"), { recursive: true });
  await mkdir(join(directory, "scripts"), { recursive: true });
  await writeFile(
    join(directory, "package.json"),
    JSON.stringify({
      name: "naraframe",
      version,
      type: "module",
      bin: { naraframe: "packages/cli/dist/index.js" },
    }),
  );
  await writeFile(
    join(directory, "packages/cli/dist/index.js"),
    fakeCli.replace("VERSION", JSON.stringify(version)),
  );
  await cp(
    join(repository, "scripts/install-skill.mjs"),
    join(directory, "scripts/install-skill.mjs"),
  );
  await cp(
    join(repository, "skills/naraframe"),
    join(directory, "skills/naraframe"),
    { recursive: true },
  );
  await mkdir(destination, { recursive: true });
  const packed = JSON.parse(
    execFileSync(
      "npm",
      [
        "pack",
        "--json",
        "--offline",
        "--ignore-scripts",
        "--cache",
        join(scratch, "npm-cache"),
        "--pack-destination",
        destination,
      ],
      { cwd: directory, encoding: "utf8" },
    ),
  )[0];
  return join(destination, packed.filename);
};

beforeAll(async () => {
  scratch = await realpath(
    await mkdtemp(join(tmpdir(), "naraframe-engine-setup ")),
  );
  home = join(scratch, "home");
  await mkdir(home);
  // Present prerequisites, so the tests do not depend on this machine's tools.
  tools = {};
  for (const [name, variable] of [
    ["browser", "NARAFRAME_BROWSER_EXECUTABLE"],
    ["ffmpeg", "NARAFRAME_FFMPEG_EXECUTABLE"],
    ["ffprobe", "NARAFRAME_FFPROBE_EXECUTABLE"],
    ["font", "NARAFRAME_FONT_FILE"],
  ]) {
    const path = join(scratch, `tool-${name}`);
    await writeFile(path, "#!/bin/sh\necho fake 1.0\n");
    await chmod(path, 0o755);
    tools[variable] = path;
  }
  const declared = await json(join(repository, "skills/naraframe/engine.json"));
  tarball = await buildPackage(
    "good",
    declared.version,
    join(scratch, "tarballs"),
  );
  wrongVersionTarball = await buildPackage(
    "wrong",
    "9.9.9",
    join(scratch, "tarballs-wrong"),
  );
}, 120_000);

afterAll(async () => {
  // Read-only skill folders (simulated plugin caches) must be writable to remove.
  if (scratch) {
    try {
      execFileSync("chmod", ["-R", "u+w", scratch]);
    } catch {}
    await rm(scratch, { recursive: true, force: true });
  }
});

// Every path, mode and content in a tree, as one hash.
const treeHash = async (directory: string): Promise<string> => {
  const hash = createHash("sha256");
  const walk = async (current: string, prefix: string): Promise<void> => {
    for (const entry of (await readdir(current)).sort()) {
      const path = join(current, entry);
      const stat = await lstat(path);
      hash.update(`${prefix}${entry}:${stat.mode.toString(8)}\n`);
      if (stat.isDirectory()) await walk(path, `${prefix}${entry}/`);
      else hash.update(await readFile(path));
    }
  };
  await walk(directory, "");
  return hash.digest("hex");
};

// A fresh project holding only a copied skill folder, as from GitHub, and its
// own NARAFRAME_HOME.
const project = async () => {
  const directory = join(scratch, `project-${++counter}`);
  await mkdir(directory);
  const skill = join(directory, ".claude/skills/naraframe");
  await mkdir(join(directory, ".claude/skills"), { recursive: true });
  await cp(join(repository, "skills/naraframe"), skill, { recursive: true });
  const naraframeHome = join(scratch, `naraframe-home-${counter}`);
  return {
    directory,
    skill,
    naraframeHome,
    engineDir: join(naraframeHome, "engine", "0.1.2"),
  };
};
type Project = Awaited<ReturnType<typeof project>>;
const environment = (
  p: Project,
  env: Record<string, string | undefined> = {},
) => {
  const merged: Record<string, string | undefined> = {
    ...process.env,
    ...tools,
    HOME: home,
    NARAFRAME_HOME: p.naraframeHome,
    NPM_CONFIG_CACHE: join(scratch, "npm-cache"),
    NPM_CONFIG_UPDATE_NOTIFIER: "false",
    ...env,
  };
  for (const key of Object.keys(merged))
    if (merged[key] === undefined) delete merged[key];
  return merged as Record<string, string>;
};
const setup = async (
  p: Project,
  args: string[],
  env: Record<string, string | undefined> = {},
) => {
  try {
    const { stdout, stderr } = await run(
      process.execPath,
      [join(p.skill, "scripts/setup-engine.mjs"), ...args],
      { cwd: scratch, env: environment(p, env) },
    );
    return { code: 0, stdout, stderr };
  } catch (error) {
    const { code, stdout, stderr } = error as {
      code: number;
      stdout: string;
      stderr: string;
    };
    return { code, stdout, stderr };
  }
};
const launcher = async (
  p: Project,
  args: string[],
  env: Record<string, string | undefined> = {},
) => {
  try {
    const { stdout, stderr } = await run(
      process.execPath,
      [join(p.skill, "scripts/naraframe.mjs"), ...args],
      { cwd: scratch, env: environment(p, env) },
    );
    return { code: 0, stdout, stderr };
  } catch (error) {
    const { code, stdout, stderr } = error as {
      code: number;
      stdout: string;
      stderr: string;
    };
    return { code, stdout, stderr };
  }
};
const defaults = (...extra: string[]) => [
  "--source",
  tarball,
  "--json",
  ...extra,
];
const bind = (p: Project, ...extra: string[]) => [
  ...defaults(),
  "--bind-skill",
  "--host",
  "claude",
  "--project",
  p.directory,
  ...extra,
];
const check = async (p: Project, ...extra: string[]) =>
  JSON.parse((await setup(p, ["--check", "--json", ...extra])).stdout);
const oneLine = (stderr: string, code: string) => {
  expect(stderr.trimEnd().split("\n")).toHaveLength(1);
  expect(stderr).toMatch(
    new RegExp(`^${code}: .+\\. Next: .+ \\(see installation\\.md\\)\\n$`),
  );
  expect(stderr).not.toMatch(/Node\.js v|\n\s+at |node:internal|Error:/);
};

describe("engine declaration", () => {
  it("names the version the pack script builds and the pinned Node", async () => {
    const declared = await json(
      join(repository, "skills/naraframe/engine.json"),
    );
    const pack = await readFile(
      join(repository, "scripts/pack-engine.mjs"),
      "utf8",
    );
    expect(pack).toContain(`const PACKAGE_VERSION = "${declared.version}"`);
    expect(declared.engine).toBe("naraframe");
    // The skill's minimum matches the engine doctor's.
    const doctor = await readFile(
      join(repository, "packages/cli/src/doctor.ts"),
      "utf8",
    );
    const minimum = /MINIMUM_NODE = "(\d+)\.\d+\.\d+"/.exec(doctor)?.[1];
    expect(declared.node).toBe(`>=${minimum}`);
    expect(declared.approximateInstallMB).toBeGreaterThan(0);
  });
});

describe("setup-engine --check", () => {
  it("reports no engine and writes nothing, in the skill folder or anywhere", async () => {
    const p = await project();
    const before = await treeHash(p.skill);
    const report = await check(p, "--host", "claude", "--project", p.directory);
    expect(report).toMatchObject({
      type: "engine-setup-result",
      success: true,
      mode: "check",
      ready: false,
      writesPerformed: false,
      plan: { home: p.naraframeHome, engineDir: p.engineDir },
      launcher: { route: "home", findsEngine: true },
      engine: { status: "missing", dir: p.engineDir },
      skill: { status: "unreceipted", host: "claude" },
      doctor: null,
      missingPrerequisites: [],
    });
    expect(report.plan.spec).toBe("naraframe@0.1.2");
    expect(report.prerequisites.map((c: { id: string }) => c.id)).toEqual([
      "node",
      "npm",
      "browser",
      "ffmpeg",
      "ffprobe",
      "font",
    ]);
    await expect(readdir(p.naraframeHome)).rejects.toMatchObject({
      code: "ENOENT",
    });
    expect(await treeHash(p.skill)).toBe(before);
    expect(await check(p).then((r) => r.skill)).toBeNull();
  });

  it("names each missing tool with the usual command, without running it", async () => {
    const p = await project();
    const result = await setup(p, ["--check", "--json"], {
      NARAFRAME_BROWSER_EXECUTABLE: join(scratch, "no-browser"),
      NARAFRAME_FONT_FILE: join(scratch, "no-font"),
      // Only Node and npm are reachable, so nothing can be "found elsewhere".
      PATH: [
        join(process.execPath, ".."),
        execFileSync("which", ["npm"], { encoding: "utf8" })
          .trim()
          .replace(/\/npm$/, ""),
      ].join(":"),
    });
    const report = JSON.parse(result.stdout);
    const browser = report.prerequisites.find(
      (c: { id: string }) => c.id === "browser",
    );
    expect(browser.status).toBe("missing");
    expect(browser.install).toEqual(expect.any(String));
    expect(report.missingPrerequisites).toContain("browser");
    expect(report.ready).toBe(false);
  });

  it("reports a healthy engine and a green doctor through the launcher", async () => {
    const p = await project();
    expect((await setup(p, defaults())).code).toBe(0);
    expect(await check(p)).toMatchObject({
      ready: true,
      writesPerformed: false,
      engine: { status: "healthy" },
      skill: null,
      doctor: { ready: true },
    });
  });
});

describe("setup-engine (default: nothing is written into the skill folder)", () => {
  it("installs under NARAFRAME_HOME into a read-only skill folder and leaves it byte-for-byte unchanged", async () => {
    const p = await project();
    execFileSync("chmod", ["-R", "a-w", p.skill]);
    const before = await treeHash(p.skill);
    const result = await setup(p, defaults());
    expect(result.code).toBe(0);
    expect(result.stderr).toBe("");
    const report = JSON.parse(result.stdout);
    expect(report).toMatchObject({
      success: true,
      mode: "setup",
      ready: true,
      writesPerformed: true,
      launcher: { route: "home", findsEngine: true },
      engine: { status: "installed", dir: p.engineDir },
      skill: null,
      doctor: { ready: true },
    });
    expect(await treeHash(p.skill)).toBe(before);
    await expect(
      readFile(join(p.skill, "installation.json")),
    ).rejects.toMatchObject({ code: "ENOENT" });
    expect(await readdir(p.directory)).toEqual([".claude"]);
    expect(await readdir(p.naraframeHome)).toEqual(["engine"]);
    // The static launcher reaches the engine and forwards arguments.
    const version = JSON.parse(
      (await launcher(p, ["version", "--json"])).stdout,
    );
    expect(version.data.version).toBe("0.1.2");
    const forwarded = JSON.parse(
      (await launcher(p, ["status", "an episode", "--json"])).stdout,
    );
    expect(forwarded.data.argv).toEqual(["an episode", "--json"]);
    expect(await treeHash(p.skill)).toBe(before);
    expect(await readdir(scratch)).not.toContainEqual(
      expect.stringMatching(/\.(installing|previous)-/),
    );
    execFileSync("chmod", ["-R", "u+w", p.skill]);
  });

  it("is idempotent: a second run reuses the engine and changes nothing", async () => {
    const p = await project();
    expect((await setup(p, defaults())).code).toBe(0);
    const marker = join(p.engineDir, "node_modules/naraframe/marker.txt");
    await writeFile(marker, "survives only if the engine is not reinstalled");
    const second = JSON.parse((await setup(p, defaults())).stdout);
    expect(second).toMatchObject({
      success: true,
      ready: true,
      writesPerformed: false,
      engine: { status: "reused" },
      skill: null,
    });
    expect(await readFile(marker, "utf8")).toContain("survives");
  });

  it("defaults NARAFRAME_HOME to ~/.naraframe", async () => {
    const p = await project();
    const alone = join(scratch, `alone-${counter}`);
    await mkdir(alone);
    const env = { NARAFRAME_HOME: undefined, HOME: alone };
    const report = JSON.parse((await setup(p, defaults(), env)).stdout);
    expect(report.plan.engineDir).toBe(join(alone, ".naraframe/engine/0.1.2"));
    expect(report.ready).toBe(true);
    expect(
      JSON.parse((await launcher(p, ["version", "--json"], env)).stdout)
        .success,
    ).toBe(true);
    // The real user's folder was never touched.
    await expect(readdir(join(home, ".naraframe"))).rejects.toMatchObject({
      code: "ENOENT",
    });
  });

  it("with an engine folder off the standard layout, says how the launcher finds it", async () => {
    const p = await project();
    const elsewhere = join(scratch, `elsewhere-${counter}`, "engine", "0.1.2");
    const standard = JSON.parse(
      (await setup(p, defaults("--engine-dir", elsewhere))).stdout,
    );
    expect(standard.ready).toBe(true);
    expect(standard.launcher.findsEngine).toBe(true);
    expect(standard.next.join("\n")).toContain("NARAFRAME_HOME=");
    const odd = join(scratch, `odd-${counter}`);
    const unusual = JSON.parse(
      (await setup(p, defaults("--engine-dir", odd))).stdout,
    );
    expect(unusual.ready).toBe(true);
    expect(unusual.launcher.findsEngine).toBe(false);
    expect(unusual.next.join("\n")).toContain("--bind-skill");
  });

  it("refuses placement options without --bind-skill, in one line", async () => {
    const p = await project();
    const before = await treeHash(p.skill);
    const result = await setup(p, [
      ...defaults().filter((a) => a !== "--json"),
      "--host",
      "claude",
      "--project",
      p.directory,
    ]);
    expect(result.code).toBe(1);
    expect(result.stdout).toBe("");
    oneLine(result.stderr, "SETUP_USAGE");
    expect(await treeHash(p.skill)).toBe(before);
    await expect(readdir(p.naraframeHome)).rejects.toMatchObject({
      code: "ENOENT",
    });
  });

  it("leaves a broken engine untouched when the install fails, then replaces it on success", async () => {
    const p = await project();
    expect((await setup(p, defaults())).code).toBe(0);
    const nested = join(p.engineDir, "node_modules/naraframe");
    await rm(join(nested, "packages"), { recursive: true });
    await writeFile(join(nested, "marker.txt"), "owner data");
    const withSource = (source: string) =>
      defaults().map((a) => (a === tarball ? source : a));
    const failed = await setup(
      p,
      withSource(join(scratch, "does-not-exist.tgz")),
    );
    expect(failed.code).toBe(1);
    const failure = JSON.parse(failed.stdout);
    expect(failure.success).toBe(false);
    expect(failure.issues[0].code).toBe("SETUP_INSTALL_FAILED");
    expect(failure.issues[0].next).toEqual(expect.any(String));
    expect(await readFile(join(nested, "marker.txt"), "utf8")).toBe(
      "owner data",
    );
    // A package of another version is rejected before it replaces anything.
    const wrong = await setup(p, withSource(wrongVersionTarball));
    expect(JSON.parse(wrong.stdout).issues[0].code).toBe(
      "SETUP_ENGINE_INVALID",
    );
    expect(await readFile(join(nested, "marker.txt"), "utf8")).toBe(
      "owner data",
    );
    expect(await readdir(join(p.naraframeHome, "engine"))).toEqual(["0.1.2"]);
    const repaired = JSON.parse((await setup(p, defaults())).stdout);
    expect(repaired).toMatchObject({
      ready: true,
      engine: { status: "installed" },
    });
    await expect(readFile(join(nested, "marker.txt"))).rejects.toMatchObject({
      code: "ENOENT",
    });
  });

  it("will not use a folder that is not an engine folder", async () => {
    const p = await project();
    await mkdir(p.engineDir, { recursive: true });
    await writeFile(join(p.engineDir, "notes.txt"), "not an engine");
    const result = await setup(p, defaults());
    expect(result.code).toBe(1);
    expect(JSON.parse(result.stdout).issues[0].code).toBe(
      "SETUP_ENGINE_DIR_IN_USE",
    );
    expect(await readFile(join(p.engineDir, "notes.txt"), "utf8")).toBe(
      "not an engine",
    );
  });

  it("reports missing tools after the install with exit 3 and the commands to run", async () => {
    const p = await project();
    const result = await setup(p, defaults(), {
      FAKE_DOCTOR_FAIL: "1",
      NARAFRAME_BROWSER_EXECUTABLE: join(scratch, "no-browser"),
    });
    expect(result.code).toBe(3);
    const report = JSON.parse(result.stdout);
    expect(report).toMatchObject({
      success: true,
      ready: false,
      engine: { status: "installed" },
      skill: null,
      doctor: { ready: false },
    });
    expect(report.missingPrerequisites).toContain("browser");
    expect(report.next.join("\n")).toContain("browser:");
  });
});

describe("static launcher (scripts/naraframe.mjs)", () => {
  it("is the same file the installer ships in the canonical skill", async () => {
    const source = await readFile(
      join(repository, "skills/naraframe/scripts/naraframe.mjs"),
      "utf8",
    );
    expect(source).not.toContain("installation.json\\'");
    const p = await project();
    expect(await readFile(join(p.skill, "scripts/naraframe.mjs"), "utf8")).toBe(
      source,
    );
  });

  it("without NARAFRAME_HOME content prints one clean line, exit 2, no stack", async () => {
    const p = await project();
    const failed = await launcher(p, ["version", "--json"]);
    expect(failed.code).toBe(2);
    expect(failed.stdout).toBe("");
    oneLine(failed.stderr, "SKILL_ENGINE_MISSING");
    expect(failed.stderr).toContain(p.engineDir);
    expect(failed.stderr).toContain("setup-engine.mjs");
  });

  it("prints one line for an engine that crashes", async () => {
    const p = await project();
    expect((await setup(p, defaults())).code).toBe(0);
    await writeFile(
      join(p.engineDir, "node_modules/naraframe/packages/cli/dist/index.js"),
      "function broken(){throw new Error('internal failure');}\nbroken();\n",
    );
    const failed = await launcher(p, ["version", "--json"]);
    expect(failed.code).toBe(2);
    oneLine(failed.stderr, "SKILL_ENGINE_MISSING");
  });

  it("prints one line when the engine in NARAFRAME_HOME is another version", async () => {
    const p = await project();
    expect((await setup(p, defaults())).code).toBe(0);
    const entry = join(
      p.engineDir,
      "node_modules/naraframe/packages/cli/dist/index.js",
    );
    await writeFile(
      entry,
      (await readFile(entry, "utf8")).replace('"0.1.2"', '"0.2.0"'),
    );
    const failed = await launcher(p, ["version", "--json"]);
    expect(failed.code).toBe(2);
    expect(failed.stdout).toBe("");
    oneLine(failed.stderr, "SKILL_ENGINE_CHANGED");
    expect(failed.stderr).toContain("0.2.0");
    expect(failed.stderr).toContain("0.1.2");
  });

  it("prints one line when engine.json is unreadable", async () => {
    const p = await project();
    await writeFile(join(p.skill, "engine.json"), "{broken");
    const failed = await launcher(p, ["version", "--json"]);
    expect(failed.code).toBe(2);
    oneLine(failed.stderr, "SKILL_INSTALL_INVALID");
  });

  it("after the engine is removed fails with one line, and --check says what is missing", async () => {
    const p = await project();
    expect((await setup(p, defaults())).code).toBe(0);
    await rm(p.engineDir, { recursive: true });
    const failed = await launcher(p, ["version", "--json"]);
    expect(failed.code).toBe(2);
    expect(failed.stdout).toBe("");
    oneLine(failed.stderr, "SKILL_ENGINE_MISSING");
    expect(await check(p)).toMatchObject({
      engine: { status: "missing" },
      ready: false,
    });
  });
});

describe("setup-engine --bind-skill (explicit, for a manual project install)", () => {
  it("installs, adopts the copied skill, writes a receipt and the launcher then follows it", async () => {
    const p = await project();
    const before = await treeHash(p.skill);
    const result = await setup(p, bind(p));
    expect(result.code).toBe(0);
    const report = JSON.parse(result.stdout);
    expect(report).toMatchObject({
      success: true,
      ready: true,
      writesPerformed: true,
      engine: { status: "installed" },
      skill: { status: "adopted", host: "claude", destination: p.skill },
      doctor: { ready: true },
    });
    expect(await treeHash(p.skill)).not.toBe(before);
    const receipt = await json(join(p.skill, "installation.json"));
    expect(receipt.adopted).toBe(true);
    expect(receipt.engineEntry).toBe(
      join(p.engineDir, "node_modules/naraframe/packages/cli/dist/index.js"),
    );
    expect(receipt.files["scripts/naraframe.mjs"]).toEqual(expect.any(String));
    // The receipt route works with NARAFRAME_HOME pointing nowhere.
    const version = JSON.parse(
      (
        await launcher(p, ["version", "--json"], {
          NARAFRAME_HOME: join(scratch, "nowhere"),
        })
      ).stdout,
    );
    expect(version.data.version).toBe("0.1.2");
    expect(
      await check(p, "--host", "claude", "--project", p.directory),
    ).toMatchObject({
      ready: true,
      skill: { status: "bound" },
      launcher: { route: "receipt" },
    });
    // Second run: nothing changes.
    const again = JSON.parse((await setup(p, bind(p))).stdout);
    expect(again).toMatchObject({
      writesPerformed: false,
      engine: { status: "reused" },
      skill: { status: "already-bound" },
    });
  });

  it("refuses an edited skill folder, keeps it as it is and leaves the engine installed", async () => {
    const p = await project();
    await writeFile(join(p.skill, "installation.md"), "Edited by the owner.\n");
    const result = await setup(p, bind(p));
    expect(result.code).toBe(1);
    expect(JSON.parse(result.stdout).issues[0]).toMatchObject({
      code: "SKILL_INSTALL_CONFLICT",
    });
    expect(await readFile(join(p.skill, "installation.md"), "utf8")).toBe(
      "Edited by the owner.\n",
    );
    await expect(
      readFile(join(p.skill, "installation.json")),
    ).rejects.toMatchObject({ code: "ENOENT" });
    expect((await check(p)).engine.status).toBe("healthy");
  });

  it("prints one 'CODE: message. Next: step' line without --json", async () => {
    const p = await project();
    await writeFile(join(p.skill, "installation.md"), "Edited.\n");
    const result = await setup(
      p,
      bind(p).filter((a) => a !== "--json"),
    );
    expect(result.code).toBe(1);
    expect(result.stdout).toBe("");
    oneLine(result.stderr, "SKILL_INSTALL_CONFLICT");
  });

  it("does not take over a skill bound to a working engine, but rebinds after that engine is gone", async () => {
    const p = await project();
    expect((await setup(p, bind(p))).code).toBe(0);
    const otherHome = join(scratch, `other-home-${counter}`);
    const env = { NARAFRAME_HOME: otherHome };
    const refused = await setup(p, bind(p), env);
    expect(refused.code).toBe(1);
    expect(JSON.parse(refused.stdout).issues[0].code).toBe(
      "SETUP_SKILL_BOUND_ELSEWHERE",
    );
    await expect(readdir(otherHome)).rejects.toMatchObject({ code: "ENOENT" });
    await rm(p.naraframeHome, { recursive: true });
    const rebound = JSON.parse((await setup(p, bind(p), env)).stdout);
    expect(rebound).toMatchObject({
      ready: true,
      engine: { status: "installed" },
      skill: { status: "updated" },
    });
    expect(
      JSON.parse((await launcher(p, ["version", "--json"], env)).stdout)
        .success,
    ).toBe(true);
  });

  it("a receipt launcher whose engine is removed fails with one line", async () => {
    const p = await project();
    expect((await setup(p, bind(p))).code).toBe(0);
    await rm(p.engineDir, { recursive: true });
    const failed = await launcher(p, ["version", "--json"]);
    expect(failed.code).toBe(2);
    oneLine(failed.stderr, "SKILL_ENGINE_MISSING");
    expect(
      (await check(p, "--host", "claude", "--project", p.directory)).skill
        .status,
    ).toBe("stale");
  });
});
