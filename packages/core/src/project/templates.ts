import type { Scenes } from "../schema/scene.js";

/** The built-in starting points `create --template` accepts. */
export const PROJECT_TEMPLATE_NAMES = ["starter"] as const;
export type ProjectTemplateName = (typeof PROJECT_TEMPLATE_NAMES)[number];

export const isProjectTemplateName = (
  value: string,
): value is ProjectTemplateName =>
  (PROJECT_TEMPLATE_NAMES as readonly string[]).includes(value);

const still = { opacity: 1, rotationDeg: 0 } as const;
const smooth = { distance: 24, easingPreset: "smooth" } as const;

/**
 * A runnable three-scene short that makes no factual claim: hook,
 * explanation, payoff, 25.5 s in total. It sits inside both built-in
 * profiles' preferred length, paints with palette tokens only (so any
 * profile's look applies), and has no recipes, assets or narration. The
 * text is placeholder copy to replace; the notes say what each part is for.
 */
const starterScenes: Scenes = {
  schemaVersion: 1,
  scenes: [
    {
      id: "hook",
      narrativeRole: "hook",
      durationMs: 6000,
      visual: {
        type: "composition",
        layers: [
          {
            id: "hook-rule",
            type: "shape",
            shape: "rectangle",
            fill: "palette.accent",
            frame: { x: 88, y: 400, width: 160, height: 14 },
            zIndex: 1,
            ...still,
          },
          {
            id: "hook-headline",
            type: "text",
            text: "Ask your big question here",
            frame: { x: 88, y: 450, width: 904, height: 560 },
            role: "display",
            maxLines: 4,
            overflowPolicy: "error",
            zIndex: 2,
            ...still,
          },
          {
            id: "hook-subtitle",
            type: "text",
            text: "One short line that sets up the answer.",
            frame: { x: 88, y: 1040, width: 904, height: 220 },
            role: "body",
            maxLines: 3,
            overflowPolicy: "error",
            zIndex: 2,
            ...still,
          },
        ],
      },
      beats: [
        {
          id: "show-rule",
          targetId: "hook-rule",
          action: "reveal",
          startMs: 200,
          durationMs: 500,
          params: { direction: "up", ...smooth },
        },
        {
          id: "show-headline",
          targetId: "hook-headline",
          action: "reveal",
          startMs: 500,
          durationMs: 600,
          params: { direction: "up", ...smooth },
        },
        {
          id: "show-subtitle",
          targetId: "hook-subtitle",
          action: "reveal",
          startMs: 1500,
          durationMs: 600,
          params: { direction: "up", ...smooth },
        },
      ],
      transition: { type: "push-through", durationMs: 600, direction: "up" },
      note: "Hook: the viewer should know in two seconds what this video is about. Replace the headline with the one question or promise of the video, and the subtitle with a single line that sets up the answer. Keep the headline to a few words; the display size is large. Pace: rule, headline, subtitle, then a hold so it can be read. Hands over to the explanation with an upward push. These texts claim nothing; if you replace them with a fact, set carriesFactualClaim to true and cite a source.",
    },
    {
      id: "explanation",
      narrativeRole: "explanation",
      durationMs: 12500,
      visual: {
        type: "composition",
        layers: [
          {
            id: "explanation-heading",
            type: "text",
            text: "Explain it in three short steps",
            frame: { x: 88, y: 300, width: 904, height: 260 },
            role: "heading",
            maxLines: 3,
            overflowPolicy: "error",
            zIndex: 2,
            ...still,
          },
          {
            id: "explanation-bar",
            type: "shape",
            shape: "rectangle",
            fill: "palette.accent",
            frame: { x: 88, y: 640, width: 12, height: 760 },
            zIndex: 1,
            ...still,
          },
          {
            id: "explanation-step-1",
            type: "text",
            text: "1. Name the first idea in one sentence.",
            frame: { x: 148, y: 640, width: 844, height: 220 },
            role: "body",
            maxLines: 3,
            overflowPolicy: "error",
            zIndex: 2,
            ...still,
          },
          {
            id: "explanation-step-2",
            type: "text",
            text: "2. Add the next idea that builds on it.",
            frame: { x: 148, y: 920, width: 844, height: 220 },
            role: "body",
            maxLines: 3,
            overflowPolicy: "error",
            zIndex: 2,
            ...still,
          },
          {
            id: "explanation-step-3",
            type: "text",
            text: "3. Finish with the idea that ties them together.",
            frame: { x: 148, y: 1200, width: 844, height: 220 },
            role: "body",
            maxLines: 3,
            overflowPolicy: "error",
            zIndex: 2,
            ...still,
          },
        ],
      },
      beats: [
        {
          id: "show-heading",
          targetId: "explanation-heading",
          action: "reveal",
          startMs: 300,
          durationMs: 600,
          params: { direction: "left", ...smooth },
        },
        {
          id: "show-bar",
          targetId: "explanation-bar",
          action: "reveal",
          startMs: 1200,
          durationMs: 500,
          params: { direction: "down", ...smooth },
        },
        {
          id: "show-step-1",
          targetId: "explanation-step-1",
          action: "reveal",
          startMs: 2400,
          durationMs: 600,
          params: { direction: "up", ...smooth },
        },
        {
          id: "show-step-2",
          targetId: "explanation-step-2",
          action: "reveal",
          startMs: 5200,
          durationMs: 600,
          params: { direction: "up", ...smooth },
        },
        {
          id: "show-step-3",
          targetId: "explanation-step-3",
          action: "reveal",
          startMs: 8000,
          durationMs: 600,
          params: { direction: "up", ...smooth },
        },
      ],
      transition: { type: "cut" },
      note: "Explanation: the middle is where the video teaches. Replace the heading with what the steps answer, and each step with one idea in one sentence; add or remove a step by copying a text layer and its reveal beat. One idea appears at a time, about three seconds apart, so the viewer can read it before the next arrives; stretch the gaps if you add words. Pace: heading, accent bar, then step 1, 2 and 3, and a final hold. Same rule as the hook: these texts claim nothing; label and source a step the moment it states a fact.",
    },
    {
      id: "payoff",
      narrativeRole: "payoff",
      durationMs: 7000,
      visual: {
        type: "composition",
        layers: [
          {
            id: "payoff-rule",
            type: "shape",
            shape: "rectangle",
            fill: "palette.accent",
            frame: { x: 88, y: 400, width: 160, height: 14 },
            zIndex: 1,
            ...still,
          },
          {
            id: "payoff-takeaway",
            type: "text",
            text: "Say what to remember",
            frame: { x: 88, y: 450, width: 904, height: 560 },
            role: "display",
            maxLines: 4,
            overflowPolicy: "error",
            zIndex: 2,
            ...still,
          },
          {
            id: "payoff-closing",
            type: "text",
            text: "Then say what to do next.",
            frame: { x: 88, y: 1040, width: 904, height: 220 },
            role: "body",
            maxLines: 3,
            overflowPolicy: "error",
            zIndex: 2,
            ...still,
          },
        ],
      },
      beats: [
        {
          id: "show-rule",
          targetId: "payoff-rule",
          action: "reveal",
          startMs: 200,
          durationMs: 500,
          params: { direction: "up", ...smooth },
        },
        {
          id: "show-takeaway",
          targetId: "payoff-takeaway",
          action: "reveal",
          startMs: 500,
          durationMs: 600,
          params: { direction: "up", ...smooth },
        },
        {
          id: "show-closing",
          targetId: "payoff-closing",
          action: "reveal",
          startMs: 1800,
          durationMs: 600,
          params: { direction: "up", ...smooth },
        },
        {
          id: "push-in",
          targetId: "payoff",
          action: "focus",
          startMs: 3000,
          durationMs: 3000,
          params: { camera: "push", intensity: 0.3, easingPreset: "smooth" },
        },
      ],
      transition: { type: "cut" },
      note: "Payoff: land the video. Replace the takeaway with the single thing the viewer should remember, and the closing line with what to do next (follow, read, try it). It mirrors the hook on purpose so the video feels finished. The last scene's transition stays a cut because nothing follows it. Pace: rule, takeaway, closing, then a hold. Claims: a takeaway that states a fact needs carriesFactualClaim true and a source.",
    },
  ],
};

/** A fresh copy each call, so a caller can never alter the built-in. */
export const projectTemplateScenes = (name: ProjectTemplateName): Scenes => {
  switch (name) {
    case "starter":
      return structuredClone(starterScenes);
  }
};
