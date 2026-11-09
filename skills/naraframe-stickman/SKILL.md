---
name: naraframe-stickman
description: Create or revise a NaraFrame episode in Stickman Ink when explicitly invoked.
disable-model-invocation: true
argument-hint: "[video brief]"
---

# Stickman Ink

Use the attached brief and the character workflow in the sibling `naraframe/characters.md`. Select profile `stickman-ink@0.2.0` and the matching catalog at `library/characters/stickman-ink/catalog.json` inside the engine. An existing episode keeps the version in its profile lock.

Make the body explain the change. Show the weight shift, hand contact and reaction in that order when the story calls for a prop interaction. Use `ink-notice`, `ink-grip-pull` or `ink-release` at version `0.1.0` when the action fits. For a figure that bends at its joints and changes expression, use `ink-heave` and `ink-cheer` at `0.2.0`, or build shots from their rig with the poses in *Stickman rig* in the sibling `naraframe/characters.md`. For a different action, use the pinned direction to stage a new shot.
