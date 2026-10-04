import { AbsoluteFill, Img, interpolate, useCurrentFrame } from "remotion";
import { placeCrop, type Rect } from "./crop";

interface Props {
  params: Record<string, unknown>;
  assets: Record<string, { src: string; width: number; height: number }>;
  profile: { palette: { background: string; text: string; accent: string } };
  fps: number;
  durationInFrames: number;
}

interface CardParams {
  title: string;
  image: { assetId: string; crop: Rect; focusCrop: Rect };
}

/** A titled card whose image view pushes from one crop to another. */
export default function FrameCard({
  params,
  assets,
  profile,
  durationInFrames,
}: Props) {
  const frame = useCurrentFrame();
  const { title, image } = params as unknown as CardParams;
  const source = assets[image.assetId];
  if (!source) throw new Error(`Missing asset ${image.assetId}`);
  const t = interpolate(frame, [0, durationInFrames - 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const crop: Rect = {
    x: image.crop.x + (image.focusCrop.x - image.crop.x) * t,
    y: image.crop.y + (image.focusCrop.y - image.crop.y) * t,
    width: image.crop.width + (image.focusCrop.width - image.crop.width) * t,
    height:
      image.crop.height + (image.focusCrop.height - image.crop.height) * t,
  };
  const viewport = { width: 900, height: 900 };
  const place = placeCrop(source, crop, viewport);
  return (
    <AbsoluteFill style={{ background: profile.palette.background }}>
      <div
        style={{
          position: "absolute",
          left: 90,
          top: 320,
          width: 900,
          fontSize: 96,
          fontWeight: 800,
          color: profile.palette.text,
        }}
      >
        {title}
      </div>
      <div
        style={{
          position: "absolute",
          left: 90,
          top: 700,
          ...viewport,
          overflow: "hidden",
          borderRadius: 40,
          border: `8px solid ${profile.palette.accent}`,
        }}
      >
        <Img
          src={source.src}
          style={{ position: "absolute", maxWidth: "none", ...place }}
        />
      </div>
    </AbsoluteFill>
  );
}
