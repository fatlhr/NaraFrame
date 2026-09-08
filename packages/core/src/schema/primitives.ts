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
export const RelativePngPathSchema = z
  .string()
  .superRefine((value, context) => {
    const segments = value.split("/");
    const isSafe =
      value.length > 0 &&
      !value.startsWith("/") &&
      !value.includes("\\") &&
      value.endsWith(".png") &&
      segments.every(
        (segment) => segment !== "" && segment !== "." && segment !== "..",
      );

    if (!isSafe) {
      context.addIssue({
        code: "custom",
        message: "Expected a safe relative POSIX path ending in .png",
      });
    }
  });
