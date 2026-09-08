import { access, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { compileDraft, loadPlanProject } from "@naraframe/core";
import { renderDraft } from "@naraframe/renderer-remotion";
import { describe, expect, it } from "vitest";

const sampleRoot = fileURLToPath(
  new URL("../../../../samples/krakatau-draft", import.meta.url),
);

describe("draft render", () => {
  it("renders the 18-second sample to a real MP4", async () => {
    const loaded = await loadPlanProject(sampleRoot);
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) {
      return;
    }

    const compiled = compileDraft(loaded.value.source);
    expect(compiled.ok).toBe(true);
    if (!compiled.ok) {
      return;
    }

    const outputDirectory = await mkdtemp(join(tmpdir(), "naraframe-m0-2-"));
    const outputPath = join(outputDirectory, "draft.mp4");
    const rendered = await renderDraft({
      draft: compiled.value,
      projectRoot: sampleRoot,
      outputPath,
    });

    await expect(access(outputPath)).resolves.toBeUndefined();
    expect(rendered).toMatchObject({
      outputPath,
      durationInFrames: 540,
      width: 540,
      height: 960,
      fps: 30,
    });
  });
});
