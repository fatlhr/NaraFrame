# Study Notes 1.0.0

An ordinary local catalog, using profile role fonts and palette. Stage its `identity` pattern into one scene bound to the complete measured narration block. Supply every scalar in `episode.json`; values and the captured template/catalog are recorded in `libraryImports`. No provider, recipe trust or new renderer is involved.

```sh
pnpm naraframe library inspect library/series/study-notes/catalog.json --json
pnpm naraframe library stage PROJECT --from library/series/study-notes/catalog.json --pattern identity --version 1.0.0 --instance series --scene opening --params library/series/study-notes/episode.json --json
pnpm naraframe edit PROJECT --from RETURNED_STAGING --expect RETURNED_REVISION --json
```

The intro overlays the first 1100 ms; the signature persists. Sign-off starts at local measured speech end (5851 ms in these example values), inside the trailing narration `pauseAfterMs`. Set that hold to 1000 ms for `episode.json`, or 1400 ms for `episode-override.json`, through an ordinary guarded edit. `duration-ms` records their expected totals (6851/7251 ms); the existing narration clock controls actual partitioning. The 200 ms reveal must fit inside the hold. This template covers one complete block; do not bind it to an arbitrary later phrase without converting start/duration to that scene's local time.

To omit the intro or replace sign-off, re-stage the existing instance using a complete scalar file and no `--from`. `intro-opacity: 0` records omission; speech shifts by zero. The override example deliberately changes copy, rundown and total hold. It does not change the clip or speech timing receipt. Use the same catalog on a second episode with explicit numbering and timing; numbering is never inferred. Intro omission keeps the existing exit beat but its base opacity remains zero.

This is a declarative typography example, not an accepted finished visual. There is no standalone silent pre-roll, arbitrary unvoiced scene, native word motion or new identity runtime. Profile palette/fonts/locks and normal source, media, approval and reuse rules remain authoritative.
