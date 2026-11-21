import { readFileSync, writeFileSync } from "node:fs";
import { impactSettle } from "../../motion/impact-settle.mjs";

const path = new URL("./catalog.json", import.meta.url);
const catalog = JSON.parse(readFileSync(path, "utf8"));
const scene = catalog.patterns.find(
  (pattern) => pattern.id === "prop-braces",
).template;
const contact = impactSettle({ prop: "shoe", obstacle: "door-leaf" });
const reveal = scene.beats.filter((beat) => beat.targetId === "kitten-ear");
for (const beat of reveal)
  beat.startMs = Math.round((contact.revealFrame * 1000) / 30);
scene.beats = [...contact.beats, ...reveal];
writeFileSync(path, `${JSON.stringify(catalog, null, 2)}\n`);
