#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  cp,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  realpath,
  writeFile,
} from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createProject } from "../packages/core/dist/index.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
if (args.length !== 2 || args[0] !== "--out")
  throw new Error(
    "Usage: node scripts/pack-engine.mjs --out <scratch-directory>",
  );
if (process.versions.node !== "24.20.0")
  throw new Error("Use pinned Node 24.20.0");
const out = resolve(args[1]);
await mkdir(out, { recursive: true });
const stage = await mkdtemp(join(tmpdir(), "naraframe-pack-"));
const target = join(stage, "package");
await mkdir(target);
const inventory = [];
const installed = new Map();
const json = async (path) => JSON.parse(await readFile(path, "utf8"));
const save = async (path, value) =>
  writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
// Capture only a package's own published files; dependencies are traversed separately.
const copyPackage = async (source, destination) => {
  await mkdir(destination, { recursive: true });
  for (const entry of await readdir(source, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".DS_Store") continue;
    await cp(join(source, entry.name), join(destination, entry.name), {
      recursive: true,
      dereference: true,
    });
  }
};
const capture = async (
  source,
  name,
  parentDestination = target,
  ancestry = new Map(),
) => {
  source = await realpath(source);
  const metadata = await json(join(source, "package.json"));
  if (ancestry.get(name) === source) return;
  let destination =
    installed.get(name)?.source === source
      ? installed.get(name).destination
      : undefined;
  if (destination) return;
  destination = join(
    installed.has(name) ? parentDestination : target,
    "node_modules",
    name,
  );
  if (destination === parentDestination)
    throw new Error(`Dependency cycle at ${name}`);
  const privatePackage = name.startsWith("@naraframe/");
  if (privatePackage) {
    await mkdir(destination, { recursive: true });
    await cp(join(source, "dist"), join(destination, "dist"), {
      recursive: true,
    });
  } else await copyPackage(source, destination);
  if (!installed.has(name)) installed.set(name, { source, destination });
  const deps = {};
  const optional = metadata.optionalDependencies ?? {};
  const resolver = createRequire(join(source, "package.json"));
  const nextAncestry = new Map(ancestry).set(name, source);
  for (const dependency of Object.keys({
    ...metadata.dependencies,
    ...optional,
  })) {
    let dependencyRoot;
    try {
      dependencyRoot = await realpath(join(source, "node_modules", dependency));
    } catch {
      // Some npm layouts hoist dependencies; package.json exports may be hidden.
      const paths = resolver.resolve.paths(dependency) ?? [];
      // A declared browser polyfill can share a Node built-in name (events).
      // Node's resolve.paths returns null for those names; inspect ancestors.
      for (let ancestor = dirname(source); ; ancestor = dirname(ancestor)) {
        paths.push(join(ancestor, "node_modules"));
        if (dirname(ancestor) === ancestor) break;
      }
      for (const path of paths) {
        try {
          dependencyRoot = await realpath(join(path, dependency));
          break;
        } catch {}
      }
      if (!dependencyRoot && dependency in optional) continue;
      if (!dependencyRoot)
        throw new Error(
          `Offline dependency unavailable: ${name} -> ${dependency}`,
        );
    }
    deps[dependency] = (
      await json(join(dependencyRoot, "package.json"))
    ).version;
    await capture(dependencyRoot, dependency, destination, nextAncestry);
  }
  await save(join(destination, "package.json"), {
    ...metadata,
    dependencies: deps,
    optionalDependencies: undefined,
    devDependencies: undefined,
  });
  inventory.push({
    name,
    version: metadata.version,
    license: metadata.license ?? "UNKNOWN",
    path: destination.slice(target.length + 1),
  });
};

// Keep compiled module boundaries; the CLI's relative resource root remains package root.
await mkdir(join(target, "packages/cli"), { recursive: true });
await cp(join(root, "packages/cli/dist"), join(target, "packages/cli/dist"), {
  recursive: true,
});
for (const name of ["@naraframe/core", "@naraframe/renderer-remotion"])
  await capture(join(root, "packages", name.split("/")[1]), name);
for (const path of [
  "profiles/current-issues",
  "library",
  "starter/README.md",
  "starter/RIGHTS.json",
  "starter/params.json",
  "skills/naraframe",
]) {
  await mkdir(dirname(join(target, path)), { recursive: true });
  await cp(join(root, path), join(target, path), {
    recursive: true,
    filter: (path) => !path.endsWith(".DS_Store"),
  });
}
await mkdir(join(target, "scripts"), { recursive: true });
await cp(
  join(root, "scripts/install-skill.mjs"),
  join(target, "scripts/install-skill.mjs"),
);
await writeFile(
  join(target, "README.md"),
  [
    "# NaraFrame engine",
    "",
    "Create editable vertical motion videos locally, with an optional authoring skill for Codex or Claude Code.",
    "",
    "This local macOS Apple Silicon candidate needs Node 24.20.0, Chrome/Chromium, FFmpeg/FFprobe and a local font. It includes runtime dependencies; it does not download a browser or generate media.",
    "",
    "Run `node packages/cli/dist/index.js version --json` and `node packages/cli/dist/index.js doctor --json` from this package directory. From another directory, use an absolute CLI entry path.",
    "",
    "Copy [starter/demo](starter/demo) to a new project outside this installation, then validate and preview it through the CLI. [Starter instructions](starter/README.md) explain the included editable library pattern. Final export requires approval of a full preview.",
    "",
    "[Skill installation](skills/naraframe/installation.md) covers project/user installs, explicit updates and conflict-safe removal. The skill is optional; the CLI works without an agent account.",
    "",
    "Check [distribution rights](distribution-rights.json) and [starter rights](starter/RIGHTS.json). The candidate is UNLICENSED pending the owner's public redistribution decision; third-party runtime licenses still apply. Rendering a file is not publication permission.",
    "",
  ].join("\n"),
);
const demo = join(target, "starter/demo");
const created = await createProject({
  destination: demo,
  projectId: "neutral-starter",
  title: "Dari ide ke tindakan",
  profileDirectory: join(target, "profiles/current-issues"),
  profileSource: { kind: "repository", identity: "profiles/current-issues" },
});
if (!created.ok)
  throw new Error(`Starter creation failed: ${JSON.stringify(created.issues)}`);
const configuration = await json(join(demo, "naraframe.json"));
await save(join(demo, "naraframe.json"), {
  ...configuration,
  audioMode: "silent",
});
const catalog = await json(join(target, "library/starter/catalog.json"));
const template = catalog.patterns.find(
  (pattern) => pattern.id === "path-note",
).template;
await save(join(demo, "scenes.json"), {
  schemaVersion: 1,
  scenes: [
    {
      ...template,
      id: "neutral-path",
      visual: {
        ...template.visual,
        layers: template.visual.layers.map((layer) =>
          layer.id === "title"
            ? { ...layer, text: "Dari ide ke tindakan" }
            : layer,
        ),
      },
    },
  ],
});
const dependencies = Object.fromEntries(
  [...installed].map(([name, info]) => [
    name,
    inventory.find(
      (entry) => entry.path === info.destination.slice(target.length + 1),
    ).version,
  ]),
);
await save(join(target, "package.json"), {
  name: "naraframe-engine",
  version: "0.1.0",
  private: true,
  license: "UNLICENSED",
  type: "module",
  engines: { node: "24.20.x" },
  bin: { naraframe: "packages/cli/dist/index.js" },
  dependencies,
  bundledDependencies: Object.keys(dependencies),
});
await save(join(target, "distribution-rights.json"), {
  status: "local-candidate-only",
  code: "UNLICENSED; owner license decision required before publication",
  platform: process.platform,
  architecture: process.arch,
  resources: [
    "profiles/current-issues: repository-authored data, system font names only",
    "library/starter: repository-authored technical schematic PNGs, internal example use",
    "library/series/study-notes: repository-authored declarative templates and example values; no audio",
    "starter: neutral authored data, no media or fonts",
  ],
  packages: inventory,
});
const packed = JSON.parse(
  execFileSync(
    "npm",
    [
      "pack",
      "--json",
      "--offline",
      "--ignore-scripts",
      "--cache",
      join(stage, "npm-cache"),
      "--pack-destination",
      out,
    ],
    { cwd: target, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 },
  ),
)[0];
const artifact = join(out, packed.filename);
await save(join(out, "engine-manifest.json"), {
  artifact,
  sha256: createHash("sha256")
    .update(await readFile(artifact))
    .digest("hex"),
  ...packed,
  runtimePackages: inventory,
});
console.log(
  JSON.stringify({
    artifact,
    manifest: join(out, "engine-manifest.json"),
    capturedPackages: inventory.length,
  }),
);
