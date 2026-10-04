export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Places a source image so `crop` (source pixels) covers the viewport. */
export const placeCrop = (
  source: { width: number; height: number },
  crop: Rect,
  viewport: { width: number; height: number },
) => {
  const scale = Math.max(
    viewport.width / crop.width,
    viewport.height / crop.height,
  );
  return {
    width: source.width * scale,
    height: source.height * scale,
    left: -crop.x * scale + (viewport.width - crop.width * scale) / 2,
    top: -crop.y * scale + (viewport.height - crop.height * scale) / 2,
  };
};
