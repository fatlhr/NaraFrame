import { execFileSync } from "node:child_process";
import {
  cp,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  realpath,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const repository = fileURLToPath(new URL("../../../../", import.meta.url));
const internal = ["@naraframe/core", "@naraframe/renderer-remotion"];
// biome-ignore lint/suspicious/noExplicitAny: test helper reads arbitrary JSON files
const json = async (path: string): Promise<any> =>
  JSON.parse(await readFile(path, "utf8"));
let scratch: string;
let tarball: string;
let files: string[];
interface PackageMetadata {
  name: string;
  version: string;
  license: string;
  private?: boolean;
  bin: Record<string, string>;
  engines: Record<string, string>;
  os?: string[];
  cpu?: string[];
  files: string[];
  dependencies: Record<string, string>;
  bundleDependencies: string[];
  repository: { url: string };
}
let metadata: PackageMetadata;
let manifest: { files: { path: string }[] };

const extract = async (name: string): Promise<string> => {
  const destination = join(scratch, name, "node_modules/naraframe");
  await mkdir(destination, { recursive: true });
  execFileSync("tar", [
    "-xzf",
    tarball,
    "-C",
    destination,
    "--strip-components=1",
  ]);
  return destination;
};

// Stands in for npm's hoisted install of the third-party dependencies, without a
// network: each one points at the exact package this repository already resolved.
const linkDependencies = async (name: string): Promise<void> => {
  for (const dependency of Object.keys(metadata.dependencies)) {
    if (internal.includes(dependency)) continue;
    let real: string | undefined;
    for (const owner of ["packages/renderer-remotion", "packages/core"])
      try {
        real = await realpath(
          join(repository, owner, "node_modules", dependency),
        );
        break;
      } catch {}
    if (!real) throw new Error(`${dependency} is not installed`);
    const link = join(scratch, name, "node_modules", dependency);
    await mkdir(dirname(link), { recursive: true });
    await symlink(real, link);
  }
};
const invoke = (installation: string, command: string) =>
  JSON.parse(
    execFileSync(
      process.execPath,
      [join(installation, "packages/cli/dist/index.js"), command, "--json"],
      { cwd: scratch, encoding: "utf8", maxBuffer: 4 * 1024 * 1024 },
    ),
  );

beforeAll(async () => {
  scratch = await realpath(
    await mkdtemp(join(tmpdir(), "naraframe-npm-package ")),
  );
  const result = JSON.parse(
    execFileSync(
      process.execPath,
      [
        join(repository, "scripts/pack-engine.mjs"),
        "--registry",
        "--out",
        join(scratch, "packed"),
      ],
      { cwd: scratch, encoding: "utf8", timeout: 120_000 },
    ),
  );
  tarball = result.artifact;
  manifest = await json(result.manifest);
  files = manifest.files.map((file: { path: string }) => file.path);
  metadata = JSON.parse(
    execFileSync("tar", ["-xzOf", tarball, "package/package.json"], {
      encoding: "utf8",
    }),
  );
  // Packing resolves the dependency tree from the public registry.
}, 240_000);

afterAll(async () => {
  if (scratch) await rm(scratch, { recursive: true, force: true });
});

describe("publishable npm package", () => {
  it("is named naraframe with MIT licence, bin, engines and an allowlist", async () => {
    expect(metadata.name).toBe("naraframe");
    expect(metadata.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(metadata.license).toBe("MIT");
    expect(metadata.private).toBeUndefined();
    expect(metadata.bin).toEqual({ naraframe: "packages/cli/dist/index.js" });
    const pinned = (
      await readFile(join(repository, ".node-version"), "utf8")
    ).trim();
    expect(metadata.engines).toEqual({ node: pinned.replace(/\.\d+$/, ".x") });
    expect(metadata.os).toBeUndefined();
    expect(metadata.cpu).toBeUndefined();
    expect(metadata.files).toContain("LICENSE");
    expect(metadata.files).toContain("THIRD-PARTY-NOTICES.md");
    expect(metadata.files).toContain("npm-shrinkwrap.json");
    expect(metadata.files).not.toContain("node_modules");
    expect(metadata.repository.url).toContain("github.com/fatlhr/NaraFrame");
  });

  it("pins every third-party runtime dependency to the exact version the workspace uses", async () => {
    const workspace: Record<string, string> = {};
    for (const name of ["core", "renderer-remotion"])
      for (const [dependency, version] of Object.entries(
        (await json(join(repository, "packages", name, "package.json")))
          .dependencies,
      ))
        if (!internal.includes(dependency))
          workspace[dependency] = version as string;
    const thirdParty = Object.fromEntries(
      Object.entries(metadata.dependencies).filter(
        ([name]) => !internal.includes(name),
      ),
    );
    expect(thirdParty).toEqual(workspace);
    for (const version of Object.values(metadata.dependencies))
      expect(version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(metadata.bundleDependencies).toEqual(internal);
    expect(JSON.stringify(metadata)).not.toContain("workspace:");
    for (const name of internal)
      expect(metadata.dependencies[name]).toBe(metadata.version);
  });

  it("keeps the repository's own packages private", async () => {
    expect((await json(join(repository, "package.json"))).private).toBe(true);
    for (const name of ["cli", "core", "renderer-remotion"])
      expect(
        (await json(join(repository, "packages", name, "package.json")))
          .private,
      ).toBe(true);
  });

  it("lists NaraFrame's modules, resources, licence files and installer", () => {
    for (const path of [
      "LICENSE",
      "README.md",
      "THIRD-PARTY-NOTICES.md",
      "distribution-rights.json",
      "package.json",
      "npm-shrinkwrap.json",
      "packages/cli/dist/index.js",
      "node_modules/@naraframe/core/package.json",
      "node_modules/@naraframe/core/dist/index.js",
      "node_modules/@naraframe/renderer-remotion/package.json",
      "node_modules/@naraframe/renderer-remotion/dist/index.js",
      "profiles/current-issues/profile.json",
      "library/starter/catalog.json",
      "starter/README.md",
      "starter/demo/naraframe.json",
      "skills/naraframe/SKILL.md",
      "skills/naraframe/engine.json",
      "skills/naraframe/scripts/setup-engine.mjs",
      "skills/naraframe/scripts/naraframe.mjs",
      "scripts/install-skill.mjs",
    ])
      expect(files).toContain(path);
  });

  it("contains no third-party package code and no private, work, fixture or log files", async () => {
    const nested = files.filter((path) => path.startsWith("node_modules/"));
    for (const path of nested)
      expect(path).toMatch(
        /^node_modules\/@naraframe\/(core|renderer-remotion)\//,
      );
    for (const path of files) {
      expect(path).not.toMatch(
        /(^|\/)(work|test-fixtures|samples|\.git|\.pnpm-store|\.worktrees|\.agents|\.claude|docs|test)\//,
      );
      expect(path).not.toMatch(/(^|\/)\.env/);
      expect(path).not.toMatch(/\.(log|map|tsbuildinfo|d\.ts)$/);
    }
    // No local paths or private project names leaked into any text file.
    const extracted = await extract("content");
    const walk = async (directory: string): Promise<string[]> =>
      (
        await Promise.all(
          (
            await readdir(directory, { withFileTypes: true })
          ).map((entry) =>
            entry.isDirectory()
              ? walk(join(directory, entry.name))
              : [join(directory, entry.name)],
          ),
        )
      ).flat();
    for (const path of await walk(extracted)) {
      if (/\.(png|jpg|mp4|mp3|wav)$/.test(path)) continue;
      const text = await readFile(path, "utf8");
      expect(text, path).not.toMatch(
        /\/Users\/|NaraFrame-projects|NaraFrame-archive/,
      );
    }
  });

  it("ships the skill's engine declaration for this exact version", async () => {
    const extracted = await extract("declaration");
    const declared = await json(
      join(extracted, "skills/naraframe/engine.json"),
    );
    expect(declared).toMatchObject({
      engine: "naraframe",
      version: metadata.version,
    });
  });

  it("pins the whole third-party tree in npm-shrinkwrap.json", async () => {
    const lock = JSON.parse(
      execFileSync("tar", ["-xzOf", tarball, "package/npm-shrinkwrap.json"], {
        encoding: "utf8",
        maxBuffer: 16 * 1024 * 1024,
      }),
    );
    expect(lock).toMatchObject({
      name: "naraframe",
      version: metadata.version,
      lockfileVersion: 3,
    });
    const packages: Record<
      string,
      {
        version: string;
        resolved?: string;
        integrity?: string;
        inBundle?: boolean;
        dependencies?: Record<string, string>;
        bundleDependencies?: string[];
      }
    > = lock.packages;

    // The root entry mirrors the published manifest.
    expect(packages[""]).toMatchObject({
      name: "naraframe",
      version: metadata.version,
      dependencies: metadata.dependencies,
      bundleDependencies: internal,
    });
    // Every direct pin resolves to exactly the declared version.
    for (const [name, pin] of Object.entries(metadata.dependencies))
      expect(packages[`node_modules/${name}`]?.version, name).toBe(pin);

    // NaraFrame's own packages travel in the tarball: recorded as bundled, with
    // no registry location, so npm never asks the registry for them.
    for (const name of internal) {
      const entry = packages[`node_modules/${name}`];
      expect(entry.inBundle).toBe(true);
      expect(entry.resolved).toBeUndefined();
      expect(entry.integrity).toBeUndefined();
    }
    const bundled = Object.entries(packages).filter(
      ([, entry]) => entry.inBundle,
    );
    expect(bundled.map(([path]) => path).sort()).toEqual(
      internal.map((name) => `node_modules/${name}`).sort(),
    );
    expect(
      Object.keys(packages).filter(
        (path) =>
          path.includes("@naraframe/") &&
          !path.startsWith("node_modules/@naraframe/"),
      ),
    ).toEqual([]);

    // Everything else is a registry package with a fixed location and checksum.
    const thirdParty = Object.entries(packages).filter(
      ([path]) => path !== "" && !path.startsWith("node_modules/@naraframe/"),
    );
    expect(thirdParty.length).toBeGreaterThan(100);
    for (const [path, entry] of thirdParty) {
      expect(entry.version, path).toMatch(/^\d+\.\d+\.\d+/);
      expect(entry.resolved, path).toMatch(/^https:\/\/registry\.npmjs\.org\//);
      expect(entry.integrity, path).toMatch(/^sha\d+-/);
    }

    // The tree is closed: each runtime dependency of each entry is present at
    // or above it, including the bundled packages' own dependencies.
    for (const [path, entry] of Object.entries(packages)) {
      for (const dependency of Object.keys(entry.dependencies ?? {})) {
        let owner = path;
        let found = false;
        for (;;) {
          if (
            packages[`${owner ? `${owner}/` : ""}node_modules/${dependency}`]
          ) {
            found = true;
            break;
          }
          if (!owner) break;
          const cut = owner.lastIndexOf("/node_modules/");
          owner = cut < 0 ? "" : owner.slice(0, cut);
        }
        expect(found, `${path} -> ${dependency}`).toBe(true);
      }
    }

    // No local paths or private names leaked into the lock.
    const text = JSON.stringify(lock);
    expect(text).not.toMatch(/\/Users\/|NaraFrame-projects|file:|\.\.\//);
  });

  it("states the MIT licence, the Remotion terms and every direct dependency", async () => {
    const extracted = await extract("rights");
    const licence = await readFile(join(extracted, "LICENSE"), "utf8");
    expect(licence).toBe(await readFile(join(repository, "LICENSE"), "utf8"));
    expect(licence).toMatch(/^MIT License\n\nCopyright \(c\) 2026 /);
    const notice = await readFile(
      join(extracted, "THIRD-PARTY-NOTICES.md"),
      "utf8",
    );
    expect(notice).toContain("remotion.pro/license");
    expect(notice).toContain("company licence");
    expect(notice).toMatch(/LICENSE\.md/);
    const rights = await json(join(extracted, "distribution-rights.json"));
    expect(rights.status).toBe("mit-code-third-party-separate");
    expect(Object.keys(rights.dependencies).sort()).toEqual(
      Object.keys(metadata.dependencies)
        .filter((name) => !internal.includes(name))
        .sort(),
    );
    for (const [name, info] of Object.entries<{
      version: string;
      license: string;
    }>(rights.dependencies)) {
      // The maintained notice agrees with the packages actually pinned.
      const row = notice
        .split("\n")
        .find((line) => line.startsWith(`| \`${name}\` |`));
      expect(row, name).toBeDefined();
      expect(row).toContain(info.version);
      expect(row).toContain(
        info.license === "MIT" ? "MIT" : "Remotion licence",
      );
    }
  });

  it("runs from an npm-style layout and keeps engineIdentity stable across installs", async () => {
    const first = await extract("first");
    await linkDependencies("first");
    const second = await extract("second");
    await linkDependencies("second");
    const version = invoke(first, "version");
    expect(version.data.resourceRoot).toBe(first);
    expect(version.data.version).toBe(metadata.version);
    expect(version.data.engineIdentity).toMatch(/^[0-9a-f]{64}$/);
    // Same tarball and dependency versions in another directory: same identity.
    expect(invoke(second, "version").data.engineIdentity).toBe(
      version.data.engineIdentity,
    );
    const doctor = invoke(first, "doctor");
    expect(
      doctor.data.checks.find(
        (check: { id: string }) => check.id === "packages",
      ).status,
    ).toBe("ready");

    // A different installed dependency version changes the identity.
    const zod = join(scratch, "second/node_modules/zod");
    const real = await realpath(zod);
    await rm(zod);
    await cp(real, zod, { recursive: true });
    const zodMetadata = await json(join(zod, "package.json"));
    await writeFile(
      join(zod, "package.json"),
      JSON.stringify({ ...zodMetadata, version: "9.9.9" }),
    );
    expect(invoke(second, "version").data.engineIdentity).not.toBe(
      version.data.engineIdentity,
    );

    // A different declared pin in a bundled package changes it too.
    const third = await extract("third");
    await linkDependencies("third");
    const bundled = join(
      third,
      "node_modules/@naraframe/renderer-remotion/package.json",
    );
    const renderer = await json(bundled);
    renderer.dependencies.react = "19.0.0";
    await writeFile(bundled, JSON.stringify(renderer));
    expect(invoke(third, "version").data.engineIdentity).not.toBe(
      version.data.engineIdentity,
    );
  }, 120_000);
});
