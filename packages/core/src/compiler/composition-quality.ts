import type { Issue } from "../model/issue.js";
import type { CompiledDraft } from "../schema/compiled.js";
import type {
  CompositionQualityStage,
  RenderTokens,
} from "../schema/profile.js";

type Policy = NonNullable<RenderTokens["compositionQuality"]>;
export type QualityRule = keyof Policy;
export const COMPOSITION_QUALITY_VERSION = 2;

export const qualitySeverity = (
  render: RenderTokens,
  stage: CompositionQualityStage,
  rule: QualityRule,
): "off" | "warning" | "error" => {
  const config = render.compositionQuality?.[rule];
  return config?.enabled ? config.stages[stage] : "off";
};

export const sourceFrameFor = (draft: CompiledDraft, frame: number) =>
  draft.scope.type === "project"
    ? frame
    : draft.scope.sourceStartFrame === null
      ? null
      : draft.scope.sourceStartFrame + frame;

export const transitionWindows = (draft: CompiledDraft, index: number) => {
  const scene = draft.scenes[index];
  if (!scene) return [];
  const windows: {
    mode: "entry" | "exit";
    startFrame: number;
    endFrame: number;
  }[] = [];
  const incoming = scene.transitionIn ?? draft.scenes[index - 1]?.transitionOut;
  if (incoming && incoming.type !== "cut") {
    windows.push({
      mode: "entry",
      startFrame: 0,
      endFrame: incoming.durationInFrames,
    });
  }
  if (
    scene.transitionOut.type !== "cut" &&
    (scene.hasNextScene || index < draft.scenes.length - 1)
  ) {
    const endFrame = scene.endFrame - scene.startFrame;
    windows.push({
      mode: "exit",
      startFrame: endFrame - scene.transitionOut.durationInFrames,
      endFrame,
    });
  }
  return windows;
};

export const compositionCheckpoints = (draft: CompiledDraft, index: number) => {
  const scene = draft.scenes[index];
  if (!scene) return [];
  const length = scene.endFrame - scene.startFrame;
  const windows = [
    ...scene.beats.map((beat) => ({
      startFrame: beat.startFrame,
      endFrame: beat.startFrame + beat.durationInFrames,
    })),
    ...(scene.camera?.moves ?? []).map((move) => ({
      startFrame: move.startFrame,
      endFrame: move.startFrame + move.durationInFrames,
    })),
    ...transitionWindows(draft, index),
  ].sort((a, b) => a.startFrame - b.startFrame || a.endFrame - b.endFrame);
  const settled = (start: number | undefined) => {
    if (start === undefined) return null;
    let frame = start;
    for (const window of windows) {
      if (window.startFrame > frame) break;
      frame = Math.max(frame, window.endFrame);
    }
    return frame < length ? scene.startFrame + frame : null;
  };
  const firstWindow = windows[0];
  const arrive = firstWindow
    ? [
        {
          frame:
            scene.startFrame +
            Math.min(
              length - 1,
              firstWindow.startFrame +
                Math.floor((firstWindow.endFrame - firstWindow.startFrame) / 2),
            ),
          reason: "composition-arriving",
          beatId: undefined,
        },
      ]
    : [];
  const checkpoints = scene.beats.length
    ? scene.beats.map((beat) => ({
        frame: settled(beat.startFrame + beat.durationInFrames),
        reason: `composition-settled:${beat.id}`,
        beatId: beat.id,
      }))
    : [
        {
          frame: settled(scene.compositionQuality?.settledFrame),
          reason: "composition-settled",
          beatId: undefined,
        },
      ];
  return [...arrive, ...checkpoints];
};

export const qualityIssue = (
  draft: CompiledDraft,
  rule: QualityRule,
  coverage: "checked" | "pending" | "exempt" | "unverified",
  message: string,
  suggestion: string,
  details: Record<string, unknown>,
  failed = false,
): Issue[] => {
  if (!draft.compositionQualityStage) return [];
  const severity = qualitySeverity(
    draft.profile.render,
    draft.compositionQualityStage,
    rule,
  );
  if (severity === "off") return [];
  const codes = {
    opening: "COMPOSITION_OPENING",
    inactivity: "COMPOSITION_INACTIVITY",
    camera: "VIEWPOINT_STATIC",
    cuts: "COMPOSITION_CUT_RUN",
    hero: "COMPOSITION_HERO",
  } satisfies Record<QualityRule, string>;
  return [
    {
      code: codes[rule],
      severity: failed || coverage === "unverified" ? severity : "info",
      artifact: "scenes.json",
      responsible: "agent",
      path: "/scenes",
      message,
      suggestion,
      details: { ...details, rule, coverage },
    },
  ];
};

export const checkCompositionPlan = (draft: CompiledDraft): Issue[] => {
  if (!draft.compositionQualityStage) return [];
  const issues: Issue[] = [];
  const config = draft.profile.render.compositionQuality;
  if (config?.cuts?.enabled) {
    if (draft.scope.type === "scene") {
      issues.push(
        ...qualityIssue(
          draft,
          "cuts",
          "pending",
          "Cut runs require the full timeline.",
          "Validate the full project.",
          {},
        ),
      );
    } else {
      const boundaries = draft.scenes.slice(0, -1);
      let start = 0;
      let longest = 0;
      let firstBoundary: string | undefined;
      let lastBoundary: string | undefined;
      boundaries.forEach((scene, index) => {
        if (scene.transitionOut.type !== "cut") {
          start = index + 1;
        } else if (index - start + 1 > longest) {
          longest = index - start + 1;
          firstBoundary = boundaries[start]?.id;
          lastBoundary = scene.id;
        }
      });
      issues.push(
        ...qualityIssue(
          draft,
          "cuts",
          "checked",
          `The longest cut run has ${longest} boundaries.`,
          "Review the named run and use a different transition where it serves the story.",
          {
            longest,
            firstBoundary,
            lastBoundary,
            threshold: config.cuts.maxConsecutive,
          },
          longest > config.cuts.maxConsecutive,
        ),
      );
    }
  }
  for (const rule of ["opening", "inactivity", "camera", "hero"] as const) {
    issues.push(
      ...qualityIssue(
        draft,
        rule,
        "pending",
        `The ${rule} check needs browser preflight.`,
        "Inspect the preview report for measured coverage.",
        {},
      ),
    );
  }
  return issues;
};
