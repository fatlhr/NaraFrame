---
name: naraframe-story
description: Create or revise a NaraFrame character story that carries actions and props across shots when explicitly invoked.
disable-model-invocation: true
argument-hint: "[video brief]"
---

# Story

Use the brief and the character workflow in the sibling `naraframe/characters.md`. Select `story@0.2.0` and the matching catalog at `library/characters/story/catalog.json` inside the engine. An existing episode keeps the version in its profile lock.

Show a goal, obstacle, action, and consequence. Carry the character pose and prop state across each cut. Pair `note-gust` with `note-catch`, or `puddle-stop` with `puddle-cross`, all at `0.1.0`. For a nearly still story told by a screen or a light, use `phone-glow` and `porch-light` at `0.2.0`, alone or as a pair, or build shots from their faceless rig with the poses in *Story rig* in the sibling `naraframe/characters.md`. They take colours instead of a title: keep the same colours for one character in every shot. Use a shared title within the pair and describe the handoff in the shot notes. For another brief, draw original poses and review the frames on either side of the cut. For breath, overshoot, light changes and pose changes at a cut, follow *Nearly still characters* in the sibling `naraframe/authoring.md`.

For a dressed two-arm stickman stopping a door for a kitten, import `place-prop`, `prop-braces`, and `let-them-in` at `0.1.0` from `library/characters/story-prop-contact/catalog.json`. Each takes `prop` (`boot` or `crate`) and `note`; keep the prop identical across the sequence. The close-up includes anticipation, compression, damped rebound and a held pose before the kitten reveal. Stage through the existing library workflow, then guarded edit and preview. This is a local editable story pattern, not a walking rig. For another prop interaction, `library/motion/impact-settle.mjs` expands contact timing into ordinary beats with configurable target IDs, FPS, contact frame and hold length; adjust the contact geometry to the actual artwork.
