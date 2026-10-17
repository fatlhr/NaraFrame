import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { dirname, join, parse } from "node:path";
import { fileURLToPath } from "node:url";

// Version of a dependency as npm or pnpm actually placed it, found the way
// Node resolves it. The result does not depend on where the tree was hoisted.
const installedVersion = async (
  from: string,
  dependency: string,
): Promise<string> => {
  for (let directory = from; ; directory = dirname(directory)) {
    try {
      return JSON.parse(
        await readFile(
          join(directory, "node_modules", dependency, "package.json"),
          "utf8",
        ),
      ).version;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
    if (directory === parse(directory).root) return "unresolved";
  }
};

// Installation binding only: this does not change source revisions or render keys.
// Hash our built runtime/resources plus dependency pins, not private projects/cache.
export const engineIdentity = async (root: string): Promise<string> => {
  const hash = createHash("sha256");
  const visit = async (path: string, label: string): Promise<void> => {
    const entries = (await readdir(path, { withFileTypes: true })).sort(
      (a, b) => a.name.localeCompare(b.name, "en"),
    );
    for (const entry of entries) {
      if (entry.name === ".DS_Store") continue;
      const relative = `${label}/${entry.name}`;
      if (entry.isDirectory()) await visit(join(path, entry.name), relative);
      else if (entry.isFile()) {
        const bytes = await readFile(join(path, entry.name));
        hash.update(JSON.stringify([relative, bytes.length]));
        hash.update(bytes);
      } else throw new Error(`Unsupported engine resource: ${relative}`);
    }
  };
  await visit(join(root, "packages/cli/dist"), "cli");
  for (const name of ["@naraframe/core", "@naraframe/renderer-remotion"]) {
    const modules = dirname(fileURLToPath(import.meta.resolve(name)));
    await visit(modules, name);
    // Declared and installed versions of every third-party runtime dependency.
    const packageRoot = dirname(modules);
    const metadata = JSON.parse(
      await readFile(join(packageRoot, "package.json"), "utf8"),
    );
    for (const [dependency, declared] of Object.entries(
      (metadata.dependencies ?? {}) as Record<string, string>,
    ).sort(([a], [b]) => a.localeCompare(b, "en")))
      if (!dependency.startsWith("@naraframe/"))
        hash.update(
          JSON.stringify([
            "dependency",
            dependency,
            declared,
            await installedVersion(packageRoot, dependency),
          ]),
        );
  }
  for (const resource of [
    "profiles/current-issues",
    "library",
    "skills/naraframe",
  ])
    await visit(join(root, resource), resource);
  for (const file of ["package.json", "scripts/install-skill.mjs"])
    hash.update(
      JSON.stringify([file, await readFile(join(root, file), "utf8")]),
    );
  for (const file of ["pnpm-lock.yaml", "distribution-rights.json"]) {
    try {
      hash.update(
        JSON.stringify([file, await readFile(join(root, file), "utf8")]),
      );
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }
  return hash.digest("hex");
};
