# Schematic starter catalog

This passive local catalog supplies repository-authored technical illustrations, not a claim about human-photo rights or competitive visual quality. Read `catalog.json` through `naraframe library inspect` before choosing a pattern.

`anchored-note@1.0.0` requires all three parameters: `{"title":"One clear idea","pose":"pose-left","crop-x":60}`. `pose-right` changes the hand anchor and repositions its sibling note. The declared `viewport` documents a possible crop; only the scene's explicit `crop` applies it. `roi` and `padding` are informational. Every layout quantity, including focal points and anchors, uses original PNG source pixels. Scene focal points use normalized 0–1 values. Scene frames and attachment offsets use 1080×1920 design pixels. PNG bytes are never altered by cropping.

`path-note@1.0.0` requires `{"title":"From idea to action"}` and uses existing reveal/draw motion. Both templates expand into ordinary editable source scenes.

Stage with an exact version, new instance and new scene; apply using the returned staging path and source revision. Pinned regeneration reads only the project's captured receipt/dependencies. An explicit catalog update requires `--from`, `--pattern`, `--version` and `--update`. Hand-edited scenes reject regeneration; retain manual edits or stage a new instance in a separate scene for review. Attachments support unrotated image siblings in one absolute parent and coordinate plane; animate their common parent. No dynamic rigging or cross-parent following is implied.

Dependencies include their original binding, source and license. They are never inferred compatible. Optional catalog recipes remain subject to project/hash-scoped owner trust after import.

`author-pngs.mjs` reproducibly generates the three padded PNGs using local schematic rectangles. Re-running it produces identical bytes.
