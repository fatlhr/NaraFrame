import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { compileDraft, loadPlanProject } from "@naraframe/core";
import { afterEach, describe, expect, it, vi } from "vitest";

const renderMedia = vi.hoisted(() => vi.fn(async () => undefined));
const selectComposition = vi.hoisted(() => vi.fn());

vi.mock("@remotion/bundler", () => ({
  bundle: vi.fn(async () => "http://localhost/serve"),
}));
vi.mock("@remotion/renderer", () => ({
  makeCancelSignal: () => ({ cancel: () => undefined, cancelSignal: {} }),
  renderMedia,
  selectComposition,
}));

import { visualPreflightProperty } from "../../src/remotion/visual-preflight.js";
import { RENDER_CONCURRENCY, renderDraft } from "../../src/render-draft.js";

const sampleRoot = fileURLToPath(
  new URL("../../../../samples/krakatau-draft", import.meta.url),
);
const roots: string[] = [];
afterEach(async () => {
  renderMedia.mockClear();
  await Promise.all(
    roots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
  );
});

describe("render concurrency", () => {
  it("captures frames serially", () => {
    expect(RENDER_CONCURRENCY).toBe(1);
  });

  it("passes the serial concurrency to renderMedia and no diagnosis override", async () => {
    const loaded = await loadPlanProject(sampleRoot);
    if (!loaded.ok) throw new Error("sample must load");
    const compiled = compileDraft(loaded.value.source);
    if (!compiled.ok) throw new Error("sample must compile");
    const draft = compiled.value;
    selectComposition.mockResolvedValue({
      props: {
        ...draft,
        [visualPreflightProperty]: { issues: [], frames: [] },
      },
      durationInFrames: draft.totalFrames,
      width: draft.width,
      height: draft.height,
      fps: draft.fps,
    });
    const root = await mkdtemp(join(tmpdir(), "naraframe-concurrency-"));
    roots.push(root);

    process.env.NARAFRAME_DIAG_CONCURRENCY = "4";
    try {
      await renderDraft({
        draft,
        projectRoot: root,
        outputPath: join(root, "out.mp4"),
        browserExecutable: process.execPath,
      });
    } finally {
      delete process.env.NARAFRAME_DIAG_CONCURRENCY;
    }

    expect(renderMedia).toHaveBeenCalledTimes(1);
    const call = renderMedia.mock.calls[0] as unknown as [
      Record<string, unknown>,
    ];
    expect(call[0].concurrency).toBe(RENDER_CONCURRENCY);
    expect(call[0]).not.toHaveProperty("chromiumOptions");
  });
});
