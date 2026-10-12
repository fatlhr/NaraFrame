# NaraFrame — Reusable Visual Asset System

Status: Approved production direction for the POLA-style explainer workflow. This document describes how assets should be prepared and reused; it does **not** claim new core capabilities have been implemented.

## 1. Goal

For recurring short-form explainers, generate the visual identity once, prepare it as a reusable asset pack, and let NaraFrame compose and animate those assets repeatedly across episodes.

The intended production model is:

```text
approved visual identity
→ reusable SVG/PNG asset pack
→ NaraFrame composition + native text/shape/path
→ semantic motion + camera
→ optional trusted Recipe for special scenes
→ preview / revise / render
```

Do **not** treat a finished style board or generated full-frame illustration as the production source. A flattened image can only move as one object. Production assets should be separated into reusable pieces that NaraFrame can compose independently.

## 2. Asset-first production strategy

The preferred workflow is to prepare the recurring visual library before producing episodes at scale.

Generate/design once:

- one approved character identity;
- a pose pack for that character;
- recurring props and product/object silhouettes;
- reaction marks and visual cues;
- common commerce/UI modules where useful;
- profile typography, palette, and illustration direction.

Reuse those assets in later projects instead of regenerating the visual identity per episode.

Benefits:

- consistent brand recognition;
- lower generation cost and latency;
- fewer visual inconsistencies between episodes;
- easier revisions because text, objects, and characters remain separate;
- more deterministic rendering;
- a smaller prompt/context burden for the production agent;
- higher reuse across evergreen and commerce formats.

Topic-specific assets may still be generated when the subject genuinely requires them, but recurring identity assets should come from the approved library first.

## 3. Character system

Use **one character identity with multiple reusable poses**, not one static image and not a complex skeletal rig.

Recommended minimum V1 pose pack:

```text
character/
├── neutral.svg
├── thinking.svg
├── surprised.svg
├── pointing.svg
├── phone.svg
├── shrug.svg
├── happy.svg
└── deadpan.svg
```

Optional later poses:

- holding-product;
- comparing-two-items;
- presenting;
- mild-regret / facepalm;
- walking/entering if a recurring scene proves it valuable.

The character is primarily a reaction/narrative device. The object, diagram, number, or evidence should usually remain the explanatory hero.

### Character animation model

Until part-level SVG targeting or lightweight rigging is intentionally implemented, prefer **pose-to-pose acting**:

```text
neutral
→ thinking
→ surprised
→ pointing
```

Use NaraFrame motion around each pose:

- position changes;
- scale changes;
- small rotation/tilt;
- reveal/exit;
- emphasize;
- camera framing;
- timing and holds.

A pose swap plus a small transform is preferred over pretending that one flat character image has articulated limbs.

## 4. Preferred asset format

### SVG first

Use SVG for recurring flat/geometric assets when possible because it is:

- resolution independent;
- lightweight;
- suitable for 1080×1920 output;
- reusable across different scene sizes;
- visually consistent with native NaraFrame text/shapes/paths.

Use PNG when the approved art style needs raster detail, texture, or an illustration that is not practical as vector artwork.

Production assets should remain clean at final native resolution. A high-resolution final does not create missing detail in a small raster source.

## 5. Reusable asset families

A practical starter library:

```text
assets/
├── character/
│   ├── neutral.svg
│   ├── thinking.svg
│   ├── surprised.svg
│   ├── pointing.svg
│   ├── phone.svg
│   ├── shrug.svg
│   ├── happy.svg
│   └── deadpan.svg
│
├── props/
│   ├── smartphone.svg
│   ├── manggo-book.svg
│   ├── magnifier.svg
│   ├── notebook.svg
│   ├── backpack.svg
│   ├── chair.svg
│   ├── shoe-runner.svg
│   ├── shopping-cart.svg
│   ├── review-stars.svg
│   ├── crowd.svg
│   └── storefront.svg
│
├── reactions/
│   ├── question.svg
│   ├── exclamation.svg
│   ├── burst.svg
│   ├── highlight-lines.svg
│   ├── spotlight-ring.svg
│   ├── check.svg
│   └── cross.svg
│
└── ui/
    ├── product-card.svg
    ├── review-card.svg
    ├── price-card.svg
    ├── verdict-badge.svg
    └── comparison-frame.svg
```

The exact file list may evolve from production evidence. Do not generate every conceivable prop upfront; prioritize assets that recur across multiple episode ideas.

## 6. Compose UI and commerce scenes instead of flattening them

A commerce card such as:

```text
SEPATU RUNNER
★★★★★
Rp299.000
```

should preferably be composed from:

```text
shape/background
+ product SVG/PNG
+ native NaraFrame text
+ stars / badge assets
+ price text
```

rather than one flattened screenshot.

This allows independent animation of:

- review count;
- price;
- product;
- verdict;
- comparison state;
- CTA or supporting evidence.

This is particularly important for recurring formats such as **Emang Ngaruh?**.

## 7. Motion vocabulary mapping

The approved visual style should be animated using a small repeatable vocabulary rather than random effects.

| Visual behavior | Intended NaraFrame implementation |
| --- | --- |
| Signal Pop | `reveal` + `emphasize` |
| Pattern Connect | `path` + `draw` |
| Living Number | `count` + `emphasize` |
| Object Relay | `transform` + scene transition / match cut where appropriate |
| Camera Reveal | explicit camera move / focus |
| Metaphor Cut | `exit` + `reveal`, mask/match-cut where available |
| Deadpan Hold | static pose + deliberate timing hold |
| Character Reaction | pose swap + bounded transform |

The purpose of motion is to direct attention or reveal the mechanism. Movement without explanatory value is noise.

## 8. Example: Scarcity Magnet

### SHOW

- shoe/product is already visible;
- neutral character enters or is framed beside it.

### TWIST

- `TINGGAL 2` appears;
- label receives a short emphasize beat;
- character changes from neutral to surprised/thinking.

### PLAY

- draw a path from people/character toward the product;
- move an object/person along that path where useful;
- optional reaction marks reinforce the pull without requiring physical simulation.

### REVEAL

- camera reframes or pulls out;
- the scene resolves into a simple explanatory pattern such as:

```text
SCARCITY
↓
PERCEIVED VALUE ↑
```

The metaphor comes from composition and movement. It does not require real magnet physics.

## 9. Example: Social Proof Crowd

Use simple reusable person/crowd assets or native shapes, then combine them with paths, groups, and camera movement.

```text
WARUNG A        WARUNG B
   ●            ● ● ● ●
                ● ● ●
```

A new viewer/character arrives, hesitates, then joins the crowded option. The camera can later reveal the crowd as a signal rather than merely background decoration.

Until a repeater/stagger primitive exists, choose one of these routes:

1. use a prepared crowd SVG when individual motion is unnecessary;
2. declare a small bounded set of people as independent layers;
3. use a trusted Recipe when the scene genuinely needs many staggered instances.

Do not create dozens of individually authored layers when one reusable crowd representation explains the same idea.

## 10. Example: Price Anchor

Price/number scenes are a strong native fit because text remains editable.

```text
Rp299.000
↓
Rp99.000
```

Use scale, hierarchy, timing, camera focus, and optional `count` behavior to make the first number visually establish the reference point before the second price appears.

Prefer native text to a raster image of the price.

## 11. Normal scene vs Recipe

Use standard declarative scenes for the majority of production.

Good standard-scene candidates:

- character reaction;
- product comparison;
- price/number storytelling;
- paths and connections;
- labels and evidence;
- simple crowd arrangements;
- camera reframing;
- pose-based character storytelling.

Use a trusted Recipe only when a recurring shot cannot be expressed cleanly with normal layers/beats, for example:

- large staggered crowd behavior;
- complex product carousel;
- realistic UI scrolling;
- custom particle/physics treatment;
- advanced morph illusion;
- a signature composition that is reused enough to justify dedicated code.

Recipes are an escape hatch for reusable special behavior, not the default for every scene.

## 12. Current limitations to design around

The approved asset system is compatible with NaraFrame's current direction, but the following should not be assumed to exist merely because the visual board suggests them:

### Character limb animation

Do not assume skeletal animation. Use pose assets until a lightweight part-targeting/rig contract is deliberately implemented.

### Large crowd stagger

Use a crowd asset, a bounded number of layers, or a Recipe until repeater/stagger becomes a native capability.

### Spring / bounce / overshoot

Use current deterministic easing/transform sequences for now. A future spring/overshoot capability would improve playful settling and object personality.

### Arbitrary shape morph

Simulate transitions with exit/reveal, scale, overlap, masks, or match cuts unless a dedicated morph capability is implemented.

### Video footage

Do not assume video-layer support until the engine explicitly advertises and tests it.

## 13. Recommended visual-vocabulary roadmap

For the POLA-style playful explainer workflow, the most useful future additions are ordered by expected production impact:

1. **Spring / Overshoot** — immediately improves character reactions, object personality, signal pops, and playful settling.
2. **Repeater / Stagger** — makes crowds, review groups, repeated icons, notifications, and social simulations cheap to author.
3. **Persistent Object Across Scenes** — lets one hero object carry continuity while the world/context changes around it.
4. **Layer Mask** — enables spotlight, reveal, before/after, magnifier, x-ray, and richer metaphor transitions.
5. **Video Layer** — enables viral clips, screen recordings, product footage, and current-event evidence inside the same branded composition system.

These are recommendations for later implementation prioritization, not claims about current availability.

## 14. Quality rule

The production rule for recurring content is:

> **Generate identity once; compose it many times.**

A recurring episode should prefer:

```text
CHARACTER / PROP ASSET PACK
+ NATIVE TEXT / SHAPE / PATH
+ NARAFRAME MOTION / CAMERA
+ SPECIAL RECIPE ONLY WHEN NEEDED
```

over generating a new flattened scene for every shot.

This keeps output lightweight, HD, reusable, revision-friendly, and recognizably part of the same visual brand.
