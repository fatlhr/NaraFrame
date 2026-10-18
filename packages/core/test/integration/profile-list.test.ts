import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { listProfiles } from "../../src/profile/list.js";

const builtIns = fileURLToPath(
  new URL("../../../../profiles", import.meta.url),
);
const roots: string[] = [];
afterEach(async () => {
  await Promise.all(
    roots.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
  );
});

describe("listProfiles", () => {
  it("lists every built-in profile, each readable as a complete profile", async () => {
    const { profiles, issues } = await listProfiles(builtIns);
    expect(issues).toEqual([]);
    expect(profiles.map((profile) => profile.id)).toEqual([
      "current-issues",
      "general-explainer",
    ]);
    for (const profile of profiles) {
      expect(profile.summary.length).toBeGreaterThan(20);
      expect(profile.summary).not.toMatch(/^#/);
      expect(profile.preferredDurationMs.min).toBeLessThanOrEqual(
        profile.preferredDurationMs.max,
      );
    }
  });

  it("ignores folders that are not profiles and reports an unreadable one", async () => {
    const root = await mkdtemp(join(tmpdir(), "naraframe-profile-list-"));
    roots.push(root);
    await mkdir(join(root, "not-a-profile"));
    await writeFile(join(root, "not-a-profile", "notes.txt"), "x");
    await writeFile(join(root, "stray-file.json"), "{}");
    await mkdir(join(root, "broken"));
    await writeFile(join(root, "broken", "profile.json"), "{ not json");
    const { profiles, issues } = await listProfiles(root);
    expect(profiles).toEqual([]);
    expect(issues).toEqual([
      expect.objectContaining({
        code: "PROFILE_UNREADABLE",
        severity: "warning",
        artifact: "profiles/broken",
      }),
    ]);
  });

  it("returns an empty list for a missing folder", async () => {
    expect(await listProfiles(join(tmpdir(), "naraframe-no-such-dir"))).toEqual(
      { profiles: [], issues: [] },
    );
  });
});
