import { createHash } from "node:crypto";
import type { Issue, Result } from "../model/issue.js";
import type { CompiledAsset, CompiledDraft } from "../schema/compiled.js";
import { CompiledDraftSchema } from "../schema/compiled.js";
import type { PlanSource } from "../schema/export-schema.js";

const stableValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(stableValue);
  }

  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, stableValue(nested)]),
    );
  }

  return value;
};

const hashValue = (value: unknown): string =>
  createHash("sha256")
    .update(JSON.stringify(stableValue(value)))
    .digest("hex");

const msToFrameOffset = (milliseconds: number, fps: number): number =>
  Math.round((milliseconds / 1000) * fps);

const msToDurationFrames = (milliseconds: number, fps: number): number =>
  Math.max(1, msToFrameOffset(milliseconds, fps));

const compileIssue = (code: string, path: string, message: string): Issue => ({
  code,
  severity: "error",
  responsible: "agent",
  artifact: "scenes.json",
  path,
  message,
  suggestion: "Keep the beat inside its owning scene and compile again.",
});

const compiledAssets = (source: PlanSource): Record<string, CompiledAsset> =>
  Object.fromEntries(
    source.assets.assets.map((asset) => [
      asset.id,
      asset.status === "ready"
        ? {
            kind: "png" as const,
            publicPath: asset.path,
            sha256: asset.sha256,
          }
        : {
            kind: "placeholder" as const,
            assetId: asset.id,
            label: asset.purpose,
          },
    ]),
  );

export const compileDraft = (source: PlanSource): Result<CompiledDraft> => {
  const fps = source.project.format.draft.fps;
  let cursor = 0;
  const issues: Issue[] = [];

  const scenes = source.scenes.scenes.map((scene, sceneIndex) => {
    const durationInFrames = msToDurationFrames(scene.durationMs, fps);
    const startFrame = cursor;
    const endFrame = startFrame + durationInFrames;
    cursor = endFrame;

    const beats = scene.beats.map((beat, beatIndex) => {
      const beatStartFrame = msToFrameOffset(beat.startMs, fps);
      const beatDurationInFrames = msToDurationFrames(beat.durationMs, fps);
      if (beatStartFrame + beatDurationInFrames > durationInFrames) {
        issues.push(
          compileIssue(
            "BEAT_OUTSIDE_SCENE",
            `/scenes/${sceneIndex}/beats/${beatIndex}`,
            `Beat ${beat.id} ends after scene ${scene.id}.`,
          ),
        );
      }

      return {
        id: beat.id,
        targetId: beat.targetId,
        action: beat.action,
        startFrame: beatStartFrame,
        durationInFrames: beatDurationInFrames,
      };
    });

    return {
      id: scene.id,
      startFrame,
      endFrame,
      visual:
        scene.visual.type === "composition"
          ? { type: "composition" as const }
          : scene.visual,
      layers: scene.visual.type === "composition" ? scene.visual.layers : [],
      beats,
    };
  });

  if (issues.length > 0) {
    return { ok: false, issues };
  }

  const sourceRevision = hashValue(source);
  const draftCandidate = {
    schemaVersion: 1 as const,
    mode: "draft" as const,
    width: source.project.format.draft.width,
    height: source.project.format.draft.height,
    fps,
    totalFrames: cursor,
    timelineScope: "project" as const,
    label: "DRAFT • NO AUDIO" as const,
    sourceRevision,
    assemblyKey: hashValue({ sourceRevision, renderer: "m0.2" }),
    profile: {
      id: source.profile.id,
      version: source.profile.version,
      render: source.profile.render,
    },
    assets: compiledAssets(source),
    scenes,
  };
  const parsed = CompiledDraftSchema.safeParse(draftCandidate);

  if (!parsed.success) {
    return {
      ok: false,
      issues: parsed.error.issues.map((issue) =>
        compileIssue(
          "COMPILED_DRAFT_INVALID",
          `/${issue.path.join("/")}`,
          issue.message,
        ),
      ),
    };
  }

  return { ok: true, value: parsed.data, issues: [] };
};
