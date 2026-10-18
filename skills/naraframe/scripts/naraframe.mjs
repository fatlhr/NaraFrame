#!/usr/bin/env node
// NaraFrame launcher: finds the engine, checks it, forwards the arguments.
// It writes nothing. Every bootstrap failure is one line, exit 2:
//   CODE: message. Next: step (see installation.md)
//
// Without installation.json (a skill folder used as it is, for example from a
// plugin cache), the engine is $NARAFRAME_HOME/engine/<version>, where the
// version is the one in ../engine.json and NARAFRAME_HOME defaults to ~/.naraframe.
// With installation.json (the explicit installer), the engine and identity the
// receipt recorded must still match.
import { execFileSync, spawn } from "node:child_process";
import { readFile, realpath } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const skill = fileURLToPath(new URL("..", import.meta.url)).replace(
  /[\\/]$/,
  "",
);
const setup = `node "${skill}/scripts/setup-engine.mjs" --check --json`;
const fail = (code, message, next) => {
  console.error(`${code}: ${message}. Next: ${next} (see installation.md)`);
  process.exit(2);
};
const missing = (message) =>
  fail(
    "SKILL_ENGINE_MISSING",
    message,
    `tell the user the engine is not available and, once they agree, reinstall it; start with ${setup}`,
  );
const readJson = async (name) =>
  JSON.parse(await readFile(new URL(`../${name}`, import.meta.url), "utf8"));

let receipt = null;
try {
  receipt = await readJson("installation.json");
} catch (error) {
  if (error.code !== "ENOENT")
    fail(
      "SKILL_INSTALL_INVALID",
      "The install receipt next to this launcher cannot be read",
      `reinstall the skill; start with ${setup}`,
    );
}
let declared;
let entry;
if (receipt) entry = receipt.engineEntry;
else {
  try {
    declared = await readJson("engine.json");
  } catch {
    fail(
      "SKILL_INSTALL_INVALID",
      "engine.json next to this launcher cannot be read",
      "restore the skill folder from its source",
    );
  }
  entry = join(
    process.env.NARAFRAME_HOME || join(homedir(), ".naraframe"),
    "engine",
    String(declared.version),
    "node_modules/naraframe/packages/cli/dist/index.js",
  );
}

let version;
try {
  version = JSON.parse(
    execFileSync(process.execPath, [entry, "version", "--json"], {
      encoding: "utf8",
      timeout: 10000,
      maxBuffer: 1048576,
      stdio: ["ignore", "pipe", "pipe"],
    }),
  );
} catch {
  missing(`The pinned engine at ${entry} cannot be inspected`);
}
const d = version?.data;
let resourceRoot;
try {
  resourceRoot = await realpath(d?.resourceRoot);
} catch {
  missing("The pinned engine resources are missing");
}
const compatible =
  version.success &&
  version.command === "version" &&
  d?.skillApiVersion === 1 &&
  d.sourceSchemaVersion === 1;
if (receipt) {
  if (
    !compatible ||
    d.version !== receipt.engineVersion ||
    d.renderEngine !== receipt.renderEngine ||
    d.engineIdentity !== receipt.engineIdentity ||
    resourceRoot !== receipt.resourceRoot
  )
    fail(
      "SKILL_ENGINE_CHANGED",
      "The pinned engine or its version changed",
      "check the change with the user, then update this skill with scripts/install-skill.mjs --update from the engine package",
    );
} else if (!compatible || d.version !== declared.version)
  fail(
    "SKILL_ENGINE_CHANGED",
    `The engine at ${entry} is ${compatible ? `version ${d.version}` : "not compatible"}, but this skill declares ${declared.version}`,
    `install the declared version; start with ${setup}`,
  );

const child = spawn(process.execPath, [entry, ...args], { stdio: "inherit" });
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => child.kill(signal));
child.on("error", () => missing("The pinned engine could not be started"));
child.on("exit", (code, signal) => {
  process.exitCode = code ?? (signal === "SIGINT" ? 130 : 2);
});
