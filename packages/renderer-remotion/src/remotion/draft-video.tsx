import type { CompiledDraft, Layer } from "@naraframe/core";
import type { CSSProperties } from "react";
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

const combineTransforms = (...transforms: Array<string | undefined>): string =>
  transforms.filter((transform) => transform).join(" ");

const easingFor = (
  preset: "linear" | "smooth" | "snappy" | undefined,
  action: "reveal" | "emphasize" | "focus",
) => {
  if (preset === "linear") return Easing.linear;
  if (preset === "smooth") return Easing.inOut(Easing.cubic);
  if (preset === "snappy") return Easing.out(Easing.cubic);
  return action === "focus"
    ? Easing.inOut(Easing.cubic)
    : Easing.out(Easing.cubic);
};

export const motionFor = (
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
      { ...clamp, easing: easingFor(beat.params.easingPreset, beat.action) },
    );

    if (beat.action === "reveal") {
      opacity *= progress;
      const offset = (1 - progress) * beat.params.distance;
      const translation = {
        up: `translateY(${offset}px)`,
        down: `translateY(${-offset}px)`,
        left: `translateX(${offset}px)`,
        right: `translateX(${-offset}px)`,
      }[beat.params.direction];
      transforms.push(translation);
    }

    if (beat.action === "emphasize") {
      const pulse = Math.sin(progress * Math.PI);
      transforms.push(`scale(${1 + pulse * (beat.params.scale - 1)})`);
    }

    if (beat.action === "focus") {
      const strength = progress * beat.params.intensity;
      const distance = draft.profile.render.spacingUnit * 12 * strength;
      const scale = 1 + strength * (draft.profile.render.motion.focusScale - 1);

      if (beat.params.camera === "pan") {
        transforms.push(`translateX(${-distance}px)`);
      } else if (beat.params.camera === "push") {
        transforms.push(`translateY(${-distance / 2}px) scale(${scale})`);
      } else {
        transforms.push(`scale(${scale})`);
      }
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

const AssetView = ({
  draft,
  assetId,
  fit,
}: {
  draft: CompiledDraft;
  assetId: string;
  fit: "cover" | "contain";
}) => {
  const asset = draft.assets[assetId];
  return asset?.kind === "png" ? (
    <Img
      src={staticFile(asset.publicPath)}
      style={{ width: "100%", height: "100%", objectFit: fit }}
    />
  ) : (
    <Placeholder label={asset?.label ?? assetId} />
  );
};

const LayerView = ({
  draft,
  layer,
  localFrame,
  scene,
}: {
  draft: CompiledDraft;
  layer: Exclude<Layer, { type: "group" }>;
  localFrame: number;
  scene: CompiledDraft["scenes"][number];
}) => {
  const motion = motionFor(draft, scene, layer.id, localFrame);
  const baseStyle: CSSProperties = {
    position: "absolute",
    left: layer.frame.x,
    top: layer.frame.y,
    width: layer.frame.width,
    height: layer.frame.height,
    opacity: layer.opacity * Number(motion.opacity ?? 1),
    transform: combineTransforms(
      `rotate(${layer.rotationDeg}deg)`,
      motion.transform,
    ),
    zIndex: layer.zIndex,
    transformOrigin: "center center",
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

  return (
    <div style={{ ...baseStyle, overflow: "hidden" }}>
      <AssetView draft={draft} assetId={layer.assetId} fit={layer.fit} />
    </div>
  );
};

const GroupView = ({
  draft,
  group,
  layersById,
  localFrame,
  scene,
}: {
  draft: CompiledDraft;
  group: Extract<Layer, { type: "group" }>;
  layersById: Map<string, Layer>;
  localFrame: number;
  scene: CompiledDraft["scenes"][number];
}) => {
  const motion = motionFor(draft, scene, group.id, localFrame);
  const members = group.memberIds.flatMap((memberId) => {
    const member = layersById.get(memberId);
    return member && member.type !== "group" ? [member] : [];
  });
  if (members.length === 0) {
    return null;
  }
  const left = Math.min(...members.map((member) => member.frame.x));
  const top = Math.min(...members.map((member) => member.frame.y));
  const right = Math.max(
    ...members.map((member) => member.frame.x + member.frame.width),
  );
  const bottom = Math.max(
    ...members.map((member) => member.frame.y + member.frame.height),
  );

  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width: right - left,
        height: bottom - top,
        opacity: group.transform.opacity * Number(motion.opacity ?? 1),
        transform: combineTransforms(
          `translate(${group.transform.x}px, ${group.transform.y}px) scale(${group.transform.scale}) rotate(${group.transform.rotationDeg}deg)`,
          motion.transform,
        ),
        transformOrigin: "center center",
        zIndex: group.zIndex,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: -left,
          top: -top,
          width: draft.width,
          height: draft.height,
        }}
      >
        {members.map((member) => (
          <LayerView
            draft={draft}
            key={member.id}
            layer={member}
            localFrame={localFrame}
            scene={scene}
          />
        ))}
      </div>
    </div>
  );
};

const SceneView = ({
  draft,
  scene,
}: {
  draft: CompiledDraft;
  scene: CompiledDraft["scenes"][number];
}) => {
  const localFrame = useCurrentFrame();
  const safeZone = draft.profile.render.safeZone;
  const sceneMotion = motionFor(draft, scene, scene.id, localFrame);

  if (scene.visual.type === "text") {
    return (
      <AbsoluteFill
        style={{
          ...sceneMotion,
          justifyContent: "center",
          padding: `${safeZone.top}px ${safeZone.right}px ${safeZone.bottom}px ${safeZone.left}px`,
          boxSizing: "border-box",
        }}
      >
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
      </AbsoluteFill>
    );
  }

  if (scene.visual.type === "media") {
    return (
      <AbsoluteFill
        style={{
          ...sceneMotion,
          padding: `${safeZone.top}px ${safeZone.right}px ${safeZone.bottom}px ${safeZone.left}px`,
          boxSizing: "border-box",
        }}
      >
        <AssetView
          draft={draft}
          assetId={scene.visual.assetId}
          fit={scene.visual.fit}
        />
      </AbsoluteFill>
    );
  }

  const layersById = new Map(scene.layers.map((layer) => [layer.id, layer]));
  const groups = scene.layers.filter(
    (layer): layer is Extract<Layer, { type: "group" }> =>
      layer.type === "group",
  );
  const groupedIds = new Set(groups.flatMap((group) => group.memberIds));
  const topLevelLayers = scene.layers.filter(
    (layer): layer is Exclude<Layer, { type: "group" }> =>
      layer.type !== "group" && !groupedIds.has(layer.id),
  );

  return (
    <AbsoluteFill style={sceneMotion}>
      {topLevelLayers.map((layer) => (
        <LayerView
          draft={draft}
          key={layer.id}
          layer={layer}
          localFrame={localFrame}
          scene={scene}
        />
      ))}
      {groups.map((group) => (
        <GroupView
          draft={draft}
          group={group}
          key={group.id}
          layersById={layersById}
          localFrame={localFrame}
          scene={scene}
        />
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
