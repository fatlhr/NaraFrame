/** Expand a prop contact into ordinary beats, with frame-aligned phases. */
export const impactSettle = ({
  prop,
  obstacle,
  prefix = "contact",
  fps = 30,
  contactFrame = 14,
  holdFrames = 5,
}) => {
  if (!prop || !obstacle || prop === obstacle || !prefix) {
    throw new Error(
      "Contact requires distinct prop/obstacle targets and a prefix.",
    );
  }
  if (
    !Number.isInteger(fps) ||
    fps < 1 ||
    fps > 120 ||
    !Number.isInteger(contactFrame) ||
    contactFrame < 5 ||
    !Number.isInteger(holdFrames) ||
    holdFrames < 1
  ) {
    throw new Error(
      "Use integer frames, positive hold/fps, and contactFrame >= 5.",
    );
  }
  const ms = (frame) => Math.round((frame * 1000) / fps);
  const beat = (
    id,
    targetId,
    start,
    duration,
    to,
    easingPreset = "smooth",
  ) => ({
    id: `${prefix}-${id}`,
    targetId,
    startMs: ms(start),
    durationMs: ms(duration),
    action: "transform",
    params: { to, easingPreset },
  });
  const settledFrame = contactFrame + 12;
  return {
    settledFrame,
    revealFrame: settledFrame + holdFrames,
    beats: [
      beat("approach", obstacle, 0, contactFrame, { x: -33 }),
      beat("brace", prop, contactFrame - 5, 5, { scale: 1.02, rotationDeg: 2 }),
      beat(
        "compress",
        prop,
        contactFrame,
        5,
        { x: -8, scale: 0.92, rotationDeg: -8 },
        "snappy",
      ),
      beat("rebound", obstacle, contactFrame, 4, { x: -23 }, "snappy"),
      beat("spring", prop, contactFrame + 5, 4, { scale: 1.05 }, "snappy"),
      beat("return", obstacle, contactFrame + 4, 3, { x: -31 }),
      beat("obstacle-settle", obstacle, contactFrame + 7, 5, { x: -32 }),
      beat("prop-settle", prop, contactFrame + 9, 3, {
        x: -6,
        scale: 1,
        rotationDeg: 0,
      }),
    ],
  };
};
