import { absolute, readRevisionMeta, restoreObject } from "./store.js";

/** Writes a revision's source files and media into `destination`. */
export const materializeRevision = async (
  root: string,
  id: string,
  destination: string,
): Promise<boolean> => {
  const meta = await readRevisionMeta(root, id);
  if (!meta) return false;
  for (const file of [...meta.sources, ...meta.media]) {
    await restoreObject(root, file.sha256, absolute(destination, file.path));
  }
  return true;
};
