import { z } from "zod";
import { IdSchema } from "../schema/primitives.js";

const PointSchema = z
  .object({
    x: z.number().finite().nonnegative(),
    y: z.number().finite().nonnegative(),
  })
  .strict();
export const ImageCropSchema = z
  .object({
    x: z.number().finite().nonnegative(),
    y: z.number().finite().nonnegative(),
    width: z.number().finite().positive(),
    height: z.number().finite().positive(),
  })
  .strict();
export type ImageCrop = z.infer<typeof ImageCropSchema>;
export const PngLayoutSchema = z
  .object({
    units: z.literal("source-pixels"),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    viewport: ImageCropSchema.optional(),
    roi: ImageCropSchema.optional(),
    focalPoint: PointSchema.optional(),
    padding: z
      .object({
        top: z.number().finite().nonnegative(),
        right: z.number().finite().nonnegative(),
        bottom: z.number().finite().nonnegative(),
        left: z.number().finite().nonnegative(),
      })
      .strict()
      .optional(),
    anchors: z.record(IdSchema, PointSchema).optional(),
  })
  .strict()
  .superRefine((layout, ctx) => {
    for (const key of ["viewport", "roi"] as const) {
      const box = layout[key];
      if (box && !cropWithinImage(box, layout))
        ctx.addIssue({
          code: "custom",
          path: [key],
          message: "Rectangle must stay inside source pixels",
        });
    }
    for (const [key, point] of Object.entries({
      ...(layout.anchors ?? {}),
      ...(layout.focalPoint ? { focalPoint: layout.focalPoint } : {}),
    })) {
      if (point.x > layout.width || point.y > layout.height)
        ctx.addIssue({
          code: "custom",
          path: ["anchors", key],
          message: "Point must stay inside source pixels",
        });
    }
    if (
      layout.padding &&
      (layout.padding.left + layout.padding.right >= layout.width ||
        layout.padding.top + layout.padding.bottom >= layout.height)
    )
      ctx.addIssue({
        code: "custom",
        path: ["padding"],
        message: "Padding must leave a positive content area",
      });
  });
export const cropWithinImage = (
  crop: ImageCrop,
  size: { width: number; height: number },
): boolean =>
  crop.x >= 0 &&
  crop.y >= 0 &&
  crop.width > 0 &&
  crop.height > 0 &&
  crop.x + crop.width <= size.width &&
  crop.y + crop.height <= size.height &&
  Object.values(crop).every(Number.isFinite);

/** Source-pixel crop -> local frame geometry. ROI and padding are informational. */
export const imagePlacement = (input: {
  source: { width: number; height: number };
  frame: { width: number; height: number };
  crop?: ImageCrop;
  fit: "cover" | "contain";
  focalPoint?: { x: number; y: number };
}) => {
  const crop = input.crop ?? { x: 0, y: 0, ...input.source };
  if (
    !cropWithinImage(crop, input.source) ||
    ![input.frame.width, input.frame.height].every(
      (v) => Number.isFinite(v) && v > 0,
    )
  )
    throw new Error("Invalid image placement geometry");
  const scale = (input.fit === "cover" ? Math.max : Math.min)(
    input.frame.width / crop.width,
    input.frame.height / crop.height,
  );
  const focal = input.focalPoint ?? { x: 0.5, y: 0.5 };
  if (![focal.x, focal.y].every((v) => Number.isFinite(v) && v >= 0 && v <= 1))
    throw new Error("Invalid image focal point");
  const offsetX = (input.frame.width - crop.width * scale) * focal.x;
  const offsetY = (input.frame.height - crop.height * scale) * focal.y;
  return {
    scale,
    offsetX,
    offsetY,
    crop,
    image: {
      x: offsetX - crop.x * scale,
      y: offsetY - crop.y * scale,
      width: input.source.width * scale,
      height: input.source.height * scale,
    },
    clip: {
      x: offsetX,
      y: offsetY,
      width: crop.width * scale,
      height: crop.height * scale,
    },
    mapPoint: (point: { x: number; y: number }) => ({
      x: offsetX + (point.x - crop.x) * scale,
      y: offsetY + (point.y - crop.y) * scale,
    }),
  };
};
