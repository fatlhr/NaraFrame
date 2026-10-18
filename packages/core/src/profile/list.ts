import { readdir } from "node:fs/promises";
import { join } from "node:path";
import type { Issue } from "../model/issue.js";
import { buildProfileLock } from "../project/create-project.js";

/** What a person needs to choose between profiles, without opening them. */
export interface ProfileListing {
  id: string;
  version: string;
  /** First sentence of the profile's direction, without the heading. */
  summary: string;
  requireSourcing: boolean;
  preferredDurationMs: { min: number; max: number };
  voiceStyleSignature: string;
  /** Profile folder; pass the id (or this path) to `create --profile`. */
  path: string;
}

/** The first sentence of the first paragraph under the heading. */
export const profileSummary = (direction: string): string => {
  const paragraph =
    direction
      .split(/\r?\n\s*\r?\n/)
      .map((block) => block.trim())
      .find((block) => block.length > 0 && !block.startsWith("#")) ?? "";
  const flat = paragraph.replace(/\s+/g, " ").trim();
  const end = flat.search(/[.!?](\s|$)/);
  return end === -1 ? flat : flat.slice(0, end + 1);
};

/**
 * Lists the profile folders directly inside `directory`. A folder that holds
 * no profile.json is ignored; a folder that does but cannot be read as a
 * profile is reported as a warning and left out of the list.
 */
export const listProfiles = async (
  directory: string,
): Promise<{ profiles: ProfileListing[]; issues: Issue[] }> => {
  let names: string[];
  try {
    names = (await readdir(directory, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b, "en"));
  } catch {
    return { profiles: [], issues: [] };
  }

  const profiles: ProfileListing[] = [];
  const issues: Issue[] = [];
  for (const name of names) {
    const folder = join(directory, name);
    let entries: string[];
    try {
      entries = await readdir(folder);
    } catch {
      continue;
    }
    if (!entries.includes("profile.json")) continue;

    const built = await buildProfileLock(folder, {
      kind: "repository",
      identity: `profiles/${name}`,
    });
    if (!built.ok) {
      issues.push({
        code: "PROFILE_UNREADABLE",
        severity: "warning",
        responsible: "system",
        artifact: `profiles/${name}`,
        path: "/",
        message: `Profile folder ${name} could not be read and is not listed.`,
        suggestion: `Run profile inspect ${folder} to see what is wrong.`,
      });
      continue;
    }
    const { lock } = built.value;
    profiles.push({
      id: lock.id,
      version: lock.version,
      summary: profileSummary(lock.direction.text),
      requireSourcing: lock.production.requireSourcing ?? false,
      preferredDurationMs: {
        min: lock.duration.preferredMinMs,
        max: lock.duration.preferredMaxMs,
      },
      voiceStyleSignature: lock.production.voiceStyleSignature,
      path: folder,
    });
  }
  return { profiles, issues };
};
