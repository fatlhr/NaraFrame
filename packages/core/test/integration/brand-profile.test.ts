import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  applyProfile,
  checkProductionReadiness,
  compileDraft,
  createProject,
  loadPlanProject,
  ProfileSourceSchema,
  planProfileApply,
  undoProject,
} from "@naraframe/core";
import { afterEach, describe, expect, it } from "vitest";
import { png, sha } from "./recipe-fixture.js";

const dirs: string[] = [];
afterEach(async () => {
  await Promise.all(
    dirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
  );
});
const tmp = async (): Promise<string> => {
  const dir = await mkdtemp(join(tmpdir(), "naraframe-brand-"));
  dirs.push(dir);
  return dir;
};

const writeBrandProfile = async (
  id: string,
  brand: Record<string, unknown> | null,
): Promise<string> => {
  const dir = await tmp();
  await mkdir(join(dir, "assets"), { recursive: true });
  await writeFile(join(dir, "assets", "logo.png"), png(64, 64));
  await writeFile(
    join(dir, "profile.json"),
    JSON.stringify({
      schemaVersion: 1,
      id,
      version: "1.0.0",
      render: {
        palette: {
          background: "#111111",
          surface: "#EEEEEE",
          text: "#FFFFFF",
          accent: "#FF5500",
        },
        typography: {
          fontFamily: "Arial, sans-serif",
          headingWeight: 800,
          bodyWeight: 500,
        },
        safeZone: { top: 80, right: 44, bottom: 100, left: 44 },
        spacingUnit: 8,
        motion: {
          revealDurationMs: 500,
          emphasizeScale: 1.08,
          focusScale: 1.06,
        },
      },
      production: {
        voiceStyleSignature: "voice-v1",
        illustrationStyleSignature: "illustration-v1",
        timing: { wordLevelRequired: false },
        assetPolicy: { allowPlannedInDraft: true },
        audioMode: "music",
      },
      duration: { preferredMinMs: 1000, preferredMaxMs: 30_000 },
      ...(brand ? { brand } : {}),
      lockedPaths: ["format.design", "format.draft"],
      overridablePaths: ["render.palette"],
      assets: [
        {
          id: `${id}-logo`,
          kind: "png",
          path: "assets/logo.png",
          role: "logo",
        },
      ],
    }),
  );
  await writeFile(join(dir, "direction.md"), `Direction for ${id}.`);
  return dir;
};

const brandA = {
  name: "Brand A",
  audience: "Parents",
  cta: { label: "Call Brand A", url: "brand-a.example" },
};
const brandB = {
  name: "Brand B",
  cta: { label: "Start with Brand B", url: "brand-b.example" },
};
const profileSource = { kind: "local" as const, identity: "test" };

type Binding = "neutral" | { brand: string; role?: string } | undefined;

const makeProject = async (
  profileDirectory: string,
  bindings: Record<string, Binding>,
): Promise<string> => {
  const root = join(await tmp(), "project");
  const created = await createProject({
    destination: root,
    projectId: "project",
    title: "Project",
    profileDirectory,
    profileSource,
  });
  if (!created.ok) throw new Error(created.issues.map((i) => i.code).join());
  const assets = Object.entries(bindings).map(([id, binding]) => {
    const bytes = png(40, 40);
    return { id, bytes, binding };
  });
  for (const asset of assets) {
    await writeFile(join(root, "assets", `${asset.id}.png`), asset.bytes);
  }
  await writeFile(
    join(root, "assets", "manifest.json"),
    JSON.stringify({
      schemaVersion: 1,
      assets: assets.map(({ id, bytes, binding }) => ({
        id,
        status: "ready",
        kind: "png",
        path: `assets/${id}.png`,
        sha256: sha(bytes),
        ...(binding ? { binding } : {}),
        origin: { type: "generated" },
      })),
    }),
  );
  const config = JSON.parse(
    await readFile(join(root, "naraframe.json"), "utf8"),
  );
  await writeFile(
    join(root, "naraframe.json"),
    JSON.stringify({ ...config, audioMode: "silent" }),
  );
  const image = (id: string, x: number) => ({
    id: `${id}-layer`,
    type: "image",
    assetId: id,
    fit: "contain",
    frame: { x, y: 600, width: 200, height: 200 },
    opacity: 1,
    rotationDeg: 0,
    zIndex: 1,
  });
  await writeFile(
    join(root, "scenes.json"),
    JSON.stringify({
      schemaVersion: 1,
      scenes: [
        {
          id: "cta",
          narrativeRole: "cta",
          durationMs: 1000,
          carriesFactualClaim: false,
          visual: {
            type: "composition",
            layers: [
              ...Object.keys(bindings).map((id, index) =>
                image(id, 100 + index * 220),
              ),
              {
                id: "cta-label",
                type: "text",
                text: "Call Brand A",
                binding: "brand.cta.label",
                frame: { x: 100, y: 1000, width: 880, height: 120 },
                opacity: 1,
                rotationDeg: 0,
                zIndex: 2,
              },
            ],
          },
          beats: [],
          transition: { type: "cut" },
        },
      ],
    }),
  );
  return root;
};

const readiness = async (root: string, finalExport = true) => {
  const loaded = await loadPlanProject(root);
  if (!loaded.ok) throw new Error(loaded.issues.map((i) => i.code).join());
  const final = compileDraft(
    loaded.value.source,
    { type: "project" },
    { mode: "final" },
  );
  if (!final.ok) throw new Error(final.issues.map((i) => i.code).join());
  return {
    compile: final.issues
      .filter(
        (issue) =>
          issue.code.includes("BRAND") || issue.code.includes("BINDING"),
      )
      .map((issue) => [issue.code, issue.severity]),
    errors: checkProductionReadiness(
      loaded.value.source,
      final.value,
      final.issues,
      { finalExport },
    )
      .filter((issue) => issue.severity === "error")
      .map((issue) => `${issue.code}:${issue.entityId}`)
      .sort(),
  };
};

describe("brand-managed profiles", () => {
  it("blocks only a final export on unknown or mismatched brand identity", async () => {
    const a = await writeBrandProfile("brand-a", brandA);
    const root = await makeProject(a, {
      logo: { brand: "brand-a", role: "logo" },
      tutor: { brand: "brand-a", role: "person" },
      chart: "neutral",
      photo: undefined,
    });
    const draft = await readiness(root, false);
    expect(draft.compile).toEqual([["ASSET_BINDING_UNKNOWN", "warning"]]);
    expect(draft.errors).toEqual([]);
    expect((await readiness(root)).errors).toEqual([
      "ASSET_BINDING_UNKNOWN:photo",
    ]);
  });

  it("classifies a switch without changing anything", async () => {
    const a = await writeBrandProfile("brand-a", brandA);
    const b = await writeBrandProfile("brand-b", brandB);
    const root = await makeProject(a, {
      logo: { brand: "brand-a", role: "logo" },
      tutor: { brand: "brand-a", role: "person" },
      chart: "neutral",
      photo: undefined,
    });
    const before = await readFile(join(root, "profile.lock.json"), "utf8");
    const plan = await planProfileApply({
      root,
      profileDirectory: b,
      profileSource,
    });
    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    expect(plan.value.bindings).toEqual({
      branded: [{ assetId: "logo", role: "logo", replacement: "brand-b-logo" }],
      incompatible: [{ assetId: "tutor", role: "person" }],
      neutral: ["chart"],
      unknown: ["photo"],
      text: [
        {
          sceneId: "cta",
          layerId: "cta-label",
          binding: "brand.cta.label",
          current: "Call Brand A",
          target: "Start with Brand B",
        },
      ],
      claims: [],
    });
    expect(plan.value.effects).toEqual(
      expect.arrayContaining(["editorial-review", "replace-assets"]),
    );
    expect(await readFile(join(root, "profile.lock.json"), "utf8")).toBe(
      before,
    );
  });

  it("applies a switch reproducibly, blocks the export, and undoes it", async () => {
    const a = await writeBrandProfile("brand-a", brandA);
    const b = await writeBrandProfile("brand-b", brandB);
    const root = await makeProject(a, {
      logo: { brand: "brand-a", role: "logo" },
      chart: "neutral",
    });
    expect((await readiness(root)).errors).toEqual([]);
    const first = await applyProfile({
      root,
      profileDirectory: b,
      profileSource,
    });
    expect(first.ok).toBe(true);
    expect((await readiness(root)).errors).toEqual([
      "BRAND_ASSET_MISMATCH:logo",
      "BRAND_TEXT_MISMATCH:cta-label",
    ]);
    const undone = await undoProject({ root });
    expect(undone.ok).toBe(true);
    expect((await readiness(root)).errors).toEqual([]);
    const second = await applyProfile({
      root,
      profileDirectory: b,
      profileSource,
    });
    expect(second.ok && first.ok && second.value.revisionId).toBe(
      first.ok ? first.value.revisionId : "",
    );
  });

  it("leaves profiles without a brand block unaffected", async () => {
    const plain = await writeBrandProfile("plain", null);
    const root = await makeProject(plain, { photo: undefined });
    const config = JSON.parse(
      await readFile(join(root, "scenes.json"), "utf8"),
    );
    config.scenes[0].visual.layers = config.scenes[0].visual.layers.filter(
      (layer: { id: string }) => layer.id !== "cta-label",
    );
    await writeFile(join(root, "scenes.json"), JSON.stringify(config));
    const result = await readiness(root);
    expect(result.compile).toEqual([]);
    expect(result.errors).toEqual([]);
  });

  it("refuses a brand role on a font asset", () => {
    const parsed = ProfileSourceSchema.safeParse({
      schemaVersion: 1,
      id: "x",
      version: "1.0.0",
      render: {
        palette: {
          background: "#111111",
          surface: "#EEEEEE",
          text: "#FFFFFF",
          accent: "#FF5500",
        },
        typography: {
          fontFamily: "Arial",
          headingWeight: 800,
          bodyWeight: 500,
        },
        safeZone: { top: 80, right: 44, bottom: 100, left: 44 },
        spacingUnit: 8,
        motion: {
          revealDurationMs: 500,
          emphasizeScale: 1.08,
          focusScale: 1.06,
        },
      },
      production: {
        voiceStyleSignature: "v",
        illustrationStyleSignature: "i",
        timing: { wordLevelRequired: false },
        assetPolicy: { allowPlannedInDraft: true },
      },
      duration: { preferredMinMs: 1000, preferredMaxMs: 2000 },
      lockedPaths: [],
      overridablePaths: [],
      assets: [
        { id: "f", kind: "font", path: "f.woff2", family: "F", role: "logo" },
      ],
    });
    expect(parsed.success).toBe(false);
  });
});
