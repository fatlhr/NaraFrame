/**
 * JSON pointers into a recipe scene's params, shared by identity bindings and
 * text slots so both read params the same way.
 */

/** Follows an explicit JSON pointer; no wildcards, no evaluation. */
export const lookupParam = (
  params: unknown,
  pointer: string,
): { found: true; value: unknown } | { found: false } => {
  let current = params;
  for (const segment of pointer.slice(1).split("/")) {
    if (Array.isArray(current)) {
      if (!/^(?:0|[1-9][0-9]*)$/.test(segment)) return { found: false };
      const index = Number(segment);
      if (index >= current.length) return { found: false };
      current = current[index];
    } else if (
      current !== null &&
      typeof current === "object" &&
      Object.hasOwn(current, segment)
    ) {
      current = (current as Record<string, unknown>)[segment];
    } else {
      return { found: false };
    }
  }
  return { found: true, value: current };
};

/** One object key as a JSON pointer segment (RFC 6901): "~" then "/". */
export const pointerSegment = (key: string): string =>
  key.replaceAll("~", "~0").replaceAll("/", "~1");
