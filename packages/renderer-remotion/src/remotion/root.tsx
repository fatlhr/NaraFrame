import type { CompiledDraft } from "@naraframe/core";
import { Composition } from "remotion";
import { DraftVideo } from "./draft-video.js";
import {
  resolveVisualPreflight,
  visualPreflightProperty,
} from "./visual-preflight.js";

const placeholderHash = "0".repeat(64);

const fallbackDraft: CompiledDraft = {
  schemaVersion: 1,
  mode: "draft",
  width: 540,
  height: 960,
  fps: 30,
  totalFrames: 30,
  scope: { type: "project" },
  timelineScope: "project",
  label: "DRAFT • NO AUDIO",
  sourceRevision: placeholderHash,
  assemblyKey: placeholderHash,
  profile: {
    id: "fallback",
    version: "0.0.0",
    render: {
      palette: {
        background: "#11130F",
        surface: "#E8E0D2",
        text: "#F5F1E8",
        accent: "#FF5A36",
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
  },
  assets: {},
  scenes: [
    {
      id: "fallback",
      startFrame: 0,
      endFrame: 30,
      visual: { type: "text", text: "NaraFrame" },
      layers: [],
      beats: [],
    },
  ],
};

export const RemotionRoot = () => (
  <Composition
    id="NaraFrameDraft"
    component={DraftVideo}
    durationInFrames={fallbackDraft.totalFrames}
    fps={fallbackDraft.fps}
    width={fallbackDraft.width}
    height={fallbackDraft.height}
    defaultProps={fallbackDraft}
    calculateMetadata={async ({ props }) => {
      await document.fonts.ready;
      const preflight = resolveVisualPreflight(props);
      return {
        durationInFrames: props.totalFrames,
        fps: props.fps,
        width: props.width,
        height: props.height,
        props: {
          ...preflight.draft,
          [visualPreflightProperty]: preflight.report,
        },
      };
    }}
  />
);
