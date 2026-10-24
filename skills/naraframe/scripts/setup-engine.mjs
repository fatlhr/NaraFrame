#!/usr/bin/env node
// Install the NaraFrame engine from npm into $NARAFRAME_HOME (default ~/.naraframe).
// Needs only Node and npm. Run it after the user has agreed; --check never writes.
// It never writes into the skill folder, which may be a read-only plugin cache:
// the skill's launcher finds the engine by version. Only --bind-skill uses the
// installer to write a receipt into a project or personal skill folder.
import { spawnSync } from "node:child_process";
import {
  access,
  lstat,
  mkdir,
  readdir,
  readFile,
  realpath,
  rename,
  rm,
} from "node:fs/promises";
import { homedir } from "node:os";
import { basename, delimiter, dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const skillRoot = resolve(here, "..");
const declared = JSON.parse(
  await readFile(join(skillRoot, "engine.json"), "utf8"),
);
const entryInside = "node_modules/naraframe/packages/cli/dist/index.js";
const installerInside = "node_modules/naraframe/scripts/install-skill.mjs";

class Failure extends Error {
  constructor(code, message, next) {
    super(message);
    this.code = code;
    this.next = next;
  }
}
const sentence = (text) => text.trim().replace(/[.\s]+$/, "");
const oneLine = (failure) =>
  `${failure.code}: ${sentence(failure.message)}. Next: ${sentence(failure.next)} (see installation.md)`;

const present = async (path) => {
  try {
    return await lstat(path);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
};
const readable = async (path) => {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
};
const quiet = (command, args, options = {}) =>
  spawnSync(command, args, {
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"],
    ...options,
  });

// ---- Arguments ----------------------------------------------------------

const parse = (args) => {
  const booleans = new Set(["check", "json", "bind-skill"]);
  const values = new Set([
    "engine-dir",
    "version",
    "source",
    "host",
    "scope",
    "project",
    "user-root",
  ]);
  const options = {};
  const seen = new Set();
  for (let i = 0; i < args.length; i++) {
    const key = args[i]?.startsWith("--") ? args[i].slice(2) : "";
    if (!key || seen.has(key) || !(booleans.has(key) || values.has(key)))
      throw new Failure(
        "SETUP_USAGE",
        `Unknown or repeated option ${args[i] ?? ""}`.trim(),
        "run with --check --json for a read-only report, or see the options in installation.md",
      );
    seen.add(key);
    const property = key.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    if (booleans.has(key)) options[property] = true;
    else {
      const value = args[++i];
      if (!value || value.startsWith("--"))
        throw new Failure(
          "SETUP_USAGE",
          `--${key} needs a value`,
          "pass a value after the option",
        );
      options[property] = value;
    }
  }
  if (options.host && !["claude", "codex"].includes(options.host))
    throw new Failure(
      "SETUP_USAGE",
      "--host must be claude or codex",
      "pass --host claude or --host codex",
    );
  if (options.scope && !["project", "user"].includes(options.scope))
    throw new Failure(
      "SETUP_USAGE",
      "--scope must be project or user",
      "pass --scope project --project <dir>, or --scope user",
    );
  options.scope ??= options.project
    ? "project"
    : options.userRoot
      ? "user"
      : "";
  if (options.scope === "project" && !options.project)
    throw new Failure(
      "SETUP_USAGE",
      "Project scope needs --project",
      "pass --project <absolute project directory>",
    );
  if (options.scope === "project" && options.userRoot)
    throw new Failure(
      "SETUP_USAGE",
      "Project scope does not accept --user-root",
      "drop --user-root",
    );
  if (options.scope === "user" && options.project)
    throw new Failure(
      "SETUP_USAGE",
      "User scope does not accept --project",
      "drop --project, or use --scope project",
    );
  const placement = options.host || options.scope;
  if (placement && !options.check && !options.bindSkill)
    throw new Failure(
      "SETUP_USAGE",
      "--host, --project and --scope only apply with --bind-skill",
      "drop them (the skill folder is never written by default), or add --bind-skill",
    );
  if (options.bindSkill && !options.check && !options.host)
    throw new Failure(
      "SETUP_USAGE",
      "Choose the agent host to bind",
      "pass --host claude or --host codex, with --project <dir> or --scope user",
    );
  if (options.bindSkill && !options.check && !options.scope)
    throw new Failure(
      "SETUP_USAGE",
      "Choose where to bind the skill",
      "pass --project <dir>, or --scope user",
    );
  return options;
};

// ---- Prerequisites ------------------------------------------------------

const platform = process.platform;
const hints = {
  node: {
    darwin:
      "install the current Node LTS (for example brew install node@24, nvm install --lts or fnm install --lts) and run this script with it first on PATH",
    linux:
      "install the current Node LTS (for example nvm install --lts) and run this script with it first on PATH",
    win32:
      "install the current Node LTS (for example winget install OpenJS.NodeJS.LTS) and rerun",
  },
  npm: {
    darwin: "install the current Node LTS, which includes npm",
    linux: "install the current Node LTS, which includes npm",
    win32: "install the current Node LTS, which includes npm",
  },
  browser: {
    darwin: "brew install --cask google-chrome",
    linux: "install Chrome or Chromium with your package manager",
    win32: "winget install Google.Chrome",
  },
  ffmpeg: {
    darwin: "brew install ffmpeg",
    linux: "sudo apt install ffmpeg (or your package manager's ffmpeg)",
    win32: "winget install Gyan.FFmpeg",
  },
  font: {
    darwin: "install any readable system font, then set NARAFRAME_FONT_FILE",
    linux: "set NARAFRAME_FONT_FILE to a readable .ttf or .otf file",
    win32: "set NARAFRAME_FONT_FILE to a readable .ttf or .otf file",
  },
};
const hint = (id) => hints[id][platform] ?? hints[id].linux;

const nodeSatisfies = (version, minimum) => {
  const parts = (value) => value.replace(/^v/, "").split(".").map(Number);
  const [have, need] = [parts(version), parts(minimum)];
  for (let index = 0; index < 3; index += 1) {
    const difference = (have[index] ?? 0) - (need[index] ?? 0);
    if (difference !== 0) return difference > 0;
  }
  return true;
};

const onPath = async (names) => {
  for (const directory of (process.env.PATH ?? "").split(delimiter))
    for (const name of names) {
      const candidate = join(directory, name);
      if (directory && (await readable(candidate))) return candidate;
    }
  return null;
};

// The engine's doctor looks at one configured path per tool. Report that path's
// state, and where the tool is when it lives somewhere else.
const toolCheck = async (id, label, configured, envName, names) => {
  if (await readable(configured))
    return { id, status: "ready", detail: `${label}: ${configured}` };
  const found = await onPath(names);
  if (found)
    return {
      id,
      status: "needs-config",
      detail: `${label} is at ${found}, not at ${configured}, where the engine looks`,
      install: `set ${envName}=${found} before running NaraFrame`,
    };
  return {
    id,
    status: "missing",
    detail: `${label} not found (looked at ${configured} and on PATH)`,
    install: hint(id === "ffprobe" ? "ffmpeg" : id),
  };
};

export const checkPrerequisites = async () => {
  const checks = [];
  // engine.json names the oldest Node the engine runs on, as ">=<major>".
  const minimum = String(declared.node ?? ">=22").replace(/^>=\s*/, "");
  checks.push(
    nodeSatisfies(process.versions.node, minimum)
      ? { id: "node", status: "ready", detail: `Node ${process.versions.node}` }
      : {
          id: "node",
          status: "incompatible",
          detail: `Node ${process.versions.node} is active; NaraFrame needs Node ${minimum} or newer`,
          install: hint("node"),
        },
  );
  const npm = quiet(platform === "win32" ? "npm.cmd" : "npm", ["--version"], {
    shell: platform === "win32",
    timeout: 20_000,
  });
  checks.push(
    npm.status === 0
      ? { id: "npm", status: "ready", detail: `npm ${npm.stdout.trim()}` }
      : {
          id: "npm",
          status: "missing",
          detail: "npm is not available on PATH",
          install: hint("npm"),
        },
  );
  const ffmpeg =
    process.env.NARAFRAME_FFMPEG_EXECUTABLE ?? "/opt/homebrew/bin/ffmpeg";
  checks.push(
    await toolCheck(
      "browser",
      "Chrome or Chromium",
      process.env.NARAFRAME_BROWSER_EXECUTABLE ??
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "NARAFRAME_BROWSER_EXECUTABLE",
      ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser"],
    ),
    await toolCheck("ffmpeg", "FFmpeg", ffmpeg, "NARAFRAME_FFMPEG_EXECUTABLE", [
      "ffmpeg",
    ]),
    await toolCheck(
      "ffprobe",
      "FFprobe",
      process.env.NARAFRAME_FFPROBE_EXECUTABLE ??
        join(dirname(ffmpeg), "ffprobe"),
      "NARAFRAME_FFPROBE_EXECUTABLE",
      ["ffprobe"],
    ),
  );
  let font;
  for (const candidate of [
    process.env.NARAFRAME_FONT_FILE,
    "/System/Library/Fonts/SFNS.ttf",
    "/System/Library/Fonts/Helvetica.ttc",
  ])
    if (candidate && (await readable(candidate))) {
      font = candidate;
      break;
    }
  checks.push(
    font
      ? { id: "font", status: "ready", detail: `Font: ${font}` }
      : {
          id: "font",
          status: "missing",
          detail: "No readable local font found",
          install: hint("font"),
        },
  );
  return checks;
};

// ---- Engine -------------------------------------------------------------

const probeEngine = (engineDir, version) => {
  const entry = join(engineDir, entryInside);
  const missing = (reason) => ({ ok: false, entry, reason });
  const result = quiet(process.execPath, [entry, "version", "--json"], {
    timeout: 20_000,
  });
  if (result.error || result.status !== 0)
    return missing("the engine does not start");
  let event;
  try {
    event = JSON.parse(result.stdout.trim());
  } catch {
    return missing("the engine gave no readable version result");
  }
  const data = event?.data;
  if (
    event?.success !== true ||
    event.command !== "version" ||
    data?.skillApiVersion !== 1 ||
    typeof data.version !== "string"
  )
    return missing("the engine reports an incompatible version result");
  if (data.version !== version)
    return {
      ok: false,
      entry,
      reason: `the engine there is ${data.version}, not ${version}`,
    };
  return { ok: true, entry, version: data.version, data };
};

const engineState = async (engineDir, version) => {
  if (!(await present(engineDir)))
    return { status: "missing", dir: engineDir, version };
  const probe = probeEngine(engineDir, version);
  if (!probe.ok)
    return {
      status: "broken",
      dir: engineDir,
      version,
      reason: probe.reason,
    };
  if (!(await readable(join(engineDir, installerInside))))
    return {
      status: "broken",
      dir: engineDir,
      version,
      reason: "the engine has no skill installer",
    };
  return {
    status: "healthy",
    dir: engineDir,
    version,
    entry: await realpath(probe.entry),
    engineIdentity: probe.data.engineIdentity,
  };
};

// Only an empty folder or an earlier NaraFrame engine may be replaced.
const assertReplaceable = async (engineDir) => {
  const stat = await present(engineDir);
  if (!stat) return;
  const inUse = new Failure(
    "SETUP_ENGINE_DIR_IN_USE",
    `${engineDir} exists and is not a NaraFrame engine folder`,
    "pass another --engine-dir, or move the existing folder yourself",
  );
  if (!stat.isDirectory() || stat.isSymbolicLink()) throw inUse;
  if ((await readdir(engineDir)).length === 0) return;
  try {
    const metadata = JSON.parse(
      await readFile(
        join(engineDir, "node_modules/naraframe/package.json"),
        "utf8",
      ),
    );
    if (metadata.name === "naraframe") return;
  } catch {}
  throw inUse;
};

const npmFailure = (spec, output) => {
  const text = `${output.stderr ?? ""}${output.stdout ?? ""}`;
  const reason =
    text
      .split("\n")
      .map((line) => line.replace(/^npm (error|ERR!)\s*/, "").trim())
      .find((line) => /^(code |E[A-Z]+|404|No matching|[a-z]+:)/i.test(line)) ??
    text.trim().split("\n").at(-1) ??
    "npm failed";
  if (/E404|404 Not Found|No matching version/i.test(text))
    return new Failure(
      "SETUP_ENGINE_NOT_PUBLISHED",
      `${spec} is not on the npm registry`,
      "pass --source <path to a naraframe .tgz> to install from a local package",
    );
  if (
    /ENOTFOUND|EAI_AGAIN|ETIMEDOUT|ECONNREFUSED|ECONNRESET|network/i.test(text)
  )
    return new Failure(
      "SETUP_NPM_UNREACHABLE",
      `npm could not reach the registry for ${spec}`,
      "check the network connection, then run the same command again",
    );
  return new Failure(
    "SETUP_INSTALL_FAILED",
    `npm could not install ${spec} (${sentence(reason).slice(0, 160)})`,
    "fix the reported npm problem, then run the same command again; the existing engine, if any, is untouched",
  );
};

const installEngine = async (engineDir, version, spec) => {
  await assertReplaceable(engineDir);
  await mkdir(dirname(engineDir), { recursive: true });
  const staging = `${engineDir}.installing-${process.pid}`;
  const previous = `${engineDir}.previous-${process.pid}`;
  await rm(staging, { recursive: true, force: true });
  await mkdir(staging);
  let moved = false;
  try {
    const output = quiet(
      platform === "win32" ? "npm.cmd" : "npm",
      [
        "install",
        "--prefix",
        staging,
        "--ignore-scripts",
        "--no-audit",
        "--no-fund",
        "--no-update-notifier",
        "--loglevel",
        "error",
        spec,
      ],
      { cwd: staging, shell: platform === "win32", timeout: 15 * 60_000 },
    );
    if (output.error || output.status !== 0)
      throw npmFailure(spec, {
        stdout: output.stdout,
        stderr: output.error ? String(output.error.message) : output.stderr,
      });
    const staged = probeEngine(staging, version);
    if (!staged.ok)
      throw new Failure(
        "SETUP_ENGINE_INVALID",
        `${spec} installed, but ${staged.reason}`,
        "pass --source with a naraframe package of the version this skill declares, or update the skill",
      );
    if (await present(engineDir)) {
      await rename(engineDir, previous);
      moved = true;
    }
    await rename(staging, engineDir);
    if ((await engineState(engineDir, version)).status !== "healthy")
      throw new Failure(
        "SETUP_ENGINE_INVALID",
        "The installed engine does not start from its final folder",
        "run the same command again; the previous engine was restored",
      );
    if (moved) await rm(previous, { recursive: true, force: true });
  } catch (error) {
    if (moved) {
      await rm(engineDir, { recursive: true, force: true });
      await rename(previous, engineDir);
    }
    throw error;
  } finally {
    await rm(staging, { recursive: true, force: true });
  }
};

// ---- Skill binding ------------------------------------------------------

const skillDestination = async (options) => {
  const base = await realpath(
    options.scope === "project"
      ? options.project
      : (options.userRoot ?? homedir()),
  );
  return join(
    base,
    options.host === "codex" ? ".agents" : ".claude",
    "skills",
    "naraframe",
  );
};

const bindingState = async (destination, engine) => {
  const stat = await present(destination);
  if (!stat) return { status: "unbound", destination };
  let receipt;
  try {
    receipt = JSON.parse(
      await readFile(join(destination, "installation.json"), "utf8"),
    );
  } catch {
    return { status: "unreceipted", destination };
  }
  let sameEntry = false;
  try {
    sameEntry = (await realpath(receipt.engineEntry)) === engine?.entry;
  } catch {}
  if (
    sameEntry &&
    receipt.engineVersion === engine.version &&
    receipt.engineIdentity === engine.engineIdentity
  )
    return { status: "bound", destination };
  // The receipt points at another engine, or at this one in a changed state.
  // "bound-elsewhere" is a working engine that must not be taken over; "stale"
  // is a receipt whose engine no longer matches or runs.
  let elsewhereWorks = false;
  if (!sameEntry && typeof receipt.engineEntry === "string") {
    const probe = quiet(
      process.execPath,
      [receipt.engineEntry, "version", "--json"],
      { timeout: 20_000 },
    );
    elsewhereWorks = !probe.error && probe.status === 0;
  }
  return {
    status: elsewhereWorks ? "bound-elsewhere" : "stale",
    destination,
    elsewhereWorks,
    receipt,
  };
};

const runInstaller = (engineDir, options, extra) => {
  const output = quiet(
    process.execPath,
    [
      join(engineDir, installerInside),
      "--host",
      options.host,
      "--scope",
      options.scope,
      ...(options.scope === "project"
        ? ["--project", options.project]
        : options.userRoot
          ? ["--user-root", options.userRoot]
          : []),
      "--engine-entry",
      join(engineDir, entryInside),
      "--json",
      ...extra,
    ],
    { timeout: 60_000 },
  );
  let result;
  try {
    result = JSON.parse(output.stdout.trim());
  } catch {}
  if (!result?.success) {
    const issue = result?.issues?.[0] ?? {
      code: "SKILL_INSTALL_FAILED",
      message: "The skill installer gave no readable result",
    };
    throw new Failure(
      issue.code,
      issue.message,
      /^SKILL_INSTALL_(CONFLICT|EDITED)$/.test(issue.code)
        ? "keep the existing skill folder as it is; choose another --project or --scope, or ask the owner to move their edits"
        : "fix what the message names, then run the same command again; the engine stays installed",
    );
  }
  return result;
};

const runDoctor = (command, cwd, env = {}) => {
  const output = quiet(process.execPath, [command, "doctor", "--json"], {
    cwd,
    env: { ...process.env, ...env },
    timeout: 60_000,
  });
  try {
    const event = JSON.parse(output.stdout.trim());
    return {
      ready: event.success === true,
      checks: event.data?.checks ?? [],
      issues: (event.issues ?? []).map(({ code, message }) => ({
        code,
        message,
      })),
    };
  } catch {
    return {
      ready: false,
      checks: [],
      issues: [
        {
          code: "DOCTOR_UNREADABLE",
          message: "doctor gave no readable result",
        },
      ],
    };
  }
};

// ---- Orchestration ------------------------------------------------------

export const setupEngine = async (options) => {
  const started = Date.now();
  const version = options.version ?? declared.version;
  const home = resolve(
    process.env.NARAFRAME_HOME || join(homedir(), ".naraframe"),
  );
  const engineDir = resolve(options.engineDir ?? join(home, "engine", version));
  const spec = options.source ?? `${declared.engine}@${version}`;
  // The skill's launcher looks in $NARAFRAME_HOME/engine/<version> unless the
  // skill folder holds an install receipt, which names its own engine.
  const launcherPath = join(here, "naraframe.mjs");
  const receiptRoute = Boolean(
    await present(join(skillRoot, "installation.json")),
  );
  const standard =
    basename(engineDir) === version &&
    basename(dirname(engineDir)) === "engine";
  const launcherHome = standard ? dirname(dirname(engineDir)) : null;
  const prerequisites = await checkPrerequisites();
  const blocking = prerequisites.find(
    (check) => check.id === "node" || check.id === "npm",
  );
  const tools = prerequisites.filter(
    (check) => check.status !== "ready" && !["node", "npm"].includes(check.id),
  );
  const result = {
    schemaVersion: 1,
    type: "engine-setup-result",
    success: true,
    mode: options.check ? "check" : "setup",
    ready: false,
    plan: {
      home,
      engineDir,
      spec,
      version,
      approximateDiskMB: declared.approximateInstallMB ?? null,
    },
    launcher: {
      path: launcherPath,
      route: receiptRoute ? "receipt" : "home",
      home: launcherHome,
      findsEngine: !receiptRoute && launcherHome !== null,
    },
    prerequisites,
    missingPrerequisites: prerequisites
      .filter((check) => check.status !== "ready")
      .map((check) => check.id),
    engine: null,
    skill: null,
    doctor: null,
    writesPerformed: false,
    next: [],
  };
  const destination =
    options.host && options.scope ? await skillDestination(options) : null;
  // Doctor goes through the bound skill's launcher, else this skill's launcher
  // when it can find the engine, else the engine itself.
  const doctorFor = async (engine) => {
    const cwd = options.project ? await realpath(options.project) : engineDir;
    if (options.bindSkill && destination)
      return runDoctor(join(destination, "scripts", "naraframe.mjs"), cwd);
    if (result.launcher.findsEngine)
      return runDoctor(launcherPath, cwd, { NARAFRAME_HOME: launcherHome });
    return runDoctor(engine.entry, cwd);
  };
  // Say how the launcher reaches an engine installed away from the standard place.
  const locate = () =>
    receiptRoute || launcherHome === home
      ? []
      : [
          launcherHome
            ? `set NARAFRAME_HOME=${launcherHome} whenever the launcher runs`
            : "the launcher only finds <NARAFRAME_HOME>/engine/<version>; use that layout or add --bind-skill",
        ];

  let engine = await engineState(engineDir, version);
  if (options.check) {
    result.engine = engine;
    if (destination)
      result.skill = {
        ...(await bindingState(destination, engine)),
        host: options.host,
      };
    if (result.skill?.receipt) delete result.skill.receipt;
    if (engine.status === "healthy") result.doctor = await doctorFor(engine);
    result.ready =
      engine.status === "healthy" &&
      (!destination || result.skill.status === "bound") &&
      result.doctor?.ready === true;
    result.next = [
      ...prerequisites
        .filter((check) => check.status !== "ready")
        .map((check) => `${check.id}: ${check.install ?? check.detail}`),
      ...(engine.status !== "healthy" ||
      (result.skill && result.skill.status !== "bound")
        ? [
            "ask the user once; after a yes run this script without --check (add --bind-skill with --host and --project or --scope only for a manual install)",
          ]
        : []),
    ];
    result.durationMs = Date.now() - started;
    return result;
  }

  if (blocking && blocking.status !== "ready")
    throw new Failure(
      "SETUP_PREREQUISITE_MISSING",
      blocking.detail,
      blocking.install,
    );

  const boundElsewhere = (binding) =>
    new Failure(
      "SETUP_SKILL_BOUND_ELSEWHERE",
      `The skill at ${destination} is bound to a working engine at ${binding.receipt.engineEntry}`,
      "use that skill's launcher, or run the engine's install-skill.mjs with --update if the owner wants this engine instead",
    );
  if (engine.status === "healthy") engine = { ...engine, status: "reused" };
  else {
    // Refuse before downloading anything when the skill already has a working engine.
    if (options.bindSkill) {
      const early = await bindingState(destination, { version });
      if (early.status === "bound-elsewhere") throw boundElsewhere(early);
    }
    await installEngine(engineDir, version, spec);
    result.writesPerformed = true;
    const installed = await engineState(engineDir, version);
    engine = { ...installed, status: "installed" };
  }
  result.engine = engine;

  if (options.bindSkill) {
    const binding = await bindingState(destination, engine);
    const bound = { host: options.host, destination };
    if (binding.status === "bound")
      result.skill = { ...bound, status: "already-bound" };
    else if (binding.status === "bound-elsewhere")
      throw boundElsewhere(binding);
    else {
      const installerResult =
        binding.status === "stale"
          ? runInstaller(engineDir, options, ["--update"])
          : runInstaller(engineDir, options, ["--adopt"]);
      result.writesPerformed = true;
      result.skill = {
        ...bound,
        status:
          installerResult.action === "adopt"
            ? "adopted"
            : installerResult.action === "update"
              ? "updated"
              : "installed",
      };
    }
  }

  result.doctor = await doctorFor(engine);
  result.ready = result.doctor.ready;
  result.next = [
    ...(result.ready
      ? []
      : [
          ...tools.map(
            (check) => `${check.id}: ${check.install ?? check.detail}`,
          ),
          "then run this script with --check --json to confirm doctor is green",
        ]),
    ...(options.bindSkill ? [] : locate()),
  ];
  result.durationMs = Date.now() - started;
  return result;
};

const human = (result) => {
  const lines = [
    `${result.mode === "check" ? "Check" : "Setup"} ${result.ready ? "ready" : "not ready"}`,
    ...result.prerequisites.map(
      (check) =>
        `  ${check.status === "ready" ? "ok  " : "FAIL"} ${check.id}: ${check.detail}${check.install ? ` -> ${check.install}` : ""}`,
    ),
    `  engine: ${result.engine.status} (${result.plan.spec}) at ${result.plan.engineDir}`,
  ];
  if (result.skill)
    lines.push(
      `  skill: ${result.skill.status} at ${result.skill.destination}`,
    );
  if (result.doctor)
    lines.push(`  doctor: ${result.doctor.ready ? "green" : "not ready"}`);
  for (const step of result.next) lines.push(`  next: ${step}`);
  return lines.join("\n");
};

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  const json = process.argv.includes("--json");
  try {
    const options = parse(process.argv.slice(2));
    const result = await setupEngine(options);
    console.log(json ? JSON.stringify(result) : human(result));
    // 0: ready (or a completed check); 3: installed and bound, tools still missing.
    process.exitCode = options.check || result.ready ? 0 : 3;
  } catch (thrown) {
    const error =
      thrown instanceof Failure
        ? thrown
        : new Failure(
            "SETUP_FAILED",
            thrown?.message ?? "Unexpected failure",
            "run with --check --json and report the result",
          );
    if (json)
      console.log(
        JSON.stringify({
          schemaVersion: 1,
          type: "engine-setup-result",
          success: false,
          issues: [
            { code: error.code, message: error.message, next: error.next },
          ],
        }),
      );
    else console.error(oneLine(error));
    process.exitCode = 1;
  }
}
