# Art direction through existing public composition

Choose the pattern whose object explains the brief. Start with the viewer takeaway, then object/parts, frame, dominant/supporting type, beat purpose and pace, and incoming/outgoing focus. Save these decisions in the scene's `note`. Profile direction/preferences guide choices; its locks remain authoritative. A profile's duration recommendation can warn on a deliberately scoped 10-second proof without making it invalid.

## Runnable, editable pattern set

[examples/art-direction/scenes.json](examples/art-direction/scenes.json) is source-v1 declarative source, not a recipe, engine module or live catalog import. It contains six independent 10-second scenes. Dependencies: a project created by the public CLI with pinned `current-issues` 0.3.0, its resolved typography/palette, and the current public capability registry. No media, provider, network, trust or arbitrary code is needed. Other profiles need a new fit/contrast review; these are editable structures, not approved artwork.

From the repository root, after activating pinned Node/pnpm:

```bash
pnpm naraframe doctor --json
pnpm naraframe schema --json
pnpm naraframe create ../NaraFrame-projects/art-direction-patterns --profile current-issues --json
cp skills/naraframe/examples/art-direction/scenes.json ../NaraFrame-projects/art-direction-patterns/scenes.json
pnpm naraframe validate ../NaraFrame-projects/art-direction-patterns --stage plan --json
pnpm naraframe preview ../NaraFrame-projects/art-direction-patterns --draft --scene object-explanation --json
pnpm naraframe status ../NaraFrame-projects/art-direction-patterns --json
```

The initial copy populates only the newly created empty `scenes.json`; empty projects have no valid compiled revision yet. It keeps the created project config/profile/manifest. Subsequent revisions use `status`'s `sourceRevision` with `edit --from STAGING --expect SOURCE_REVISION`. This example is a no-narration draft, not a final export. For an intentionally silent production project, stage the created `naraframe.json` with `audioMode: "silent"` alongside the scenes through an ordinary edit. Never change voice intent to bypass missing narration. Use any scene ID below in the same scoped preview command; get artifact paths from its result. For a real episode, author a new project outside the repository and copy only the chosen editable structure into its initial source or staged revision, rather than changing the shared example.

| Pattern / scene ID | What the viewer understands | Existing public path | Editable knobs | Limits / dependencies |
|---|---|---|---|---|
| Object explanation / `object-explanation` | A feedback sheet separates what worked from what to practise | `composition` with separate shapes/text/path, `reveal`, `draw` | Headline, note rows, mark positions, sheet dimensions, trace and hold times | Geometry is symbolic; claims need episode evidence. The backing paper is a real note object, not a universal card. Font/palette come from profile. |
| Route / `route-diagram` | A lesson connects to feedback and an action | Fixed path `draw`, independent shape `follow` | Nodes/labels, `d`, equal-aspect frame/viewBox, draw/follow window and easing | Follower/path use same plane; followed path cannot move/rotate. First follow waits at its start point. Reposition labels away from the route. |
| Data / `data-comparison` | Like measures compare against one baseline | Aligned shapes/text plus `count` | Values, units, bar heights, labels, count duration | 2 and 5 are explicitly illustrative, not student results. Adapt values and heights together. No spans on counted text; settled text must exactly match formatted result. Endpoint fit does not prove every intermediate width. |
| Spatial / `spatial-pullback` | One note belongs to a wider journey | `space: world`, scene `camera.initial` / `moves`, overlay text | World positions, initial/settled poses, camera start/duration/easing | World plates cover camera extremes. Overlay type stays fixed. Check moving text/edges in preview; zoom is 0.25–4. No general cross-scene continuity primitive. |
| Headline / `headline-emphasis` | A turning phrase names the actionable next step | Role/spans plus mild `emphasize`, independently revealed staircase | Copy and spans, headline frame, emphasis scale/window, tread frames | Joined spans must reproduce `text`; phrase emphasis is profile-owned. Scaling still needs fit/collision inspection. Type-led shots can be intentional. |
| Quiet / `quiet-shot` | One action has room to land | Static composition, empty `beats`, explicit `cut` | Copy, object scale, white space, duration | No camera/motion is required. Hold length follows reading/voice needs; profile warnings are not a global motion quota. |

## Small schema-shaped starting points

The live `schema --json` is authoritative; these excerpts save repeated reconstruction, not replace it. Every text/shape/path layer needs `id`, its type-specific content, `frame`, `opacity`, `rotationDeg`, and `zIndex`. A text needs `text` even with spans; a shape needs `shape` and `fill`. A group instead needs `memberIds`, `transform`, and `zIndex`. Scene fields are `id`, `narrativeRole`, `durationMs`, `visual`, `beats`, and `transition`.

```json
{
  "id": "headline", "type": "text", "text": "Make the next step visible.",
  "role": "heading", "maxLines": 2, "overflowPolicy": "error",
  "frame": {"x": 96, "y": 150, "width": 888, "height": 250},
  "opacity": 1, "rotationDeg": 0, "zIndex": 3
}
```

```json
{
  "id": "show-part", "targetId": "note", "startMs": 700,
  "durationMs": 600, "action": "reveal",
  "params": {"direction": "up", "distance": 24, "easingPreset": "smooth"}
}
```

Check field unions/required keys against the returned public schema before copying a different type. Time is in milliseconds; motion is rounded to design fps. Give a changed state a settled hold, not a continuous zoom by default. With verified narration, existing phrase anchors replace guessed word timestamps. A camera reframe changes explanation when it reveals context or isolates the cause; moving the whole card without changing what is understood adds no explanatory relation.

## Revision and visual check

Keep first-draft source/MP4/contact sheet before asking for feedback. Inspect entry, relation/change, settled end and both sides of a transition. Ask: can a viewer name the object, see the relation without reading all the text, and identify the dominant statement? Does motion finish before the reading hold? Are moving shapes and fixed overlay text separated? Are contrast warnings visually resolved?

“Make the headline clearer”: stage only `scenes.json`, change headline `text` and matching `spans`, then use `status` → `edit --expect` → `validate` → scoped `preview` → inspect. “Slow the pullback”: change camera `startMs`/`durationMs` within the scene duration and retain a final hold through the same revision path. `undo` restores the previous source; report actual reuse from command results. Preserve immutable shared patterns and pinned profile; ordinary copy/timing changes belong to the episode.

A neutral cut intentionally changes thought or scale. Continuity is authored by preserving focus position, shape or direction on each side; a `match-cut` field does not establish that the objects match. A quiet shot may have no beats and no camera. The examples make no new primitive, trust, quality-parity, cost-saving or publication claim. Use declarative composition first; existing owner-trusted recipes remain the separate path only when an accepted recipe is supplied, with its code/binding/text-fit limits.

After inspecting output, run focused example/registry checks with the created project profile:

```bash
pnpm naraframe schema --json | node skills/naraframe/check-art-direction.mjs ../NaraFrame-projects/art-direction-patterns
```

These checks protect the six pattern structures and the number-box height regression; public validate and browser preflight still own complete schema and visual validation.
