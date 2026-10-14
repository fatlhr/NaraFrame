import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

// Feed the public `schema --json` stdout; no private package imports.
const input = [];
for await (const chunk of process.stdin) input.push(chunk);
const event = Buffer.concat(input)
  .toString()
  .split("\n")
  .filter((line) => line.startsWith("{"))
  .map((line) => JSON.parse(line))
  .find((value) => value.command === "schema");
assert.ok(event?.success, "A successful public schema result is required");
const document = JSON.parse(
  await readFile(
    process.argv[3] ??
      new URL("examples/art-direction/scenes.json", import.meta.url),
  ),
);
const profile = JSON.parse(
  await readFile(resolve(process.argv[2], "profile.lock.json")),
);
const { capabilities, schemas } = event.data;
const sceneSchema = schemas.Scenes.properties.scenes.items;
const composition = sceneSchema.properties.visual.oneOf.find(
  (item) => item.properties.type.const === "composition",
);
const layerSchemas = composition.properties.layers.items.oneOf;
const beatSchemas = sceneSchema.properties.beats.items.oneOf;
const required = (value, schema) => {
  assert.ok(schema, `Public schema exists for ${value.type ?? value.action}`);
  for (const key of schema.required)
    assert.ok(key in value, `${value.id}: missing ${key}`);
};
const byId = Object.fromEntries(
  document.scenes.map((scene) => [scene.id, scene]),
);
assert.deepEqual(Object.keys(byId), [
  "object-explanation",
  "route-diagram",
  "data-comparison",
  "spatial-pullback",
  "headline-emphasis",
  "quiet-shot",
]);
for (const scene of document.scenes) {
  required(scene, sceneSchema);
  assert.equal(scene.visual.type, "composition");
  assert.ok(scene.durationMs >= 8000 && scene.durationMs <= 12000);
  assert.equal(scene.carriesFactualClaim, false);
  const layers = scene.visual.layers;
  assert.equal(new Set(layers.map((layer) => layer.id)).size, layers.length);
  for (const layer of layers) {
    assert.ok(capabilities.layers.includes(layer.type));
    required(
      layer,
      layerSchemas.find((item) => item.properties.type.const === layer.type),
    );
    if (layer.spans)
      assert.equal(layer.spans.map((span) => span.text).join(""), layer.text);
    if (layer.type === "path")
      assert.equal(
        layer.frame.width / layer.frame.height,
        layer.viewBox.width / layer.viewBox.height,
      );
  }
  for (const beat of scene.beats) {
    assert.ok(capabilities.beats.includes(beat.action));
    required(
      beat,
      beatSchemas.find((item) => item.properties.action.const === beat.action),
    );
    assert.ok(layers.some((layer) => layer.id === beat.targetId));
    assert.ok(beat.startMs + beat.durationMs <= scene.durationMs);
  }
}
assert.ok(byId["route-diagram"].beats.some((beat) => beat.action === "draw"));
assert.ok(byId["route-diagram"].beats.some((beat) => beat.action === "follow"));
const spatial = byId["spatial-pullback"];
assert.ok(spatial.visual.layers.some((layer) => layer.space === "world"));
assert.ok(spatial.camera.initial.zoom > spatial.camera.moves[0].to.zoom);
const quiet = byId["quiet-shot"];
assert.equal(quiet.beats.length, 0);
assert.equal(quiet.camera, undefined);
assert.equal(quiet.transition.type, "cut");
const data = byId["data-comparison"];
assert.match(
  data.visual.layers.find((layer) => layer.id === "illustrative").text,
  /ilustrasi/,
);
for (const beat of data.beats.filter((item) => item.action === "count")) {
  const layer = data.visual.layers.find((item) => item.id === beat.targetId);
  assert.equal(layer.text, String(beat.params.to));
  const role = profile.render.typography.roles[layer.role];
  assert.ok(
    layer.frame.height >=
      (layer.fontSize ?? role.fontSize) * (layer.lineHeight ?? role.lineHeight),
    `${layer.id}: numeric line box must fit before browser preflight`,
  );
}
const bars = ["bar-a", "bar-b"].map((id) =>
  data.visual.layers.find((layer) => layer.id === id),
);
assert.equal(
  bars[0].frame.y + bars[0].frame.height,
  bars[1].frame.y + bars[1].frame.height,
);
assert.equal(bars[1].frame.height / bars[0].frame.height, 5 / 2);
console.log(
  "Art-direction example checks passed: six patterns, public registry/required keys, semantic structure and numeric fit regression. Full schema/preflight authority remains the public CLI.",
);
