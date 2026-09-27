/**
 * How a counted number is written. Kept free of any import so the renderer's
 * browser bundle can load it without the rest of the core package.
 */
export interface CountFormat {
  decimals?: number | undefined;
  grouping?: "none" | "." | "," | " " | undefined;
  prefix?: string | undefined;
  suffix?: string | undefined;
}

/**
 * The one place a counted number becomes text, shared by the compiler (which
 * checks it against the layer's settled text) and the renderer (which paints
 * it on every frame). A dot grouping takes a comma decimal mark, as in
 * Indonesian; any other grouping takes a dot.
 */
export const formatCount = (value: number, format: CountFormat): string => {
  const decimals = format.decimals ?? 0;
  const grouping = format.grouping ?? "none";
  const fixed = Math.abs(value).toFixed(decimals);
  const [whole = "0", fraction] = fixed.split(".");
  const grouped =
    grouping === "none"
      ? whole
      : whole.replace(/\B(?=(\d{3})+(?!\d))/gu, grouping);
  const decimalMark = grouping === "." ? "," : ".";
  const negative = value < 0 && Number(fixed) !== 0;
  return `${format.prefix ?? ""}${negative ? "-" : ""}${grouped}${
    fraction ? `${decimalMark}${fraction}` : ""
  }${format.suffix ?? ""}`;
};
