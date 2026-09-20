import type { Issue } from "../model/issue.js";
import type { RenderTokens } from "../schema/profile.js";
import type { Layer, Scene } from "../schema/scene.js";

/**
 * Repetition checks over compiled data only — no browser, no render, no text
 * measurement. They run during `validate`, so sameness is reported in
 * milliseconds instead of after a full render or a human review.
 */

const VARIETY_DEFAULTS = {
  maxConsecutiveSameEntry: 2,
  maxScenesWithoutViewpointChange: 2,
  requireMultipleTransitionTypes: true,
  requireMultipleTypeRoles: true,
  severity: "warning",
} as const;

/** Below these sizes a project is too small for repetition to mean anything. */
const MINIMUM_SCENES_FOR_TRANSITION_CHECK = 3;
const MINIMUM_TEXT_LAYERS_FOR_ROLE_CHECK = 4;

export interface VarietyScene {
  scene: Scene;
  sceneIndex: number;
  /** Layers after appearance resolution, so type sizes are the rendered ones. */
  resolvedLayers: Layer[];
}

const varietyIssue = (
  code: string,
  path: string,
  message: string,
  suggestion: string,
  severity: Issue["severity"],
): Issue => ({
  code,
  severity,
  responsible: "agent",
  artifact: "scenes.json",
  path,
  message,
  suggestion,
});

/**
 * How a scene starts, as one comparable token. The earliest beat wins because
 * that is what the viewer reads as the scene's entrance; a scene with no beats
 * enters statically, which counts as its own repeatable signature.
 */
const entrySignature = (scene: Scene): string => {
  const earliest = scene.beats.reduce<Scene["beats"][number] | undefined>(
    (best, beat) => (!best || beat.startMs < best.startMs ? beat : best),
    undefined,
  );
  if (!earliest) return "static";
  if (earliest.action === "reveal")
    return `reveal:${earliest.params.direction}`;
  if (earliest.action === "focus") return `focus:${earliest.params.camera}`;
  return earliest.action;
};

const hasViewpointChange = (scene: Scene): boolean =>
  scene.beats.some((beat) => beat.action === "focus");

/** Collects maximal runs of consecutive scenes sharing a key. */
const runsOf = <T>(
  items: T[],
  keyOf: (item: T) => string,
): Array<{ key: string; start: number; members: T[] }> => {
  const runs: Array<{ key: string; start: number; members: T[] }> = [];
  items.forEach((item, index) => {
    const key = keyOf(item);
    const current = runs.at(-1);
    if (current && current.key === key) {
      current.members.push(item);
      return;
    }
    runs.push({ key, start: index, members: [item] });
  });
  return runs;
};

const textLayersOf = (
  entry: VarietyScene,
): Array<Extract<Layer, { type: "text" }>> =>
  entry.resolvedLayers.filter(
    (layer): layer is Extract<Layer, { type: "text" }> => layer.type === "text",
  );

/**
 * Reports sameness across a whole project. Scene-scoped compiles are excluded
 * by the caller: one scene cannot repeat itself against its neighbours.
 */
export const checkVariety = (
  entries: VarietyScene[],
  render: RenderTokens,
): Issue[] => {
  const configured = render.variety;
  const policy = {
    maxConsecutiveSameEntry:
      configured?.maxConsecutiveSameEntry ??
      VARIETY_DEFAULTS.maxConsecutiveSameEntry,
    maxScenesWithoutViewpointChange:
      configured?.maxScenesWithoutViewpointChange ??
      VARIETY_DEFAULTS.maxScenesWithoutViewpointChange,
    requireMultipleTransitionTypes:
      configured?.requireMultipleTransitionTypes ??
      VARIETY_DEFAULTS.requireMultipleTransitionTypes,
    requireMultipleTypeRoles:
      configured?.requireMultipleTypeRoles ??
      VARIETY_DEFAULTS.requireMultipleTypeRoles,
  };
  const severity: Issue["severity"] =
    configured?.severity ?? VARIETY_DEFAULTS.severity;
  const issues: Issue[] = [];

  runsOf(entries, (entry) => entrySignature(entry.scene))
    .filter((run) => run.members.length > policy.maxConsecutiveSameEntry)
    .forEach((run) => {
      const names = run.members.map((entry) => entry.scene.id).join(", ");
      issues.push(
        varietyIssue(
          "MOTION_REPETITION",
          `/scenes/${run.start}`,
          `${run.members.length} consecutive scenes (${names}) all enter with "${run.key}".`,
          "Vary the entry action, direction, or timing so consecutive scenes do not read as one repeated slide.",
          severity,
        ),
      );
    });

  runsOf(entries, (entry) =>
    hasViewpointChange(entry.scene) ? "moving" : "fixed",
  )
    .filter(
      (run) =>
        run.key === "fixed" &&
        run.members.length > policy.maxScenesWithoutViewpointChange,
    )
    .forEach((run) => {
      const names = run.members.map((entry) => entry.scene.id).join(", ");
      issues.push(
        varietyIssue(
          "VIEWPOINT_STATIC",
          `/scenes/${run.start}`,
          `${run.members.length} consecutive scenes (${names}) hold a fixed viewpoint with no focus beat.`,
          "Give at least one of these scenes a focus beat so the camera changes what it looks at.",
          severity,
        ),
      );
    });

  if (
    policy.requireMultipleTransitionTypes &&
    entries.length >= MINIMUM_SCENES_FOR_TRANSITION_CHECK
  ) {
    const types = new Set(entries.map((entry) => entry.scene.transition.type));
    const only = [...types][0];
    if (types.size === 1 && only) {
      issues.push(
        varietyIssue(
          "SINGLE_TRANSITION_TYPE",
          "/scenes",
          `All ${entries.length} scenes use the same "${only}" transition.`,
          "Use more than one transition type, including one with real depth, so scene changes do not read as slide advances.",
          severity,
        ),
      );
    }
  }

  if (policy.requireMultipleTypeRoles) {
    const sizes = entries
      .flatMap(textLayersOf)
      .map((layer) => Math.round(layer.fontSize ?? 0));
    const distinct = new Set(sizes);
    if (
      sizes.length >= MINIMUM_TEXT_LAYERS_FOR_ROLE_CHECK &&
      distinct.size === 1
    ) {
      issues.push(
        varietyIssue(
          "TYPOGRAPHY_FLAT",
          "/scenes",
          `All ${sizes.length} text layers resolve to one size (${[...distinct][0]}px), so the project has no type hierarchy.`,
          "Assign distinct typography roles so headings, body, and labels resolve to different sizes.",
          severity,
        ),
      );
    }
  }

  const menu = configured?.menu;
  if (menu) {
    entries.forEach(({ scene, sceneIndex }) => {
      const earliest = scene.beats.reduce<Scene["beats"][number] | undefined>(
        (best, beat) => (!best || beat.startMs < best.startMs ? beat : best),
        undefined,
      );
      if (
        earliest?.action === "reveal" &&
        menu.entryDirections &&
        !menu.entryDirections.includes(earliest.params.direction)
      ) {
        issues.push(
          varietyIssue(
            "ENTRY_STYLE_NOT_PERMITTED",
            `/scenes/${sceneIndex}/beats`,
            `Scene ${scene.id} enters with direction "${earliest.params.direction}", which is outside the profile's permitted entry directions (${menu.entryDirections.join(", ")}).`,
            "Use one of the profile's permitted entry directions, or extend the profile menu.",
            severity,
          ),
        );
      }

      if (
        menu.transitionTypes &&
        !menu.transitionTypes.includes(scene.transition.type)
      ) {
        issues.push(
          varietyIssue(
            "TRANSITION_NOT_PERMITTED",
            `/scenes/${sceneIndex}/transition`,
            `Scene ${scene.id} uses transition "${scene.transition.type}", which is outside the profile's permitted transitions (${menu.transitionTypes.join(", ")}).`,
            "Use one of the profile's permitted transitions, or extend the profile menu.",
            severity,
          ),
        );
      }

      scene.beats.forEach((beat) => {
        if (
          beat.action === "focus" &&
          menu.focusCameras &&
          !menu.focusCameras.includes(beat.params.camera)
        ) {
          issues.push(
            varietyIssue(
              "FOCUS_STYLE_NOT_PERMITTED",
              `/scenes/${sceneIndex}/beats`,
              `Scene ${scene.id}'s focus beat "${beat.id}" uses camera "${beat.params.camera}", which is outside the profile's permitted focus treatments (${menu.focusCameras.join(", ")}).`,
              "Use one of the profile's permitted focus treatments, or extend the profile menu.",
              severity,
            ),
          );
        }
      });
    });
  }

  return issues;
};
