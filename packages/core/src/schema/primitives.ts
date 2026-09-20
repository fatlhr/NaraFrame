import { z } from "zod";

export const SchemaVersionSchema = z.literal(1);
export const IdSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Expected a lowercase kebab-case ID");
export const Sha256Schema = z
  .string()
  .regex(/^[a-f0-9]{64}$/, "Expected a lowercase SHA-256 value");
export const ColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Expected a six-digit hex color");
/**
 * A scene may name a profile colour instead of a literal one. Without this a
 * project's shapes keep their hex values when the profile changes, so a
 * profile switch repaints the type and the page but leaves every rule,
 * panel and marker in the old palette.
 */
export const PaletteTokenSchema = z.enum([
  "palette.background",
  "palette.surface",
  "palette.text",
  "palette.accent",
]);
export type PaletteToken = z.infer<typeof PaletteTokenSchema>;

/** A literal colour, or a profile palette slot resolved at compile time. */
export const ColorValueSchema = z.union([ColorSchema, PaletteTokenSchema]);

export const VersionSchema = z
  .string()
  .regex(/^\d+\.\d+\.\d+$/, "Expected a semantic version");
export const PositiveIntegerSchema = z.number().int().positive();
export const NonNegativeIntegerSchema = z.number().int().nonnegative();
export const ConfigPathSchema = z
  .string()
  .regex(
    /^[a-z][A-Za-z0-9]*(?:\.[a-z][A-Za-z0-9]*)+$/,
    "Expected a dotted configuration path",
  );
export const SafeRelativePathSchema = z
  .string()
  .superRefine((value, context) => {
    const segments = value.split("/");
    const isSafe =
      value.length > 0 &&
      !value.startsWith("/") &&
      !value.includes("\\") &&
      !/^[A-Za-z][A-Za-z0-9+.-]*:/.test(value) &&
      segments.every(
        (segment) => segment !== "" && segment !== "." && segment !== "..",
      );

    if (!isSafe) {
      context.addIssue({
        code: "custom",
        message: "Expected a safe relative POSIX path",
      });
    }
  });

export const RelativePngPathSchema = SafeRelativePathSchema.refine(
  (value) => value.toLowerCase().endsWith(".png"),
  "Expected a path ending in .png",
);
export const RelativeAudioPathSchema = SafeRelativePathSchema.refine(
  (value) =>
    [".mp3", ".wav", ".m4a"].some((ext) => value.toLowerCase().endsWith(ext)),
  "Expected a path ending in .mp3, .wav, or .m4a",
);
export const RelativeFontPathSchema = SafeRelativePathSchema.refine(
  (value) =>
    [".ttf", ".otf", ".woff2"].some((ext) => value.toLowerCase().endsWith(ext)),
  "Expected a path ending in .ttf, .otf, or .woff2",
);
