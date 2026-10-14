# Keep the take; revise the episode

Use this path when the owner supplies an existing voice take or accepts one already in the project. Read the project's pinned profile and `schema --json` first. Audio preparation does not choose a provider, approve facts, clear rights or authorize export.

## Prepare and listen

Identify the block's intended spoken text before aligning it. An imported whole-video master has a broader replacement scope than separate block takes: changing one sentence may require replacing or realigning the master. Headline, caption policy and illustration revisions need neither operation.

Keep the source clip untouched. Record its SHA-256 and a passive timing package containing `schemaVersion: 1`, `units: "milliseconds"`, `audioSha256`, `text`, `phrases`, `pauseAfterMs`, `alignment`, `uncertainties` and `verification`. Phrase and optional word times are local to the clip, not global video time. Each word range must fit its phrase; do not derive word timing from silence detection or call a phrase-local offset word synchronization.

For example, the following is an alignment awaiting listening, not a confirmed voice binding. Replace the hash and values with the supplied take's actual data:

```json
{
  "schemaVersion": 1,
  "units": "milliseconds",
  "audioSha256": "ACTUAL_64_HEX_SHA256",
  "text": "One accepted sentence. Another accepted sentence.",
  "phrases": [
    {"id":"first","text":"One accepted sentence.","startMs":0,"endMs":2200},
    {"id":"second","text":"Another accepted sentence.","startMs":2500,"endMs":5000}
  ],
  "pauseAfterMs": 1000,
  "alignment": {"method":"manual","source":"Cue sheet for the supplied take"},
  "uncertainties": ["Phrase boundaries still need listening review"],
  "verification": {"state":"pending"}
}
```

Listen at phrase boundaries and through pauses; compare the actual words with the block text. Ask for the owner's review when they own that decision. Only after an actual listening confirmation use `verification: {state:"verified", method:"listening", reviewer:"<reviewer>", verifiedAt:"<ISO timestamp>"}`. Record unresolved uncertainty honestly. Include `voiceStyleSignature` or `license` only when known; a profile's requested style is not proof of how this take was made or licensed.

Create or revise the intended narration block through ordinary source/edit first. `audio stage` refuses a timing package whose text differs from that block rather than silently changing spoken content. It also respects music/silent intent and profile locks; do not change the requested audio mode merely to make an import work.

```bash
pnpm naraframe audio stage <project> --from <existing-clip> --timing <timing-package.json> --block <block-id> --json
pnpm naraframe edit <project> --from <returned-staging> --expect <returned-source-revision> --summary "Import the reviewed take" --json
pnpm naraframe validate <project> --stage plan --json
```

Staging captures the audio and package, probes the captured media and returns `artifacts.staging` plus `sourceRevision`; it does not edit the project. The unchanged clip is copied under a content-addressed path. No normalization, stretching, added silence or provider call occurs. Inspect the returned receipt and staging before applying it. On a revision conflict, reread status and restage against the current source.

The ready block's optional `prepared` receipt binds the captured audio hash, normalized text hash, local phrase/word timing hash and measured duration to the recorded verification. Pending alignment is a draft warning and a production/export blocker; it does not assert confirmed `generation.textSha256`. Verified import records that binding and only a supplied, known voice-style signature. The engine checks receipt consistency, not what a person heard. Do not manually recalculate hashes to hide changed words, cue boundaries or media: review the affected take and restage it. Legacy ready blocks without `prepared` keep their existing behavior.

## Reuse series identity

Inspect `library/series/study-notes/catalog.json` and read its `identity@1.0.0` parameter contract. It expands to an ordinary editable scene, not a new runtime. Stage it using [library.md](library.md), with complete values for `block`, `title`, `intro-copy`, `intro-opacity`, `signature`, `signoff-copy`, `signoff-start-ms`, `duration-ms` and `rundown`. Use the narration block ID and an episode-specific takeaway; do not copy another episode's facts.

The intro overlays the opening; `intro-opacity: 0` omits it and `1` shows it. Signature persists. Place sign-off in the existing block's trailing `pauseAfterMs` hold and leave enough time for its entry and reading. For a clip measured as 5851 ms plus a 1000 ms hold, the scene ends at 6851 ms; sign-off may begin at 5851 ms. Recalculate those values from the actual clip, not this example. Params, version and dependencies are pinned in `libraryImports`; the episode's profile still supplies fonts and palette.

This preset prepends no time: omitting intro shifts the voice by zero. Changing the trailing hold explicitly changes total duration but not master bytes or listening timing hash. Standalone silent pre-roll and arbitrary unvoiced scenes are not supplied by this preset. `rundown` is the visible episode number/topic line; record the explanatory shot note separately following [library.md](library.md) if further re-instantiation is needed. Record identity exceptions through the parameter receipt rather than hidden source hacks. Later catalog changes cannot silently alter an imported episode.

## Review the result and revise

Validate before preview. Start with a short affected scene and preserve its first source, MP4 and contact sheet. Inspect intro, both cue boundaries, settled signature and sign-off; check the actual audio as well as frames. Compare full/scoped positioning when the timeline is complete. Encoded AAC/container durations can differ slightly from input sample boundaries; report measured offsets instead of calling every millisecond difference an alignment failure.

After visual copy, asset or caption edits, confirm the master SHA and voice generation key remain unchanged. `pauseAfterMs` is a visual hold outside the listening timing hash, not extra bytes in the clip. Source edits still stale approval. Use ordinary `undo` and the result's `reusedFromBuildId` to prove restoration; current reuse summaries do not cover every media type. Profile changes can invalidate a known voice-style binding, and an unknown style must never be silently certified as compatible. A ready preview is neither owner visual acceptance nor publication permission.
