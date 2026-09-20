import type {
  CompiledDraft,
  RenderTokens,
  TypographyRole,
} from "@naraframe/core";
import { staticFile } from "remotion";

/**
 * The one bounded exception to "the profile has a single font family":
 * `role: "display"` (and the scene-level "text" visual, which is always a
 * display treatment) may use a distinct bundled face. Every other role
 * keeps the base family. Shared between the renderer (draft-video.tsx,
 * so what's drawn matches what's measured) and visual-preflight.ts (so
 * measurement and the FONT_NOT_LOADED check test the same family).
 */
/**
 * The face a role is set in. A role's own `fontFamily` wins, then the legacy
 * display override, then the profile family. Resolution order is shared with
 * measurement, so a preflight check never measures a different face than the
 * one that renders.
 */
export const fontFamilyForRole = (
  render: RenderTokens,
  role: TypographyRole | undefined,
): string => {
  const roleFamily = role
    ? render.typography.roles?.[role]?.fontFamily
    : undefined;
  if (roleFamily) return roleFamily;
  return role === "display" && render.typography.displayFontFamily
    ? render.typography.displayFontFamily
    : render.typography.fontFamily;
};

/**
 * Registers each bundled profile font with the page before any measurement
 * runs, and reports back which families actually succeeded. A font that
 * fails to fetch or parse is left out of the returned set on purpose:
 * `document.fonts.check` alone cannot be trusted here (a family that was
 * never registered at all reads as "available" too, since the browser just
 * substitutes a fallback silently) — visual-preflight cross-checks a
 * layer's resolved family against this set for any family declared as a
 * bundled asset, so a genuine load failure still fires FONT_NOT_LOADED
 * instead of silently rendering with a substituted face.
 */
export const loadBundledFonts = async (
  fonts: CompiledDraft["fonts"],
): Promise<Set<string>> => {
  const loaded = new Set<string>();
  await Promise.all(
    fonts.map(async (font) => {
      try {
        const face = new FontFace(
          font.family,
          `url(${staticFile(font.publicPath)})`,
          { weight: String(font.weight) },
        );
        await face.load();
        document.fonts.add(face);
        loaded.add(font.family);
      } catch {
        // Left out of `loaded` on purpose — see the doc comment above.
      }
    }),
  );
  return loaded;
};
