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
const usage =
  "Usage: node scripts/pack-engine.mjs [--registry] --out <scratch-directory>";
const args = process.argv.slice(2);
const registry = args.includes("--registry");
const flags = args.filter((argument) => argument !== "--registry");
if (flags.length !== 2 || flags[0] !== "--out") throw new Error(usage);
if (process.versions.node !== "24.20.0")
  throw new Error("Use pinned Node 24.20.0");
const out = resolve(flags[1]);
const PACKAGE_VERSION = "0.1.1";
const REPOSITORY = "https://github.com/fatlhr/NaraFrame";
const INTERNAL = ["@naraframe/core", "@naraframe/renderer-remotion"];
const json = async (path) => JSON.parse(await readFile(path, "utf8"));
// The skill names the engine release it was written for; keep it in step.
const declared = await json(join(root, "skills/naraframe/engine.json"));
if (declared.version !== PACKAGE_VERSION)
  throw new Error(
    `skills/naraframe/engine.json names ${declared.version}, but this package is ${PACKAGE_VERSION}.`,
  );
await mkdir(out, { recursive: true });
const stage = await mkdtemp(join(tmpdir(), "naraframe-pack-"));
const target = join(stage, "package");
await mkdir(target);
const inventory = [];
const installed = new Map();
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

// Registry packages need neither declarations nor source maps: nothing imports
// them as a library and the sources they point to are not shipped.
const runtimeOnly = (path) =>
  !/\.(d\.ts|d\.ts\.map|js\.map)$|\.tsbuildinfo$|\.DS_Store$/.test(path);
const exactVersion = /^\d+\.\d+\.\d+$/;
// Version found by Node resolution from a workspace package, for the rights record.
const installedPackage = async (from, name) => {
  for (let directory = from; ; directory = dirname(directory)) {
    try {
      return await json(join(directory, "node_modules", name, "package.json"));
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    if (dirname(directory) === directory)
      throw new Error(`${name} is not installed; run pnpm install`);
  }
};

// Keep compiled module boundaries; the CLI's relative resource root remains package root.
await mkdir(join(target, "packages/cli"), { recursive: true });
await cp(join(root, "packages/cli/dist"), join(target, "packages/cli/dist"), {
  recursive: true,
  filter: registry ? runtimeOnly : undefined,
});
const thirdParty = new Map();
const registryDependencies = {};
if (registry) {
  // NaraFrame's own two library packages travel inside the tarball as bundled
  // dependencies. Every third-party package stays an exact-version dependency
  // that npm installs from the registry; none of its code is copied here.
  for (const name of INTERNAL) {
    const source = join(root, "packages", name.split("/")[1]);
    const metadata = await json(join(source, "package.json"));
    const destination = join(target, "node_modules", name);
    await cp(join(source, "dist"), join(destination, "dist"), {
      recursive: true,
      filter: runtimeOnly,
    });
    const dependencies = {};
    for (const [dependency, range] of Object.entries(
      metadata.dependencies ?? {},
    )) {
      if (INTERNAL.includes(dependency)) {
        dependencies[dependency] = PACKAGE_VERSION;
        continue;
      }
      if (!exactVersion.test(range))
        throw new Error(
          `${name} depends on ${dependency}@${range}; the published package needs an exact version.`,
        );
      if (thirdParty.get(dependency) && thirdParty.get(dependency) !== range)
        throw new Error(`Conflicting versions of ${dependency}.`);
      const installed = await installedPackage(source, dependency);
      if (installed.version !== range)
        throw new Error(
          `${dependency} is ${installed.version} here but ${range} is pinned; run pnpm install.`,
        );
      thirdParty.set(dependency, range);
      registryDependencies[dependency] = {
        version: range,
        license: installed.license ?? "UNKNOWN",
      };
      dependencies[dependency] = range;
    }
    // Declaration-only conditions point at files this package does not ship.
    const exportsMap = JSON.parse(
      JSON.stringify(metadata.exports, (key, value) =>
        key === "types" ? undefined : value,
      ),
    );
    await save(join(destination, "package.json"), {
      name,
      version: PACKAGE_VERSION,
      license: "MIT",
      type: metadata.type,
      main: metadata.main,
      exports: exportsMap,
      dependencies,
    });
  }
} else
  for (const name of INTERNAL)
    await capture(join(root, "packages", name.split("/")[1]), name);
for (const path of [
  "profiles",
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
for (const file of ["LICENSE", "THIRD-PARTY-NOTICES.md"])
  await cp(join(root, file), join(target, file));
const registryReadme = [
  "# NaraFrame",
  "",
  "Create editable vertical motion videos locally, with an optional authoring skill for Codex or Claude Code.",
  "",
  "Verified on macOS Apple Silicon with Node 24.20.0. It also needs Chrome or Chromium, FFmpeg/FFprobe and a local font installed on your machine.",
  "",
  "```sh",
  "npm install naraframe",
  "npx naraframe version --json",
  "npx naraframe doctor --json",
  "npx naraframe create my-episode --profile current-issues --json",
  "```",
  "",
  "Edit the files in your project, then run `npx naraframe validate` and `npx naraframe preview`. Final export requires approval of a full preview. A neutral editable demo is in [starter/demo](starter/demo); [starter instructions](starter/README.md) explain the included library pattern.",
  "",
  "[Skill installation](skills/naraframe/installation.md) covers project and user installs, explicit updates and conflict-safe removal. The skill is optional; the CLI works without an agent account.",
  "",
  "## Licence",
  "",
  "NaraFrame's own code is MIT-licensed ([LICENSE](LICENSE)). Rendering uses Remotion, which has its own licence: free for individuals, for-profit organisations with up to 3 employees, non-profits and evaluation, and a company licence from <https://www.remotion.pro/license> for larger organisations. npm installs Remotion and the other dependencies from the registry; none of their code is in this package. See [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md) and [distribution-rights.json](distribution-rights.json). Rendering a file is not publication permission for the media in it.",
  "",
].join("\n");
await writeFile(
  join(target, "README.md"),
  registry
    ? registryReadme
    : [
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
        "Check [distribution rights](distribution-rights.json) and [starter rights](starter/RIGHTS.json). NaraFrame's own code is MIT ([LICENSE](LICENSE)); this archive also contains third-party packages under their own licenses ([notices](THIRD-PARTY-NOTICES.md)) and is a local offline artifact, not a redistribution of them. Rendering a file is not publication permission.",
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
const resources = [
  "profiles/current-issues: repository-authored data, system font names only",
  "profiles/general-explainer: repository-authored data, system font names only (no font, image or audio files)",
  "library/starter: repository-authored technical schematic PNGs, internal example use",
  "library/series/study-notes: repository-authored declarative templates and example values; no audio",
  "starter: neutral authored data, no media or fonts",
];
if (registry) {
  const dependencies = {
    ...Object.fromEntries(INTERNAL.map((name) => [name, PACKAGE_VERSION])),
    ...Object.fromEntries(
      [...thirdParty].sort(([a], [b]) => a.localeCompare(b, "en")),
    ),
  };
  await save(join(target, "package.json"), {
    name: "naraframe",
    version: PACKAGE_VERSION,
    description:
      "Create editable vertical motion videos locally, with an optional authoring skill for Codex or Claude Code.",
    license: "MIT",
    type: "module",
    engines: { node: "24.20.x" },
    bin: { naraframe: "packages/cli/dist/index.js" },
    files: [
      "packages/cli/dist",
      "profiles",
      "library",
      "starter",
      "skills",
      "scripts/install-skill.mjs",
      "LICENSE",
      "THIRD-PARTY-NOTICES.md",
      "distribution-rights.json",
    ],
    dependencies,
    bundleDependencies: INTERNAL,
    repository: { type: "git", url: `git+${REPOSITORY}.git` },
    homepage: `${REPOSITORY}#readme`,
    bugs: { url: `${REPOSITORY}/issues` },
  });
  await save(join(target, "distribution-rights.json"), {
    status: "mit-code-third-party-separate",
    code: "MIT (LICENSE); covers NaraFrame's own code and the resources listed below",
    thirdParty:
      "No third-party package code is in this package. npm installs the packages below from the registry under their own licences; Remotion's licence has company-size conditions (THIRD-PARTY-NOTICES.md).",
    resources,
    dependencies: Object.fromEntries(
      Object.entries(registryDependencies).sort(([a], [b]) =>
        a.localeCompare(b, "en"),
      ),
    ),
  });
} else {
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
    version: PACKAGE_VERSION,
    private: true,
    license: "SEE LICENSE IN LICENSE",
    type: "module",
    engines: { node: "24.20.x" },
    bin: { naraframe: "packages/cli/dist/index.js" },
    dependencies,
    bundledDependencies: Object.keys(dependencies),
  });
  await save(join(target, "distribution-rights.json"), {
    status: "local-candidate-only",
    code: "NaraFrame's own code is MIT (LICENSE). This offline aggregate vendors third-party packages under their own licences (THIRD-PARTY-NOTICES.md); it is a local artifact, not a publication of them.",
    platform: process.platform,
    architecture: process.arch,
    resources,
    packages: inventory,
  });
}
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
if (registry) {
  // The published package may carry only NaraFrame's own files.
  const unexpected = packed.files
    .map((file) => file.path)
    .filter(
      (path) =>
        (path.startsWith("node_modules/") &&
          !path.startsWith("node_modules/@naraframe/")) ||
        /(^|\/)(work|test-fixtures|samples|\.git|\.pnpm-store)\//.test(path) ||
        /(^|\/)\.env/.test(path) ||
        /\.log$/.test(path),
    );
  if (unexpected.length)
    throw new Error(
      `Unexpected files in the package: ${unexpected.join(", ")}`,
    );
}
const manifestPath = join(
  out,
  registry ? "registry-manifest.json" : "engine-manifest.json",
);
await save(manifestPath, {
  artifact,
  sha256: createHash("sha256")
    .update(await readFile(artifact))
    .digest("hex"),
  ...packed,
  ...(registry
    ? { thirdPartyDependencies: registryDependencies }
    : { runtimePackages: inventory }),
});
console.log(
  JSON.stringify({
    artifact,
    manifest: manifestPath,
    ...(registry
      ? { dependencies: Object.keys(registryDependencies).length }
      : { capturedPackages: inventory.length }),
  }),
);
