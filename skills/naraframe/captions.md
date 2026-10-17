# Captions without changing narration

Choose captions for the viewer, not because speech automatically needs another full paragraph on screen. `full` is useful when viewers may watch muted. `selected` can reinforce a key phrase without competing with the main composition. `none` leaves the frame to explanatory objects or deliberate on-screen copy. Keep accessibility and the publishing context in the brief; none does not supply an alternative transcript by itself.

The spoken text stays in `narration.json`. Caption display corrections, policy and selection live in `captions.json`:

```json
{
  "schemaVersion": 1,
  "corrections": [],
  "mode": "selected",
  "selections": [
    {"blockId": "intro", "phraseId": "point", "startOffsetMs": 300, "endOffsetMs": 1800}
  ]
}
```

Read the project's real phrase IDs/timing before adapting that example. Offsets are measured from the phrase start, not the scene start. Start is inclusive; end is exclusive and must lie inside the verified phrase. Omit both offsets for the whole phrase. Each phrase may appear once in the selection list. Empty selections under `selected` show no captions. They do not mean full. This is phrase/local timing, not word synchronization; do not guess a spoken word boundary from punctuation.

Mode precedence: source `captions.json.mode`, then pinned profile `render.captions.mode`, then legacy `full`. `none` produces no caption glyph, scrim or caption preflight region. Narration/audio/timing remain present. Existing projects without a policy keep full captions. A profile lock on `render.captions` or `render.captions.mode` refuses a differing source mode even in a draft or scoped preview. Unknown/stale selections and invalid windows must be repaired, including when the current mode is none/full. A planned block without measured phrases cannot supply selections.

Profile caption styling remains under `render.captions`: `fontSize` in design pixels, `maxLines`, `bottomOffset` above the bottom safe zone, `sideOffset` inside the left safe inset, `scrimOpacity` from 0 to 1, and `lineHeight` as a font-size multiplier. Legacy defaults are 44, 2, 24, 48, 0.72 and 1.3. The family, heading weight and colors come from profile typography/palette. Use ordinary `naraframe.json.overrides` only for paths the profile allows; its locks still apply. Do not change the shared profile or pinned lock secretly to bypass a constraint.

“Hide the subtitles, keep the voice”: stage `captions.json` with mode none and retained corrections/selection records, then `status` → `edit --from STAGING --expect REVISION` → `validate --stage plan` → `preview --draft` → inspect returned artifacts. “Show only the main point”: use mode selected and the actual measured phrase target. “Remove the dark box”: an allowed override of `render.captions.scrimOpacity` to 0 removes the scrim, not the text or its collision region. “Give captions more space”: revise allowed side/bottom/font/line-height settings, then inspect both draft and `preview --resolution 1080`.

Save the initial build/source before revisions. Check the cue's first frame, last visible frame, gap and next phrase, not only the contact sheet. Frame rounding follows the project's fps; scoped cues are clipped from the same global frame windows when the whole timeline is measured. A caption revision changes visual keys, not the voice generation key or master. `undo` restores the prior source; confirm `reusedFromBuildId` rather than assuming reuse.

`validate --stage plan` checks policy, references, windows, schema and locks. It cannot measure fonts. Preview/render preflight measures and wraps actual caption text with the rendered style, checks overflow, off-canvas boxes and overlap with scene text. Use the issue path to repair source/style; do not hide text with invisible characters or shift it off screen. A valid plan can still fail preflight. Caption selection does not shorten or rewrite spoken content. Changing narration remains a separate audio task.
