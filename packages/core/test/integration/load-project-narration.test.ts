import { createHash } from "node:crypto";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadPlanProject } from "@naraframe/core";
import { afterEach, describe, expect, it } from "vitest";

const sampleRoot = new URL(
  "../../../../samples/krakatau-draft",
  import.meta.url,
).pathname;

const audioBytes = Buffer.from("not really an mp3, but stable bytes");
const audioSha =
  "8e7a91b5e6ab4b3d3a3b7ac2f1f0d7e9d7f5dd0b9c11f7c06eb0c5c4ce6f9b1d";

const narrationJson = (audioAssetId: string) => ({
  schemaVersion: 1,
  order: ["only"],
  blocks: [
    {
      id: "only",
      text: "Satu kalimat.",
      audioAssetId,
      audioDurationMs: 2000,
      pauseAfterMs: 0,
      phrases: [
        { id: "only-p1", text: "Satu kalimat.", startMs: 100, endMs: 1900 },
      ],
    },
  ],
});

describe("loadPlanProject narration.json", () => {
  const dirs: string[] = [];
  const copyProject = async (): Promise<string> => {
    const dir = await mkdtemp(join(tmpdir(), "naraframe-load-"));
    dirs.push(dir);
    for (const entry of [
      "naraframe.json",
      "profile.lock.json",
      "scenes.json",
      "assets",
    ]) {
      await cp(join(sampleRoot, entry), join(dir, entry), { recursive: true });
    }
    return dir;
  };
  afterEach(async () => {
    await Promise.all(
      dirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
    );
  });

  const addAudio = async (dir: string, sha256: string) => {
    const actual = createHash("sha256").update(audioBytes).digest("hex");
    await cp(join(sampleRoot, "assets"), join(dir, "assets"), {
      recursive: true,
    });
    await writeFile(join(dir, "voice.mp3"), audioBytes);
    const manifestPath = join(dir, "assets/manifest.json");
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    manifest.assets.push({
      id: "voice-only",
      status: "ready",
      kind: "mp3",
      path: "voice.mp3",
      sha256: sha256 === "actual" ? actual : sha256,
      origin: { type: "generated" },
    });
    await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  };

  it("loads a project without narration.json and leaves narration undefined", async () => {
    const result = await loadPlanProject(await copyProject());
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.source.narration).toBeUndefined();
  });

  it("loads a valid narration.json together with its hashed audio asset", async () => {
    const dir = await copyProject();
    await addAudio(dir, "actual");
    await writeFile(
      join(dir, "narration.json"),
      JSON.stringify(narrationJson("voice-only")),
    );
    const result = await loadPlanProject(dir);
    expect(result.ok).toBe(true);
    if (result.ok)
      expect(result.value.source.narration?.blocks[0]?.id).toBe("only");
  });

  it("reports malformed narration.json as SOURCE_JSON_INVALID for that artifact", async () => {
    const dir = await copyProject();
    await writeFile(join(dir, "narration.json"), "{ not json");
    const result = await loadPlanProject(dir);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        code: "SOURCE_JSON_INVALID",
        artifact: "narration.json",
      }),
    );
  });

  it("rejects a ready audio asset whose file no longer matches its hash", async () => {
    const dir = await copyProject();
    await addAudio(dir, audioSha);
    await writeFile(
      join(dir, "narration.json"),
      JSON.stringify(narrationJson("voice-only")),
    );
    const result = await loadPlanProject(dir);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues.map((i) => i.code)).toContain("ASSET_HASH_MISMATCH");
  });
});
