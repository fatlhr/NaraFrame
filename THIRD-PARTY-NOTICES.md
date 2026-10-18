# Third-party notices

NaraFrame's own code is licensed under the MIT licence in [LICENSE](LICENSE). That licence covers only NaraFrame's code and the starter resources authored in this repository (the `current-issues` and `general-explainer` profiles, the library, the starter and the skill). It does not cover the packages below, and it does not change their terms. This file states facts about those terms; it is not legal advice. Read each licence yourself, or ask a lawyer, if your situation is unclear.

The published `naraframe` package does not contain any third-party package code. npm installs the packages below from the public registry when you install `naraframe`, each under its own licence.

## Remotion

NaraFrame renders video with Remotion. Remotion is not MIT-licensed.

- Packages: `remotion`, `@remotion/bundler`, `@remotion/cli` and `@remotion/renderer` carry `SEE LICENSE IN LICENSE.md` in their package metadata. `@remotion/layout-utils` and `@remotion/paths` are marked MIT.
- Free use: individuals, for-profit organisations with up to 3 employees, non-profit and not-for-profit organisations, and anyone evaluating Remotion before using it commercially.
- Company licence: required for organisations outside those groups. Prices and terms are at <https://www.remotion.pro/license>.
- Restriction: Remotion's licence does not allow copying or modifying Remotion code to sell, rent, license, relicense or sublicense your own derivative of Remotion.
- Where to read it: `LICENSE.md` inside each Remotion package under your `node_modules`, for example `node_modules/remotion/LICENSE.md`, and <https://www.remotion.pro/license>.
- NaraFrame's MIT licence does not grant a Remotion licence. Whether you need a company licence depends on you, not on NaraFrame.
- Remotion's platform packages (`@remotion/compositor-<platform>`, installed automatically for your operating system) contain prebuilt binaries, including FFmpeg libraries, used for rendering. They have no licence field in their package metadata; see Remotion's documentation and `remotion/THIRD_PARTY_LICENSES.md` for what Remotion states about them.

## Direct runtime dependencies

Versions are pinned exactly in the package metadata. Licences are taken from each package's own metadata at the pinned version.

| Package | Version | Licence |
| --- | --- | --- |
| `remotion` | 4.0.521 | SEE LICENSE IN LICENSE.md (Remotion licence) |
| `@remotion/bundler` | 4.0.521 | SEE LICENSE IN LICENSE.md (Remotion licence) |
| `@remotion/cli` | 4.0.521 | SEE LICENSE IN LICENSE.md (Remotion licence) |
| `@remotion/renderer` | 4.0.521 | SEE LICENSE IN LICENSE.md (Remotion licence) |
| `@remotion/layout-utils` | 4.0.521 | MIT |
| `@remotion/paths` | 4.0.521 | MIT |
| `react` | 19.2.8 | MIT |
| `react-dom` | 19.2.8 | MIT |
| `zod` | 4.5.4 | MIT |

These packages bring in further transitive dependencies. Their licences are recorded in the `node_modules` folder that npm creates.

## Tools you install yourself

NaraFrame does not bundle or download these. They run on your machine under their own licences.

- Chrome or Chromium, used by Remotion to draw frames.
- FFmpeg and FFprobe, used to prepare and check audio and video.
- A local font. The bundled profile names system fonts and ships none.

## Media

NaraFrame ships no stock footage, music, voices or fonts. The few example images in the library are technical schematics authored in this repository. Rendering a file is not permission to publish it: the rights to images, audio, footage and text you add stay with you and their owners.
