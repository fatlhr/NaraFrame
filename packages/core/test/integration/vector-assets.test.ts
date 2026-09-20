import { createHash } from "node:crypto";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { compileDraft, loadPlanProject } from "@naraframe/core";
import { afterEach, describe, expect, it } from "vitest";

const sampleRoot = new URL(
  "../../../../samples/krakatau-draft",
  import.meta.url,
).pathname;

const roots: string[] = [];
afterEach(async () => {
  await Promise.all(
    roots.splice(0).map((r) => rm(r, { recursive: true, force: true })),
  );
});

const ART = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120">
  <defs>
    <linearGradient id="dusk" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#141A24"/>
      <stop offset="1" stop-color="#3A4657"/>
    </linearGradient>
    <clipPath id="window"><rect x="10" y="10" width="180" height="100"/></clipPath>
  </defs>
  <rect x="0" y="0" width="200" height="120" fill="url(#dusk)" clip-path="url(#window)"/>
  <circle cx="150" cy="40" r="18" fill="#F2A03D"/>
</svg>`;

/** A project whose one scene places a vector illustration. */
const makeProject = async (markup: string = ART): Promise<string> => {
  const root = await mkdtemp(join(tmpdir(), "naraframe-vector-"));
  roots.push(root);
  for (const entry of ["naraframe.json", "profile.lock.json", "assets"]) {
    await cp(join(sampleRoot, entry), join(root, entry), { recursive: true });
  }
  await mkdir(join(root, "assets"), { recursive: true });
  await writeFile(join(root, "assets", "art.svg"), markup);
  const sha = createHash("sha256")
    .update(await readFile(join(root, "assets", "art.svg")))
    .digest("hex");

  const manifest = JSON.parse(
    await readFile(join(root, "assets", "manifest.json"), "utf8"),
  );
  manifest.assets = [
    ...manifest.assets,
    {
      id: "art",
      status: "ready",
      kind: "svg",
      path: "assets/art.svg",
      sha256: sha,
      origin: { type: "generated", source: "vector-assets.test.ts" },
    },
  ];
  await writeFile(
    join(root, "assets", "manifest.json"),
    JSON.stringify(manifest, null, 2),
  );

  await writeFile(
    join(root, "scenes.json"),
    JSON.stringify(
      {
        schemaVersion: 1,
        scenes: [
          {
            id: "shot",
            narrativeRole: "hook",
            durationMs: 4000,
            visual: {
              type: "composition",
              layers: [
                {
                  id: "art",
                  type: "image",
                  assetId: "art",
                  fit: "contain",
                  frame: { x: 40, y: 400, width: 1000, height: 600 },
                  opacity: 1,
                  rotationDeg: 0,
                  zIndex: 0,
                },
                {
                  id: "headline",
                  type: "text",
                  text: "Medan? Katanya semrawut.",
                  spans: [
                    { text: "Medan? " },
                    { text: "Katanya ", emphasis: "quiet" },
                    { text: "semrawut", emphasis: "accent" },
                    { text: "." },
                  ],
                  frame: { x: 88, y: 1200, width: 904, height: 400 },
                  role: "display",
                  opacity: 1,
                  rotationDeg: 0,
                  zIndex: 1,
                },
              ],
            },
            beats: [],
            transition: { type: "cut" },
          },
        ],
      },
      null,
      2,
    ),
  );
  return root;
};

describe("vector assets from source to compiled draft", () => {
  it("loads the artwork, namespaces its ids, and carries it into the compiled draft", async () => {
    const loaded = await loadPlanProject(await makeProject());
    expect(loaded.ok, JSON.stringify(loaded.issues)).toBe(true);
    if (!loaded.ok) return;

    const vector = loaded.value.source.vectors?.art;
    expect(vector).toBeDefined();
    expect(vector?.viewBox).toEqual({
      minX: 0,
      minY: 0,
      width: 200,
      height: 120,
    });
    // The gradient and clip survived, under ids scoped to this asset.
    expect(vector?.body).toMatch(/id="[0-9a-f]{12}-dusk"/);
    expect(vector?.body).toMatch(/fill="url\(#[0-9a-f]{12}-dusk\)"/);
    expect(vector?.body).toMatch(/clip-path="url\(#[0-9a-f]{12}-window\)"/);

    const compiled = compileDraft(loaded.value.source);
    expect(compiled.ok, JSON.stringify(compiled.issues)).toBe(true);
    if (!compiled.ok) return;
    const asset = compiled.value.assets.art;
    expect(asset).toMatchObject({ kind: "svg", publicPath: "assets/art.svg" });
    if (asset && asset.kind === "svg") {
      expect(asset.body).toBe(vector?.body);
      expect(asset.viewBox).toEqual(vector?.viewBox);
    }
  });

  it("changes the render key when the artwork changes, and not otherwise", async () => {
    const first = await loadPlanProject(await makeProject());
    const same = await loadPlanProject(await makeProject());
    const different = await loadPlanProject(
      await makeProject(ART.replace("#F2A03D", "#4C8C86")),
    );
    if (!first.ok || !same.ok || !different.ok) throw new Error("fixture");
    const key = (source: typeof first.value.source) => {
      const compiled = compileDraft(source);
      if (!compiled.ok) throw new Error("compile");
      return compiled.value.assemblyKey;
    };
    expect(key(same.value.source)).toBe(key(first.value.source));
    expect(key(different.value.source)).not.toBe(key(first.value.source));
  });

  it("refuses to load a project whose artwork can run code", async () => {
    const loaded = await loadPlanProject(
      await makeProject(
        ART.replace("<circle", "<script>alert(1)</script><circle"),
      ),
    );
    expect(loaded.ok).toBe(false);
    const issue = loaded.issues.find((entry) => entry.code === "SVG_UNSAFE");
    expect(issue?.message).toContain("art");
    expect(issue?.artifact).toBe("assets/manifest.json");
  });

  it("keeps the spans on the compiled layer so the renderer paints the same runs", async () => {
    const loaded = await loadPlanProject(await makeProject());
    if (!loaded.ok) throw new Error("fixture");
    const compiled = compileDraft(loaded.value.source);
    if (!compiled.ok) throw new Error("compile");
    const layer = compiled.value.scenes[0]?.layers.find(
      (entry) => entry.id === "headline",
    );
    expect(layer?.type === "text" && layer.spans).toEqual([
      { text: "Medan? " },
      { text: "Katanya ", emphasis: "quiet" },
      { text: "semrawut", emphasis: "accent" },
      { text: "." },
    ]);
  });
});
