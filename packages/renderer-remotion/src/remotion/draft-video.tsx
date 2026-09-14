import type { CompiledDraft, Layer } from "@naraframe/core";
import type { CSSProperties, ReactNode } from "react";
import {
  AbsoluteFill,
  Img,
  Sequence,
  staticFile,
  useCurrentFrame,
} from "remotion";
import {
  groupScreenTransformFor,
  motionStateFor,
  motionStyleFor,
  sceneTransitionStateFor,
} from "./motion.js";
import { fontFamilyForRole } from "./typography.js";

const rgba = (hex: string, opacity: number): string => {
  const channels = [1, 3, 5].map((start) =>
    Number.parseInt(hex.slice(start, start + 2), 16),
  );
  return `rgba(${channels[0]}, ${channels[1]}, ${channels[2]}, ${opacity})`;
};

const shadowFor = (
  shadow: Extract<Layer, { type: "image" | "shape" }>["shadow"],
): string | undefined =>
  shadow
    ? `${shadow.offsetX}px ${shadow.offsetY}px ${shadow.blur}px ${rgba(shadow.color, shadow.opacity)}`
    : undefined;

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
  focalPoint = { x: 0.5, y: 0.5 },
}: {
  draft: CompiledDraft;
  assetId: string;
  fit: "cover" | "contain";
  focalPoint?: { x: number; y: number };
}) => {
  const asset = draft.assets[assetId];
  return asset?.kind === "png" ? (
    <Img
      src={staticFile(asset.publicPath)}
      style={{
        width: "100%",
        height: "100%",
        objectFit: fit,
        objectPosition: `${focalPoint.x * 100}% ${focalPoint.y * 100}%`,
      }}
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
  const motion = motionStateFor(draft, scene, layer.id, localFrame);
  const baseStyle: CSSProperties = {
    position: "absolute",
    left: layer.frame.x,
    top: layer.frame.y,
    width: layer.frame.width,
    height: layer.frame.height,
    opacity: layer.opacity * motion.opacity,
    rotate: `${layer.rotationDeg}deg`,
    translate: `${motion.translateX}px ${motion.translateY}px`,
    scale: motion.scale,
    zIndex: layer.zIndex,
    transformOrigin: `${motion.anchor.x * 100}% ${motion.anchor.y * 100}%`,
    boxSizing: "border-box",
  };

  if (layer.type === "text") {
    const padding = layer.padding ?? { top: 0, right: 0, bottom: 0, left: 0 };
    const justifyContent = {
      top: "flex-start",
      center: "center",
      bottom: "flex-end",
    }[layer.verticalAlign ?? "center"];
    return (
      <div
        style={{
          ...baseStyle,
          whiteSpace: "pre-wrap",
          overflowWrap: "normal",
          color: layer.color ?? draft.profile.render.palette.text,
          fontFamily: fontFamilyForRole(draft.profile.render, layer.role),
          fontSize: layer.fontSize ?? 34,
          fontWeight:
            layer.fontWeight ?? draft.profile.render.typography.headingWeight,
          lineHeight: layer.lineHeight ?? 1.15,
          letterSpacing: layer.letterSpacing ?? 0,
          textAlign: layer.textAlign ?? "left",
          padding: `${padding.top}px ${padding.right}px ${padding.bottom}px ${padding.left}px`,
          display: "flex",
          flexDirection: "column",
          justifyContent,
          overflow: "hidden",
        }}
      >
        {layer.text}
      </div>
    );
  }

  if (layer.type === "shape") {
    const radius =
      layer.shape === "circle" ? "50%" : (layer.cornerRadius ?? 22);
    return (
      <div
        style={{
          ...baseStyle,
          backgroundColor: layer.fill,
          borderRadius: radius,
          border: layer.stroke
            ? `${layer.stroke.width}px solid ${layer.stroke.color}`
            : undefined,
          boxShadow: shadowFor(layer.shadow),
        }}
      />
    );
  }

  return (
    <div
      style={{
        ...baseStyle,
        overflow: "hidden",
        borderRadius: layer.cornerRadius ?? 0,
        border: layer.stroke
          ? `${layer.stroke.width}px solid ${layer.stroke.color}`
          : undefined,
        boxShadow: shadowFor(layer.shadow),
      }}
    >
      <AssetView
        draft={draft}
        assetId={layer.assetId}
        fit={layer.fit}
        {...(layer.focalPoint ? { focalPoint: layer.focalPoint } : {})}
      />
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
  const transform = groupScreenTransformFor(draft, scene, group, localFrame);
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
        opacity: transform.opacity,
        translate: `${transform.translateX}px ${transform.translateY}px`,
        scale: transform.scale,
        rotate: `${transform.rotationDeg}deg`,
        transformOrigin: `${transform.anchorX * 100}% ${transform.anchorY * 100}%`,
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
  const sceneMotion = motionStyleFor(draft, scene, scene.id, localFrame);

  if (scene.visual.type === "text") {
    const display = draft.profile.render.typography.roles?.display;
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
            fontFamily: fontFamilyForRole(draft.profile.render, "display"),
            fontSize: display?.fontSize ?? 64,
            fontWeight:
              display?.fontWeight ??
              draft.profile.render.typography.headingWeight,
            letterSpacing: display?.letterSpacing ?? -2.5,
            lineHeight: display?.lineHeight ?? 1.02,
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
    const media = draft.profile.render.appearance?.media;
    return (
      <AbsoluteFill
        style={{
          ...sceneMotion,
          padding: `${safeZone.top}px ${safeZone.right}px ${safeZone.bottom}px ${safeZone.left}px`,
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            overflow: "hidden",
            borderRadius: media?.cornerRadius ?? 0,
          }}
        >
          <AssetView
            draft={draft}
            assetId={scene.visual.assetId}
            fit={scene.visual.fit}
          />
        </div>
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

const TransitionFrame = ({
  draft,
  sceneIndex,
  children,
}: {
  draft: CompiledDraft;
  sceneIndex: number;
  children: ReactNode;
}) => {
  const localFrame = useCurrentFrame();
  const state = sceneTransitionStateFor(draft, sceneIndex, localFrame);
  return (
    <AbsoluteFill
      style={{
        opacity: state.opacity,
        translate: `${state.translateX}px ${state.translateY}px`,
        scale: state.scale,
        transformOrigin: `${state.anchor.x * 100}% ${state.anchor.y * 100}%`,
        ...(state.clipPath ? { clipPath: state.clipPath } : {}),
      }}
    >
      {children}
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
    {draft.scenes.map((scene, sceneIndex) => (
      <Sequence
        durationInFrames={scene.endFrame - scene.startFrame}
        from={scene.startFrame}
        key={scene.id}
        name={scene.id}
      >
        <TransitionFrame draft={draft} sceneIndex={sceneIndex}>
          <SceneView draft={draft} scene={scene} />
        </TransitionFrame>
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
