import { z } from "zod";
import {
  SafeRelativePathSchema,
  SchemaVersionSchema,
  Sha256Schema,
} from "../schema/primitives.js";

const RevisionFileSchema = z
  .object({ path: SafeRelativePathSchema, sha256: Sha256Schema })
  .strict();

export const RevisionMetaSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    /** The source revision itself: a hash of the canonical source. */
    id: Sha256Schema,
    parentId: Sha256Schema.nullable(),
    summary: z.string().trim().min(1),
    kind: z.enum(["baseline", "edit", "manual-capture"]),
    createdAt: z.string().datetime(),
    sources: z.array(RevisionFileSchema),
    media: z.array(RevisionFileSchema),
  })
  .strict();

export const CurrentRevisionSchema = z
  .object({ schemaVersion: SchemaVersionSchema, revisionId: Sha256Schema })
  .strict();

export const PreviewSelectionSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    revisionId: Sha256Schema,
    buildId: z.string().trim().min(1),
    selectedAt: z.string().datetime(),
  })
  .strict();

export type RevisionMeta = z.infer<typeof RevisionMetaSchema>;
export type CurrentRevision = z.infer<typeof CurrentRevisionSchema>;
export type PreviewSelection = z.infer<typeof PreviewSelectionSchema>;
