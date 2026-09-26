import type { CompiledDraft, Layer } from "@naraframe/core";
import type { CSSProperties, ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  AbsoluteFill,
  Audio,
  cancelRender,
  continueRender,
  delayRender,
  Img,
  Sequence,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { CAPTION_LINE_HEIGHT, captionPadding } from "./captions.js";
import {
  groupScreenTransformFor,
  motionStateFor,
  motionStyleFor,
  planeTransformFor,
  sceneTransitionStateFor,
} from "./motion.js";
import { musicGainAt } from "./soundtrack-gain.js";
import {
  FONT_RENDER_FAILURE,
  fontFamilyForRole,
  loadBundledFonts,
} from "./typography.js";

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
  if (asset?.kind === "png") {
    return (
      <Img
        src={staticFile(asset.publicPath)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: fit,
          objectPosition: `${focalPoint.x * 100}% ${focalPoint.y * 100}%`,
        }}
      />
    );
  }
  if (asset?.kind === "svg") {
    // The markup was checked and id-namespaced by the loader, so it is
    // inlined rather than fetched: the illustration's parts stay addressable
    // and nothing re-parses unvalidated artwork at render time.
    const { minX, minY, width, height } = asset.viewBox;
    return (
      <svg
        viewBox={`${minX} ${minY} ${width} ${height}`}
        preserveAspectRatio={
          fit === "cover" ? "xMidYMid slice" : "xMidYMid meet"
        }
        style={{ width: "100%", height: "100%", display: "block" }}
        role="presentation"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: sanitised by the loader
        dangerouslySetInnerHTML={{ __html: asset.body }}
      />
    );
  }
  const label = asset?.kind === "placeholder" ? asset.label : assetId;
  return <Placeholder label={label} />;
};

/**
 * Paints a headline's runs. `emphasis` says what a run means; the profile
 * decides how it looks, so the same source reads correctly under another
 * visual identity.
 */
const spanStyleFor = (
  emphasis: "accent" | "strong" | "quiet" | undefined,
  render: CompiledDraft["profile"]["render"],
  baseWeight: number,
): CSSProperties => {
  if (emphasis === "accent") {
    return {
      color: render.palette.accent,
      fontWeight: Math.min(900, baseWeight + 100),
    };
  }
  if (emphasis === "strong") {
    return { fontWeight: Math.min(900, baseWeight + 200) };
  }
  if (emphasis === "quiet") return { opacity: 0.62 };
  return {};
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
    translate: `${motion.translateX}px ${motion.translateY}px`,
    scale: motion.scale,
    rotate: `${layer.rotationDeg + motion.rotationDeg}deg`,
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
        {layer.spans
          ? layer.spans.map((span, index) => (
              <span
                // biome-ignore lint/suspicious/noArrayIndexKey: runs are positional
                key={`${layer.id}-span-${index}`}
                style={spanStyleFor(
                  span.emphasis,
                  draft.profile.render,
                  layer.fontWeight ??
                    draft.profile.render.typography.headingWeight,
                )}
              >
                {span.text}
              </span>
            ))
          : layer.text}
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

const PlaneView = ({
  draft,
  scene,
  localFrame,
  space,
  parallax,
  zIndex,
  children,
}: {
  draft: CompiledDraft;
  scene: CompiledDraft["scenes"][number];
  localFrame: number;
  space: "world" | "overlay" | undefined;
  parallax: number | undefined;
  zIndex: number;
  children: ReactNode;
}) => {
  const transform = planeTransformFor(
    draft,
    scene,
    space,
    parallax,
    localFrame,
  );
  return (
    <AbsoluteFill
      style={{
        translate: `${transform.translateX}px ${transform.translateY}px`,
        zIndex,
        scale: transform.scale,
        transformOrigin: `${transform.originX}px ${transform.originY}px`,
      }}
    >
      {children}
    </AbsoluteFill>
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
        <PlaneView
          draft={draft}
          key={layer.id}
          scene={scene}
          localFrame={localFrame}
          space={layer.space}
          parallax={layer.parallax}
          zIndex={layer.zIndex}
        >
          <LayerView
            draft={draft}
            layer={layer}
            localFrame={localFrame}
            scene={scene}
          />
        </PlaneView>
      ))}
      {groups.map((group) => (
        <PlaneView
          draft={draft}
          key={group.id}
          scene={scene}
          localFrame={localFrame}
          space={group.space}
          parallax={group.parallax}
          zIndex={group.zIndex}
        >
          <GroupView
            draft={draft}
            group={group}
            layersById={layersById}
            localFrame={localFrame}
            scene={scene}
          />
        </PlaneView>
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

/** A palette hex at a given opacity, for scrims drawn over the scene. */
const withAlpha = (hexColor: string, alpha: number): string => {
  const red = Number.parseInt(hexColor.slice(1, 3), 16);
  const green = Number.parseInt(hexColor.slice(3, 5), 16);
  const blue = Number.parseInt(hexColor.slice(5, 7), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
};

const SoundtrackLayer = ({ draft }: { draft: CompiledDraft }) => {
  const soundtrack = draft.soundtrack;
  if (!soundtrack) return null;
  const source = (assetId: string): string | null => {
    const asset = draft.assets[assetId];
    return !asset || asset.kind === "png" || asset.kind === "placeholder"
      ? null
      : staticFile(asset.publicPath);
  };
  const music = soundtrack.music;
  const musicSource = music ? source(music.assetId) : null;
  return (
    <>
      {music && musicSource ? (
        <Audio
          src={musicSource}
          startFrom={music.trimStartFrames}
          loop={music.loop}
          volume={(frame) => musicGainAt(music, frame, draft.totalFrames)}
        />
      ) : null}
      {soundtrack.sfx.map((effect) => {
        const src = source(effect.assetId);
        if (!src) return null;
        return (
          <Sequence
            key={effect.id}
            from={effect.startFrame}
            name={`sfx-${effect.id}`}
          >
            <Audio src={src} volume={effect.volume} />
          </Sequence>
        );
      })}
    </>
  );
};

const CaptionLayer = ({ draft }: { draft: CompiledDraft }) => {
  const captions = draft.captions;
  if (!captions) return null;
  const { style } = captions;
  const render = draft.profile.render;
  const padding = captionPadding(style.fontSize);
  return (
    <>
      {captions.cues.map((cue) => (
        <Sequence
          durationInFrames={cue.endFrame - cue.startFrame}
          from={cue.startFrame}
          key={cue.id}
          name={`caption-${cue.id}`}
        >
          <div
            style={{
              position: "absolute",
              left: style.side,
              right: style.side,
              bottom: style.bottom,
              display: "flex",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                padding: `${padding.y}px ${padding.x}px`,
                borderRadius: Math.round(style.fontSize * 0.35),
                // The scrim is the project's own background, so a light
                // profile gets a light caption with its dark type instead of
                // dark type on a black box.
                backgroundColor: withAlpha(render.palette.background, 0.72),
                color: render.palette.text,
                fontFamily: render.typography.fontFamily,
                fontSize: style.fontSize,
                fontWeight: render.typography.headingWeight,
                lineHeight: CAPTION_LINE_HEIGHT,
                textAlign: "center",
              }}
            >
              {cue.text}
            </div>
          </div>
        </Sequence>
      ))}
    </>
  );
};

/**
 * Registers the project's bundled faces in the context that draws the frames.
 *
 * `calculateMetadata` runs in its own context, so a face added there is not
 * necessarily present in a frame render tab: the tab falls back to a system
 * face and the shot silently ships in the wrong typeface. Loading here, and
 * holding the render until the faces are ready, is what makes a role font a
 * guarantee rather than a hope.
 */
/**
 * Marks a font failure so the node side can turn it back into a source issue.
 * Only the message survives the browser boundary, so the reason travels in it.
 */

const useBundledFonts = (fonts: CompiledDraft["fonts"]): void => {
  const [handle] = useState(() => delayRender("Loading bundled fonts"));
  useEffect(() => {
    let cancelled = false;
    loadBundledFonts(fonts, { requireAllFaces: true })
      .then(async (loaded) => {
        await document.fonts.ready;
        const missing = fonts.filter((font) => !loaded.has(font.family));
        if (missing.length > 0) {
          // A frame drawn in a substituted face is a silently wrong render,
          // so the render stops and names the faces that never arrived.
          throw new Error(
            `${FONT_RENDER_FAILURE} ${missing
              .map((font) => `${font.family} ${font.weight}`)
              .join(", ")}`,
          );
        }
        // A registered family can still be the wrong weight, so each declared
        // face is checked at the size the browser was asked to prepare.
        const unusable = fonts.filter(
          (font) =>
            !document.fonts.check(`${font.weight} 16px "${font.family}"`),
        );
        if (unusable.length > 0) {
          throw new Error(
            `${FONT_RENDER_FAILURE} ${unusable
              .map((font) => `${font.family} ${font.weight}`)
              .join(", ")}`,
          );
        }
        if (!cancelled) continueRender(handle);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        cancelRender(error instanceof Error ? error : new Error(String(error)));
      });
    return () => {
      cancelled = true;
    };
  }, [fonts, handle]);
};

export const DraftVideo = (draft: CompiledDraft) => {
  useBundledFonts(draft.fonts);
  return (
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
      <CaptionLayer draft={draft} />
      {draft.narration?.clips.map((clip) => {
        const asset = draft.assets[clip.assetId];
        if (!asset || asset.kind === "png" || asset.kind === "placeholder")
          return null;
        return (
          <Sequence
            key={clip.blockId}
            from={clip.startFrame}
            durationInFrames={clip.durationInFrames}
            name={`audio-${clip.blockId}`}
          >
            <Audio
              src={staticFile(asset.publicPath)}
              startFrom={clip.trimStartFrames ?? 0}
            />
          </Sequence>
        );
      })}
      <SoundtrackLayer draft={draft} />
      {draft.mode === "draft" && (
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
      )}
    </AbsoluteFill>
  );
};
