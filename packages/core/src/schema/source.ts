import { z } from "zod";
import { IdSchema } from "./primitives.js";

export const SourceSchema = z
  .object({
    id: IdSchema,
    title: z.string().trim().min(1),
    url: z.string().trim().min(1).optional(),
    retrievedAt: z.string().date().optional(),
  })
  .strict();

export type Source = z.infer<typeof SourceSchema>;
