import { AbsoluteFill } from "remotion";

interface SlotStyle {
  fontFamily: string;
  fontWeight: number;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  width: number;
  height: number;
  wrap: "words" | "none";
}

interface Props {
  params: Record<string, unknown>;
  profile: { palette: { background: string; text: string } };
  textSlots: Record<string, SlotStyle>;
}

/** Draws the title exactly as the title slot was measured. */
export default function TextCard({ params, profile, textSlots }: Props) {
  const slot = textSlots.title;
  if (!slot) throw new Error("Text slot title was not provided");
  return (
    <AbsoluteFill style={{ background: profile.palette.background }}>
      <div
        style={{
          position: "absolute",
          left: 160,
          top: 400,
          width: slot.width,
          height: slot.height,
          overflow: "hidden",
          fontFamily: slot.fontFamily,
          fontWeight: slot.fontWeight,
          fontSize: slot.fontSize,
          lineHeight: `${slot.lineHeight}px`,
          letterSpacing: `${slot.letterSpacing}px`,
          whiteSpace: slot.wrap === "none" ? "pre" : "pre-line",
          color: profile.palette.text,
        }}
      >
        {String(params.title)}
      </div>
    </AbsoluteFill>
  );
}
