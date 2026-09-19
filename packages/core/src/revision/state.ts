import type { PreviewSelection, RevisionMeta } from "./schema.js";
import {
  readCurrentRevisionId,
  readPreviewSelection,
  readRevisionMeta,
} from "./store.js";

export interface RevisionState {
  currentId: string | null;
  parentId: string | null;
  summary: string | null;
  kind: RevisionMeta["kind"] | null;
  previewSelection: PreviewSelection | null;
}

/** Read-only view of history; safe to call without holding the lock. */
export const readRevisionState = async (
  root: string,
): Promise<RevisionState> => {
  const currentId = await readCurrentRevisionId(root);
  const meta = currentId ? await readRevisionMeta(root, currentId) : null;
  return {
    currentId,
    parentId: meta?.parentId ?? null,
    summary: meta?.summary ?? null,
    kind: meta?.kind ?? null,
    previewSelection: currentId
      ? await readPreviewSelection(root, currentId)
      : null,
  };
};
