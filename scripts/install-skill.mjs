#!/usr/bin/env node
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import {
  cp,
  lstat,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  realpath,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { promisify } from "node:util";

const run = promisify(execFile);
const marker = "naraframe-skill-install/v1";
const receiptFile = "installation.json";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const failure = (code, message) => {
  const error = new Error(message);
  error.code = code;
  return error;
};
const present = async (path) => {
  try {
    return await lstat(path);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
};

export const inventorySkill = async (directory, prefix = "") => {
  const files = {};
  for (const entry of (await readdir(join(directory, prefix))).sort()) {
    const relative = prefix ? `${prefix}/${entry}` : entry;
    if (relative === receiptFile) continue;
    const stat = await lstat(join(directory, relative));
    if (stat.isSymbolicLink())
      throw failure("SKILL_INSTALL_UNSAFE", `Symlink in skill: ${relative}.`);
    if (stat.isDirectory())
      Object.assign(files, await inventorySkill(directory, relative));
    else if (stat.isFile())
      files[relative] = sha(await readFile(join(directory, relative)));
    else
      throw failure(
        "SKILL_INSTALL_UNSAFE",
        `Unsupported skill file: ${relative}.`,
      );
  }
  return files;
};

// A folder with no receipt at all is refused, unless the caller asked to adopt
// it. Adoption returns the folder's own inventory so that it can be compared with
// the canonical skill; a present but unreadable receipt is never adopted.
const checkExisting = async (destination, adopt = false) => {
  const stat = await present(destination);
  if (!stat) return null;
  if (!stat.isDirectory() || stat.isSymbolicLink())
    throw failure(
      "SKILL_INSTALL_CONFLICT",
      "The destination is not an owned regular skill directory.",
    );
  if (adopt && !(await present(join(destination, receiptFile))))
    return { unreceipted: true, files: await inventorySkill(destination) };
  let receipt;
  try {
    const receiptStat = await lstat(join(destination, receiptFile));
    if (!receiptStat.isFile() || receiptStat.isSymbolicLink())
      throw new Error("receipt");
    receipt = JSON.parse(
      await readFile(join(destination, receiptFile), "utf8"),
    );
  } catch {
    throw failure(
      "SKILL_INSTALL_CONFLICT",
      "An existing skill has no valid NaraFrame install receipt. Leave it intact and select another scope.",
    );
  }
  if (
    receipt.owner !== marker ||
    !receipt.files ||
    typeof receipt.files !== "object" ||
    Array.isArray(receipt.files)
  )
    throw failure(
      "SKILL_INSTALL_CONFLICT",
      "The existing install receipt is not owned by this installer.",
    );
  const actual = await inventorySkill(destination);
  const paths = Object.keys(actual).sort();
  if (
    JSON.stringify(paths) !==
      JSON.stringify(Object.keys(receipt.files).sort()) ||
    paths.some((path) => actual[path] !== receipt.files[path])
  )
    throw failure(
      "SKILL_INSTALL_EDITED",
      "The installed skill has local edits or extra files. Preserve them before updating or removing it.",
    );
  return receipt;
};

const checkReferences = async (directory, files) => {
  const frontmatter = await readFile(join(directory, "SKILL.md"), "utf8");
  const header = frontmatter.match(
    /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/,
  )?.[1];
  if (
    !header?.split(/\r?\n/).some((line) => /^name:\s*naraframe\s*$/.test(line))
  )
    throw failure(
      "SKILL_SOURCE_INVALID",
      "The canonical skill must declare name: naraframe.",
    );
  for (const relative of Object.keys(files).filter((path) =>
    path.endsWith(".md"),
  )) {
    const contents = await readFile(join(directory, relative), "utf8");
    for (const match of contents.matchAll(/\]\((<[^>]+>|[^)]+)\)/g)) {
      const target = match[1].replace(/^<|>$/g, "").split("#")[0];
      if (!target || /^[a-z]+:/i.test(target)) continue;
      const absolute = resolve(dirname(join(directory, relative)), target);
      if (
        !absolute.startsWith(`${resolve(directory)}/`) ||
        !(await present(absolute))
      )
        throw failure(
          "SKILL_REFERENCE_MISSING",
          `Unresolvable skill reference in ${relative}: ${target}.`,
        );
    }
  }
};

export const inspectEngine = async (entry) => {
  let engineEntry;
  try {
    engineEntry = await realpath(entry);
    if (!(await lstat(engineEntry)).isFile()) throw new Error("file");
  } catch {
    throw failure(
      "SKILL_ENGINE_MISSING",
      "Build/install the engine first, then supply its compiled CLI entry.",
    );
  }
  let event;
  try {
    const { stdout } = await run(
      process.execPath,
      [engineEntry, "version", "--json"],
      { timeout: 10_000, maxBuffer: 1024 * 1024 },
    );
    event = JSON.parse(stdout.trim());
  } catch {
    throw failure(
      "SKILL_ENGINE_INCOMPATIBLE",
      "The engine does not expose a valid version --json result. Install an engine supporting skill API 1.",
    );
  }
  const data = event?.data;
  if (
    event.success !== true ||
    event.command !== "version" ||
    data?.skillApiVersion !== 1 ||
    data.sourceSchemaVersion !== 1 ||
    typeof data.version !== "string" ||
    !/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(data.version) ||
    typeof data.renderEngine !== "string" ||
    !data.renderEngine ||
    typeof data.engineIdentity !== "string" ||
    !/^[0-9a-f]{64}$/.test(data.engineIdentity) ||
    typeof data.resourceRoot !== "string" ||
    !isAbsolute(data.resourceRoot)
  )
    throw failure(
      "SKILL_ENGINE_INCOMPATIBLE",
      "Engine version/schema/skill API metadata is incompatible or incomplete.",
    );
  return {
    engineEntry,
    engineVersion: data.version,
    skillApiVersion: data.skillApiVersion,
    sourceSchemaVersion: data.sourceSchemaVersion,
    renderEngine: data.renderEngine,
    engineIdentity: data.engineIdentity,
    resourceRoot: await realpath(data.resourceRoot),
  };
};

export const installSkill = async (options) => {
  if (
    !["claude", "codex"].includes(options.host) ||
    !["project", "user"].includes(options.scope)
  )
    throw failure(
      "SKILL_INSTALL_USAGE",
      "Choose --host claude|codex and --scope project|user.",
    );
  if (options.update && options.remove)
    throw failure("SKILL_INSTALL_USAGE", "Choose update or remove, not both.");
  if (options.adopt && (options.update || options.remove))
    throw failure(
      "SKILL_INSTALL_USAGE",
      "--adopt applies to a first install only; it cannot be combined with update or remove.",
    );
  if (options.scope === "project" && (!options.project || options.userRoot))
    throw failure(
      "SKILL_INSTALL_USAGE",
      "Project scope requires --project and does not accept --user-root.",
    );
  if (options.scope === "user" && options.project)
    throw failure(
      "SKILL_INSTALL_USAGE",
      "User scope does not accept --project.",
    );
  const base = await realpath(
    options.scope === "project"
      ? options.project
      : (options.userRoot ?? homedir()),
  );
  const hostRoot = join(base, options.host === "codex" ? ".agents" : ".claude");
  const parent = join(hostRoot, "skills");
  const parents = [hostRoot, parent];
  const initialParents = [];
  for (const directory of parents) {
    const stat = await present(directory);
    if (stat && (!stat.isDirectory() || stat.isSymbolicLink()))
      throw failure(
        "SKILL_INSTALL_UNSAFE",
        "Skill parent paths must be regular directories, not symlinks.",
      );
    initialParents.push(stat && { dev: stat.dev, ino: stat.ino });
  }
  const checkParents = async (expected) => {
    for (let i = 0; i < parents.length; i++) {
      const stat = await present(parents[i]);
      const identity = stat && { dev: stat.dev, ino: stat.ino };
      if (
        (stat && (!stat.isDirectory() || stat.isSymbolicLink())) ||
        JSON.stringify(identity) !== JSON.stringify(expected[i])
      )
        throw failure(
          "SKILL_INSTALL_UNSAFE",
          "Skill parent identity changed during installation. Preserve it and retry after inspection.",
        );
    }
  };
  const destination = join(parent, "naraframe");
  const old = await checkExisting(destination, options.adopt);
  const adopting = Boolean(old?.unreceipted);
  if (old && !adopting && !options.update && !options.remove)
    throw failure(
      "SKILL_INSTALL_EXISTS",
      "NaraFrame is already installed here. Inspect it, then use --update explicitly.",
    );
  if (!old && (options.update || options.remove))
    throw failure(
      "SKILL_INSTALL_MISSING",
      "There is no owned NaraFrame installation to update or remove.",
    );
  const action = options.remove
    ? "remove"
    : adopting
      ? "adopt"
      : old
        ? "update"
        : "install";
  const engine = options.remove
    ? null
    : await inspectEngine(
        options.engineEntry ?? join(root, "packages/cli/dist/index.js"),
      );
  const source = engine
    ? join(engine.resourceRoot, "skills", "naraframe")
    : null;
  if (source) {
    if (!(await present(join(source, "SKILL.md"))))
      throw failure(
        "SKILL_SOURCE_MISSING",
        "The engine artifact does not include its canonical skill.",
      );
    const canonical = await inventorySkill(source);
    // The launcher is part of the canonical skill, not generated per install.
    if (!("scripts/naraframe.mjs" in canonical))
      throw failure(
        "SKILL_SOURCE_MISSING",
        "The engine's canonical skill has no scripts/naraframe.mjs launcher.",
      );
    await checkReferences(source, canonical);
    if (adopting) {
      // Adoption is for a copied, untouched skill folder only.
      const differences = [
        ...Object.keys(old.files)
          .filter((path) => !(path in canonical))
          .map((path) => `extra ${path}`),
        ...Object.keys(canonical)
          .filter((path) => !(path in old.files))
          .map((path) => `missing ${path}`),
        ...Object.keys(canonical)
          .filter(
            (path) => path in old.files && old.files[path] !== canonical[path],
          )
          .map((path) => `edited ${path}`),
      ];
      if (differences.length)
        throw failure(
          "SKILL_INSTALL_CONFLICT",
          `The existing skill without a receipt differs from the engine's canonical skill (${differences.slice(0, 3).join(", ")}${differences.length > 3 ? `, and ${differences.length - 3} more` : ""}). Leave it intact and select another scope.`,
        );
    }
  }
  const result = {
    schemaVersion: 1,
    type: "skill-install-result",
    success: true,
    action,
    dryRun: Boolean(options.dryRun),
    host: options.host,
    scope: options.scope,
    destination,
    engine,
    writesPerformed: false,
  };
  if (options.dryRun) return result;
  await checkParents(initialParents);
  await mkdir(parent, { recursive: true });
  const stableParents = await Promise.all(
    parents.map(async (directory) => {
      const stat = await lstat(directory);
      if (!stat.isDirectory() || stat.isSymbolicLink())
        throw failure(
          "SKILL_INSTALL_UNSAFE",
          "Skill parent paths changed while creating the install directory.",
        );
      return { dev: stat.dev, ino: stat.ino };
    }),
  );
  await checkParents(stableParents);
  const temporary = await mkdtemp(join(parent, ".naraframe-install-"));
  const candidate = join(temporary, "candidate"),
    backup = join(temporary, "previous");
  let saved = false;
  let completed = false;
  try {
    if (!options.remove) {
      await cp(source, candidate, { recursive: true, dereference: false });
      const files = await inventorySkill(candidate);
      await checkReferences(candidate, files);
      const receipt = {
        owner: marker,
        ...engine,
        host: options.host,
        scope: options.scope,
        ...(adopting ? { adopted: true } : {}),
        installedAt: new Date().toISOString(),
        files,
      };
      await writeFile(
        join(candidate, receiptFile),
        `${JSON.stringify(receipt, null, 2)}\n`,
      );
    }
    // Recheck after staging; no overwrite of edits made during preparation.
    await checkParents(stableParents);
    const now = await checkExisting(destination, options.adopt);
    if (JSON.stringify(now) !== JSON.stringify(old))
      throw failure(
        "SKILL_INSTALL_CONFLICT",
        "The destination changed while staging. Inspect it and retry.",
      );
    if (old) {
      await rename(destination, backup);
      saved = true;
      // Catch edits made between the last check and the move before deleting a backup.
      const moved = await checkExisting(backup, options.adopt);
      if (JSON.stringify(moved) !== JSON.stringify(old))
        throw failure(
          "SKILL_INSTALL_CONFLICT",
          "The prior installation changed during publication; restoring it.",
        );
    }
    if (!options.remove) await rename(candidate, destination);
    result.writesPerformed = true;
    completed = true;
    return result;
  } catch (error) {
    let safe = true;
    try {
      await checkParents(stableParents);
    } catch {
      safe = false;
    }
    if (safe && saved && !(await present(destination))) {
      await rename(backup, destination);
      saved = false;
    }
    throw error;
  } finally {
    let safe = true;
    try {
      await checkParents(stableParents);
    } catch {
      safe = false;
    }
    if (!safe || (saved && !completed)) {
      // A concurrent writer may own destination; never delete our prior install.
      console.error(`SKILL_INSTALL_RECOVERY: ${backup}`);
    } else await rm(temporary, { recursive: true, force: true });
  }
};

const parse = (args) => {
  const options = {},
    booleans = new Set(["dry-run", "update", "remove", "adopt", "json"]);
  const values = new Set([
    "host",
    "scope",
    "project",
    "user-root",
    "engine-entry",
  ]);
  const seen = new Set();
  for (let i = 0; i < args.length; i++) {
    const key = args[i]?.slice(2);
    if (
      !args[i]?.startsWith("--") ||
      seen.has(key) ||
      (!booleans.has(key) && !values.has(key))
    )
      throw failure(
        "SKILL_INSTALL_USAGE",
        "Use explicit, non-duplicate installer options.",
      );
    seen.add(key);
    const property = key.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    if (booleans.has(key)) options[property] = true;
    else {
      const value = args[++i];
      if (!value || value.startsWith("--"))
        throw failure("SKILL_INSTALL_USAGE", `--${key} needs a value.`);
      options[property] = value;
    }
  }
  return options;
};

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  try {
    const options = parse(process.argv.slice(2));
    const result = await installSkill(options);
    console.log(
      options.json
        ? JSON.stringify(result)
        : `${result.action} ${result.destination}${result.dryRun ? " (dry-run; no writes)" : ""}`,
    );
  } catch (error) {
    const result = {
      schemaVersion: 1,
      type: "skill-install-result",
      success: false,
      issues: [
        { code: error.code ?? "SKILL_INSTALL_FAILED", message: error.message },
      ],
    };
    if (process.argv.includes("--json")) console.log(JSON.stringify(result));
    else console.error(`${result.issues[0].code}: ${result.issues[0].message}`);
    process.exitCode = 1;
  }
}
