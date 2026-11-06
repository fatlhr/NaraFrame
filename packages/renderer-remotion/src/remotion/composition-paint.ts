import type { CompiledDraft, Frame, Layer } from "@naraframe/core";
import { imagePlacement } from "@naraframe/core/image-placement";
import { staticFile } from "remotion";

type PaintLayer = Extract<Layer, { type: "image" | "path" }>;

const load = async (url: string) => {
  const image = new Image();
  image.src = url;
  await image.decode();
  return image;
};

const alphaBounds = (context: CanvasRenderingContext2D): Frame | null => {
  const { width, height } = context.canvas;
  const rgba = context.getImageData(0, 0, width, height).data;
  let left = width;
  let top = height;
  let right = 0;
  let bottom = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if ((rgba[(y * width + x) * 4 + 3] ?? 0) < 128) continue;
      left = Math.min(left, x);
      right = Math.max(right, x + 1);
      top = Math.min(top, y);
      bottom = Math.max(bottom, y + 1);
    }
  }
  return right > left && bottom > top
    ? { x: left, y: top, width: right - left, height: bottom - top }
    : null;
};

const paintBounds = async (
  draft: CompiledDraft,
  layer: PaintLayer,
): Promise<Frame | null | undefined> => {
  const canvas = document.createElement("canvas");
  const scale = 1080 / draft.width;
  const { frame } = layer;
  // Paths paint strokes past the viewBox. Leave room for those pixels.
  const pad =
    layer.type === "path"
      ? Math.ceil(
          layer.stroke.width *
            Math.max(
              frame.width / layer.viewBox.width,
              frame.height / layer.viewBox.height,
            ),
        )
      : 0;
  canvas.width = Math.ceil((frame.width + 2 * pad) * scale);
  canvas.height = Math.ceil((frame.height + 2 * pad) * scale);
  if (canvas.width * canvas.height > 12_000_000) return undefined;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return undefined;
  context.scale(scale, scale);
  context.translate(pad, pad);
  if (layer.type === "path") {
    context.scale(
      frame.width / layer.viewBox.width,
      frame.height / layer.viewBox.height,
    );
    context.translate(-layer.viewBox.minX, -layer.viewBox.minY);
    const path = new Path2D(layer.d);
    if (layer.fill) {
      context.fillStyle = layer.fill;
      context.fill(path);
    }
    context.strokeStyle = layer.stroke.color;
    context.lineWidth = layer.stroke.width;
    context.lineCap = layer.lineCap ?? "round";
    context.lineJoin = "round";
    if (layer.dash) context.setLineDash(layer.dash);
    context.stroke(path);
  } else {
    const asset = draft.assets[layer.assetId];
    if (asset?.kind !== "png" && asset?.kind !== "svg") return undefined;
    if (layer.stroke) return undefined;
    if (layer.cornerRadius) {
      context.beginPath();
      context.roundRect(0, 0, frame.width, frame.height, layer.cornerRadius);
      context.clip();
    }
    if (asset.kind === "svg") {
      const { minX, minY, width, height } = asset.viewBox;
      const aspect = layer.fit === "cover" ? "slice" : "meet";
      const markup = `<svg xmlns="http://www.w3.org/2000/svg" width="${frame.width * scale}" height="${frame.height * scale}" viewBox="${minX} ${minY} ${width} ${height}" preserveAspectRatio="xMidYMid ${aspect}">${asset.body}</svg>`;
      const image = await load(
        `data:image/svg+xml,${encodeURIComponent(markup)}`,
      );
      context.drawImage(image, 0, 0, frame.width, frame.height);
    } else {
      const image = await load(staticFile(asset.publicPath));
      const source = { width: image.naturalWidth, height: image.naturalHeight };
      const crop = layer.crop ?? { x: 0, y: 0, ...source };
      const mapped = imagePlacement({
        source,
        crop,
        frame,
        fit: layer.fit,
        focalPoint: layer.focalPoint ?? { x: 0.5, y: 0.5 },
      });
      context.beginPath();
      context.rect(
        mapped.clip.x,
        mapped.clip.y,
        mapped.clip.width,
        mapped.clip.height,
      );
      context.clip();
      context.drawImage(
        image,
        mapped.image.x,
        mapped.image.y,
        mapped.image.width,
        mapped.image.height,
      );
    }
  }
  const bounds = alphaBounds(context);
  return (
    bounds && {
      x: frame.x + bounds.x / scale - pad,
      y: frame.y + bounds.y / scale - pad,
      width: bounds.width / scale,
      height: bounds.height / scale,
    }
  );
};

export type CompositionPaint = Map<
  string,
  Map<string, Frame | null | undefined>
>;

export const loadCompositionPaint = async (
  draft: CompiledDraft,
): Promise<CompositionPaint> => {
  const scenes: CompositionPaint = new Map();
  if (!draft.compositionQualityStage) return scenes;
  for (const scene of draft.scenes) {
    const bounds = new Map<string, Frame | null | undefined>();
    for (const layer of scene.layers) {
      if (layer.type !== "image" && layer.type !== "path") continue;
      try {
        bounds.set(layer.id, await paintBounds(draft, layer));
      } catch {
        bounds.set(layer.id, undefined);
      }
    }
    scenes.set(scene.id, bounds);
  }
  return scenes;
};
