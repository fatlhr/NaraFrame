# Reference projects

Two independent source projects and one derived profile-switch variant, the
evidence behind NF-AC-03. Every file here is source: none of it is generated
at render time, and none of it contains per-project executable code.

| Path | What it exercises |
| --- | --- |
| `project-current-issues/` | map, timeline, diagram composition, narration, captions, music, SFX, dated factual sources |
| `project-general-explainer/` | full-bleed media, a single statistic, a two-panel comparison, layered composition |
| `profiles/contrast/` | the profile the variant switches to |
| `profiles/general-explainer/` | the second project's own profile, carrying none of the current-affairs rules |

The variant is not committed. It is derived in
`packages/cli/test/e2e/reference-projects.test.ts` by applying
`profiles/contrast` to a copy of `project-current-issues`, which is what
proves the switch, the invalidation report, and the undo.

## Regenerating the inputs

The images and audio are small and synthesised on purpose: a fixture should
prove the pipeline without carrying photography or licensed music.

```bash
python3 test-fixtures/tools/make-assets.py        # the PNG plates
bash test-fixtures/tools/make-audio-beds.sh       # the music bed and the effect
node test-fixtures/tools/make-narration.mjs test-fixtures/project-current-issues
node test-fixtures/tools/make-narration.mjs test-fixtures/project-general-explainer
```

`make-narration.mjs` speaks the text in `narration-seeds/` with the macOS
`Damayanti` voice, then runs the audio back through `importPreparedAudio`, so
the phrase boundaries in `narration.json` are measured from pauses the
importer can actually hear rather than estimated. Regenerating narration
changes the audio hashes, so the committed `narration.json` and
`assets/manifest.json` change with it.

## Colours

Scene shapes and text name profile slots (`palette.accent`, `palette.surface`)
instead of hex values wherever the colour belongs to the profile. A literal
hex still works and is never repainted, which is the point: it is the author
saying this colour is not the profile's business.
