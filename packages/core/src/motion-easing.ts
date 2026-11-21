// Finite, seekable curves. The extrema also drive the browser preflight.
const back = 1.70158;
const turn = (2 * back) / (3 * (back + 1));
const decay = 5.5;
const frequency = 4 * Math.PI;
const springEnd = 1 - Math.exp(-decay);

const curves = {
  "expo-out": (t: number) => -Math.expm1(-10 * Math.LN2 * t) / (1 - 2 ** -10),
  "back-out": (t: number) => 1 + (t - 1) ** 2 * ((back + 1) * (t - 1) + back),
  anticipate: (t: number) => t * t * ((back + 1) * t - back),
  spring: (t: number) =>
    (1 -
      Math.exp(-decay * t) *
        (Math.cos(frequency * t) +
          (decay / frequency) * Math.sin(frequency * t))) /
    springEnd,
};

export const easingPresets = [
  "linear",
  "smooth",
  "snappy",
  "expo-out",
  "back-out",
  "anticipate",
  "spring",
] as const;
export type EasingPreset = (typeof easingPresets)[number];
type Expressive = keyof typeof curves;

// Roots of each curve's derivative, excluding the endpoints.
const extrema: Record<Expressive, readonly number[]> = {
  "expo-out": [],
  "back-out": [1 - turn],
  anticipate: [turn],
  spring: [0.25, 0.5, 0.75],
};
export const isExpressive = (preset?: EasingPreset): preset is Expressive =>
  preset !== undefined && Object.hasOwn(curves, preset);

export const easingExtrema = (preset?: EasingPreset): readonly number[] =>
  isExpressive(preset) ? extrema[preset] : [];

export const expressiveProgress = (preset: Expressive, t: number) =>
  t <= 0 ? 0 : t >= 1 ? 1 : curves[preset](t);

/** Camera zoom has the same 0.25–4 domain between keys as at authored poses. */
export const cameraPoseAtProgress = (
  from: { x: number; y: number; zoom: number },
  to: { x: number; y: number; zoom: number },
  progress: number,
) =>
  progress === 1
    ? to
    : {
        x: from.x + (to.x - from.x) * progress,
        y: from.y + (to.y - from.y) * progress,
        zoom: Math.max(
          0.25,
          Math.min(4, from.zoom + (to.zoom - from.zoom) * progress),
        ),
      };

/** Integer display frames bracketing each turning point (including held exposures). */
export const extremumFrames = (
  preset: EasingPreset | undefined,
  start: number,
  duration: number,
  hold = 1,
) =>
  easingExtrema(preset).flatMap((t) => {
    const exposure = (start + t * duration) / hold;
    return [Math.floor(exposure), Math.ceil(exposure)].map((n) =>
      Math.ceil(n * hold - 1e-9),
    );
  });
