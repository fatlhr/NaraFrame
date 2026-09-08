import type { CompiledDraft, Layer } from "@naraframe/core";
import type { CSSProperties, ReactNode } from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
} from "remotion";

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

const motionFor = (
  draft: CompiledDraft,
  scene: CompiledDraft["scenes"][number],
  targetId: string,
  localFrame: number,
): CSSProperties => {
  const transforms: string[] = [];
  let opacity = 1;

  for (const beat of scene.beats.filter((item) => item.targetId === targetId)) {
    const progress = interpolate(
      localFrame,
      [beat.startFrame, beat.startFrame + beat.durationInFrames],
      [0, 1],
      { ...clamp, easing: Easing.out(Easing.cubic) },
    );

    if (beat.action === "reveal") {
      opacity *= progress;
      transforms.push(`translateY(${(1 - progress) * 28}px)`);
    }

    if (beat.action === "emphasize") {
      const pulse = Math.sin(progress * Math.PI);
      transforms.push(
        `scale(${1 + pulse * (draft.profile.render.motion.emphasizeScale - 1)})`,
      );
    }

    if (beat.action === "focus") {
      transforms.push(
        `scale(${1 + progress * (draft.profile.render.motion.focusScale - 1)})`,
      );
    }
  }

  return {
    opacity,
    transform: transforms.length > 0 ? transforms.join(" ") : undefined,
  };
};

const Placeholder = ({ label }: { label: string }) => (
  <div
    style={{
      width: "100%",
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      border: "3px dashed #FF5A36",
      borderRadius: 18,
      color: "#11130F",
      background:
        "repeating-linear-gradient(-45deg, #E8E0D2, #E8E0D2 14px, #DDD2C0 14px, #DDD2C0 28px)",
      fontSize: 20,
      fontWeight: 700,
      textAlign: "center",
      padding: 20,
      boxSizing: "border-box",
      textTransform: "uppercase",
      letterSpacing: 1,
    }}
  >
    Planned asset
    <br />
    {label}
  </div>
);

const LayerView = ({
  draft,
  layer,
}: {
  draft: CompiledDraft;
  layer: Layer;
}) => {
  const baseStyle: CSSProperties = {
    position: "absolute",
    left: "frame" in layer ? layer.frame.x : 0,
    top: "frame" in layer ? layer.frame.y : 0,
    width: "frame" in layer ? layer.frame.width : undefined,
    height: "frame" in layer ? layer.frame.height : undefined,
    opacity: "opacity" in layer ? layer.opacity : layer.transform.opacity,
    transform: `rotate(${"rotationDeg" in layer ? layer.rotationDeg : layer.transform.rotationDeg}deg)`,
    zIndex: layer.zIndex,
  };

  if (layer.type === "text") {
    return (
      <div
        style={{
          ...baseStyle,
          whiteSpace: "pre-line",
          color: draft.profile.render.palette.text,
          fontSize: 34,
          fontWeight: draft.profile.render.typography.headingWeight,
          lineHeight: 1.15,
          display: "flex",
          alignItems: "center",
        }}
      >
        {layer.text}
      </div>
    );
  }

  if (layer.type === "shape") {
    return (
      <div
        style={{
          ...baseStyle,
          backgroundColor: layer.fill,
          borderRadius: layer.shape === "circle" ? "50%" : 22,
        }}
      />
    );
  }

  if (layer.type === "image") {
    const asset = draft.assets[layer.assetId];
    return (
      <div style={baseStyle}>
        {asset?.kind === "png" ? (
          <Img
            src={staticFile(asset.publicPath)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: layer.fit,
            }}
          />
        ) : (
          <Placeholder label={asset?.label ?? layer.assetId} />
        )}
      </div>
    );
  }

  return null;
};

const AnimatedTarget = ({
  children,
  draft,
  scene,
  targetId,
}: {
  children: ReactNode;
  draft: CompiledDraft;
  scene: CompiledDraft["scenes"][number];
  targetId: string;
}) => {
  const localFrame = useCurrentFrame();
  return (
    <div style={motionFor(draft, scene, targetId, localFrame)}>{children}</div>
  );
};

const SceneView = ({
  draft,
  scene,
}: {
  draft: CompiledDraft;
  scene: CompiledDraft["scenes"][number];
}) => {
  const safeZone = draft.profile.render.safeZone;

  if (scene.visual.type === "text") {
    return (
      <AbsoluteFill
        style={{
          justifyContent: "center",
          padding: `${safeZone.top}px ${safeZone.right}px ${safeZone.bottom}px ${safeZone.left}px`,
          boxSizing: "border-box",
        }}
      >
        <AnimatedTarget draft={draft} scene={scene} targetId={scene.id}>
          <div
            style={{
              color: draft.profile.render.palette.text,
              fontSize: 64,
              fontWeight: draft.profile.render.typography.headingWeight,
              letterSpacing: -2.5,
              lineHeight: 1.02,
              whiteSpace: "pre-line",
            }}
          >
            {scene.visual.text}
          </div>
          <div
            style={{
              marginTop: 30,
              width: 100,
              height: 10,
              backgroundColor: draft.profile.render.palette.accent,
            }}
          />
        </AnimatedTarget>
      </AbsoluteFill>
    );
  }

  if (scene.visual.type === "media") {
    const asset = draft.assets[scene.visual.assetId];
    return (
      <AbsoluteFill style={{ padding: 44, boxSizing: "border-box" }}>
        <AnimatedTarget draft={draft} scene={scene} targetId={scene.id}>
          <Placeholder
            label={
              asset?.kind === "placeholder" ? asset.label : scene.visual.assetId
            }
          />
        </AnimatedTarget>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill>
      {scene.layers.map((layer) => (
        <AnimatedTarget
          draft={draft}
          key={layer.id}
          scene={scene}
          targetId={layer.id}
        >
          <LayerView draft={draft} layer={layer} />
        </AnimatedTarget>
      ))}
    </AbsoluteFill>
  );
};

export const DraftVideo = (draft: CompiledDraft) => (
  <AbsoluteFill
    style={{
      backgroundColor: draft.profile.render.palette.background,
      fontFamily: draft.profile.render.typography.fontFamily,
      overflow: "hidden",
    }}
  >
    {draft.scenes.map((scene) => (
      <Sequence
        durationInFrames={scene.endFrame - scene.startFrame}
        from={scene.startFrame}
        key={scene.id}
        name={scene.id}
      >
        <SceneView draft={draft} scene={scene} />
      </Sequence>
    ))}
    <div
      style={{
        position: "absolute",
        left: 44,
        right: 44,
        bottom: 34,
        color: draft.profile.render.palette.accent,
        fontSize: 18,
        fontWeight: 800,
        letterSpacing: 2,
        textAlign: "center",
      }}
    >
      {draft.label}
    </div>
  </AbsoluteFill>
);
