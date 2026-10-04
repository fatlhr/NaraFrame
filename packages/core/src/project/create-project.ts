import { randomUUID } from "node:crypto";
import {
  access,
  copyFile,
  mkdir,
  readFile,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import { basename, dirname, extname, join, resolve } from "node:path";
import {
  type Issue,
  issuesFromZodError,
  type Result,
  sortIssues,
} from "../model/issue.js";
import type { AssetManifest } from "../schema/asset.js";
import {
  type LockedProfileAsset,
  type ProfileLock,
  type ProfileSource,
  ProfileSourceSchema,
} from "../schema/profile.js";
import type { ProjectConfig } from "../schema/project.js";
import type { Scenes } from "../schema/scene.js";
import { sha256File, sha256Text } from "./hash.js";
import { resolveSafeExistingFile } from "./safe-path.js";

export interface CreateProjectOptions {
  destination: string;
  projectId: string;
  title: string;
  profileDirectory: string;
  profileSource: {
    kind: "repository" | "local";
    identity: string;
  };
}

export interface CreatedProject {
  root: string;
  files: string[];
}

const createIssue = (
  code: string,
  artifact: string,
  path: string,
  message: string,
  suggestion: string,
): Issue => ({
  code,
  severity: "error",
  responsible: "user",
  artifact,
  path,
  message,
  suggestion,
});

const readProfileSource = async (
  profileDirectory: string,
): Promise<Result<{ profile: ProfileSource; direction: string }>> => {
  let profileText: string;
  let direction: string;

  try {
    [profileText, direction] = await Promise.all([
      readFile(join(profileDirectory, "profile.json"), "utf8"),
      readFile(join(profileDirectory, "direction.md"), "utf8"),
    ]);
  } catch {
    return {
      ok: false,
      issues: [
        createIssue(
          "PROFILE_SOURCE_MISSING",
          "profile",
          "/",
          "Profile source must contain readable profile.json and direction.md files.",
          "Add both files to the profile directory and retry.",
        ),
      ],
    };
  }

  let profileJson: unknown;
  try {
    profileJson = JSON.parse(profileText);
  } catch {
    return {
      ok: false,
      issues: [
        createIssue(
          "PROFILE_JSON_INVALID",
          "profile.json",
          "/",
          "Profile source is not valid JSON.",
          "Correct profile.json syntax and retry.",
        ),
      ],
    };
  }

  const parsed = ProfileSourceSchema.safeParse(profileJson);
  if (!parsed.success) {
    return {
      ok: false,
      issues: issuesFromZodError(parsed.error, "profile.json"),
    };
  }

  if (direction.trim().length === 0) {
    return {
      ok: false,
      issues: [
        createIssue(
          "PROFILE_DIRECTION_EMPTY",
          "direction.md",
          "/",
          "Profile direction must not be empty.",
          "Describe the profile's editorial and visual direction.",
        ),
      ],
    };
  }

  return {
    ok: true,
    value: { profile: parsed.data, direction },
    issues: [],
  };
};

const prepareProfileAssets = async (
  profileDirectory: string,
  profile: ProfileSource,
): Promise<Result<Array<LockedProfileAsset & { sourcePath: string }>>> => {
  const assets: Array<LockedProfileAsset & { sourcePath: string }> = [];
  const issues: Issue[] = [];

  for (const [index, asset] of profile.assets.entries()) {
    const resolved = await resolveSafeExistingFile(
      profileDirectory,
      asset.path,
      { artifact: "profile.json", path: `/assets/${index}/path` },
    );
    if (!resolved.ok) {
      issues.push(...resolved.issues);
      continue;
    }

    const sha256 = await sha256File(resolved.value);
    if (asset.sha256 && asset.sha256 !== sha256) {
      issues.push(
        createIssue(
          "ASSET_HASH_MISMATCH",
          "profile.json",
          `/assets/${index}/sha256`,
          `Declared hash for profile asset ${asset.id} does not match its file.`,
          "Update the declared hash or restore the intended asset file.",
        ),
      );
      continue;
    }

    const extension = extname(asset.path).toLowerCase();
    assets.push({
      id: asset.id,
      kind: asset.kind,
      path: `assets/profile/${sha256}${extension}`,
      sha256,
      ...(asset.role ? { role: asset.role } : {}),
      ...(asset.family ? { family: asset.family } : {}),
      ...(asset.weight !== undefined ? { weight: asset.weight } : {}),
      sourcePath: resolved.value,
    });
  }

  if (issues.length > 0) {
    return { ok: false, issues: sortIssues(issues) };
  }

  return { ok: true, value: assets, issues: [] };
};

const writeJson = async (filePath: string, value: unknown): Promise<void> => {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
};

const pathExists = async (filePath: string): Promise<boolean> => {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
};

export interface BuiltProfileLock {
  lock: ProfileLock;
  assets: Array<LockedProfileAsset & { sourcePath: string }>;
}

/** Reads a profile directory and pins it as a lock plus the files it needs copied. */
export const buildProfileLock = async (
  profileDirectory: string,
  profileSource: CreateProjectOptions["profileSource"],
): Promise<Result<BuiltProfileLock>> => {
  const directory = resolve(profileDirectory);
  const source = await readProfileSource(directory);
  if (!source.ok) return source;
  const assets = await prepareProfileAssets(directory, source.value.profile);
  if (!assets.ok) return assets;
  return {
    ok: true,
    value: {
      lock: {
        ...source.value.profile,
        source: {
          ...profileSource,
          identity: `${profileSource.identity}@${source.value.profile.version}`,
        },
        direction: {
          text: source.value.direction,
          sha256: sha256Text(source.value.direction),
        },
        assets: assets.value.map(({ sourcePath: _, ...asset }) => asset),
      },
      assets: assets.value,
    },
    issues: [],
  };
};

export const createProject = async (
  options: CreateProjectOptions,
): Promise<Result<CreatedProject>> => {
  const destination = resolve(options.destination);
  if (await pathExists(destination)) {
    return {
      ok: false,
      issues: [
        createIssue(
          "PROJECT_EXISTS",
          basename(destination),
          "/",
          "Destination already exists.",
          "Choose a new project path or move the existing directory.",
        ),
      ],
    };
  }

  const built = await buildProfileLock(
    options.profileDirectory,
    options.profileSource,
  );
  if (!built.ok) {
    return built;
  }
  const preparedAssets = { value: built.value.assets };

  const staging = join(
    dirname(destination),
    `.${basename(destination)}.naraframe-create-${randomUUID()}`,
  );
  const files = [
    "naraframe.json",
    "profile.lock.json",
    "scenes.json",
    "assets/manifest.json",
  ];

  const project: ProjectConfig = {
    schemaVersion: 1,
    id: options.projectId,
    title: options.title,
    profile: {
      id: built.value.lock.id,
      version: built.value.lock.version,
    },
    format: {
      design: { width: 1080, height: 1920, fps: 30 },
      draft: { width: 540, height: 960, fps: 30 },
    },
    safetyMaxDurationMs: 180_000,
  };
  const profileLock = built.value.lock;
  const scenes: Scenes = { schemaVersion: 1, scenes: [] };
  const manifest: AssetManifest = { schemaVersion: 1, assets: [] };

  try {
    await mkdir(dirname(destination), { recursive: true });
    await mkdir(join(staging, "assets/profile"), { recursive: true });
    await mkdir(join(staging, "preview/builds"), { recursive: true });
    await mkdir(join(staging, ".naraframe/attempts"), { recursive: true });

    await writeJson(join(staging, "naraframe.json"), project);
    await writeJson(join(staging, "profile.lock.json"), profileLock);
    await writeJson(join(staging, "scenes.json"), scenes);
    await writeJson(join(staging, "assets/manifest.json"), manifest);

    for (const asset of preparedAssets.value) {
      const copiedPath = join(staging, asset.path);
      await copyFile(asset.sourcePath, copiedPath);
      if ((await sha256File(copiedPath)) !== asset.sha256) {
        throw new Error("Copied profile asset hash changed during creation.");
      }
    }

    await rename(staging, destination);
  } catch {
    await rm(staging, { recursive: true, force: true });
    return {
      ok: false,
      issues: [
        createIssue(
          "PROJECT_CREATE_FAILED",
          basename(destination),
          "/",
          "Project could not be created atomically.",
          "Check destination permissions and retry.",
        ),
      ],
    };
  }

  return {
    ok: true,
    value: { root: destination, files },
    issues: [],
  };
};
