#!/usr/bin/env node
/**
 * Speaks a project's narration blocks and imports them.
 *
 * The reference projects need narration whose timing was measured rather than
 * guessed, so the fixture builds it the same way a real project does: speak
 * the text, then run the audio back through importPreparedAudio, which places
 * phrase boundaries on the pauses it can actually hear. macOS `say` supplies
 * an Indonesian voice; the audio is committed so the fixture works anywhere.
 *
 * Reads test-fixtures/narration-seeds/<project>.json (text and pauses) and
 * writes the project's narration.json plus its voice assets.
 *
 * Usage: node test-fixtures/tools/make-narration.mjs <project-directory>
 */

import { execFile } from "node:child_process";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { promisify } from "node:util";

const { importPreparedAudio, narrationTextHash } = await import(
  new URL("../../packages/core/dist/index.js", import.meta.url).href
);

const run = promisify(execFile);
const project = resolve(process.argv[2] ?? ".");
const VOICE = "Damayanti";

const lock = JSON.parse(
  await readFile(join(project, "profile.lock.json"), "utf8"),
);
// Recording the style the clip was made with is what lets a later profile
// change report the narration as stale instead of silently reusing it.
const voiceStyleSignature = lock.production.voiceStyleSignature;
const seed = JSON.parse(
  await readFile(
    join(
      resolve(project, ".."),
      "narration-seeds",
      `${project.split("/").at(-1)}.json`,
    ),
    "utf8",
  ),
);
const staging = join(project, ".narration-staging");
await rm(staging, { recursive: true, force: true });
await mkdir(staging, { recursive: true });
await mkdir(join(project, "audio", "narration"), { recursive: true });

const imported = [];
for (const block of seed.blocks) {
  const aiff = join(staging, `${block.id}.aiff`);
  const mp3 = join(staging, `${block.id}.mp3`);
  // A slow rate leaves real pauses between sentences for the importer to find.
  await run("say", ["-v", VOICE, "-r", "150", "-o", aiff, block.text]);
  await run("ffmpeg", [
    "-v",
    "error",
    "-y",
    "-i",
    aiff,
    "-ac",
    "1",
    "-ar",
    "44100",
    "-b:a",
    "64k",
    mp3,
  ]);
  const result = await importPreparedAudio({
    audioPath: mp3,
    text: block.text,
    blockId: block.id,
    outputDirectory: join(project, "audio", "narration"),
  });
  if (!result.ok) {
    console.error(block.id, JSON.stringify(result.issues, null, 2));
    process.exit(1);
  }
  imported.push({ block, audio: result.value });
  console.error(
    `${block.id}: ${result.value.durationMs} ms, ${result.value.phrases.length} phrases`,
  );
}
await rm(staging, { recursive: true, force: true });

const narration = {
  schemaVersion: 1,
  order: seed.blocks.map((block) => block.id),
  blocks: imported.map(({ block, audio }) => ({
    id: block.id,
    text: block.text,
    audioAssetId: `voice-${block.id}`,
    audioDurationMs: audio.durationMs,
    pauseAfterMs: block.pauseAfterMs ?? 0,
    phrases: audio.phrases,
  })),
};
await writeFile(
  join(project, "narration.json"),
  `${JSON.stringify(narration, null, 2)}\n`,
);

const manifestPath = join(project, "assets", "manifest.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const voices = imported.map(({ block, audio }) => ({
  id: `voice-${block.id}`,
  status: "ready",
  kind: "mp3",
  path: `audio/narration/${audio.audioSha256}.mp3`,
  sha256: audio.audioSha256,
  origin: {
    type: "generated",
    source: `macOS say (${VOICE}) via make-narration.mjs`,
  },
  generation: {
    textSha256: narrationTextHash(block.text),
    voiceStyleSignature,
  },
}));
manifest.assets = [
  ...manifest.assets.filter((asset) => !asset.id.startsWith("voice-")),
  ...voices,
];
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.error(`wrote narration.json and ${voices.length} voice assets`);
