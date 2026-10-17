# Neutral local starter

Create an editable project and stage the bundled declarative path diagram. Replace ENGINE_ROOT with `data.resourceRoot` from `naraframe version --json`; use absolute paths outside the engine installation.

The packed engine also contains `starter/demo`, a complete silent source project made through the supported create path and the maintained `path-note` template. Copy that folder to a new project location and run `naraframe validate /absolute/path/copied-demo --stage plan --json`. It contains no rendered output, private media or imported approval.

```sh
naraframe create /absolute/path/episode --profile current-issues --json
naraframe library stage /absolute/path/episode --from ENGINE_ROOT/library/starter/catalog.json --pattern path-note --version 1.0.0 --scene neutral-path --instance neutral-path --params ENGINE_ROOT/starter/params.json --json
```

The returned staging path and expected source revision feed `naraframe edit`. This starter supplies neutral copy and supported declarative composition, with no private media, provider calls, imported trust or production approval. A newly created project still needs explicit audio intent and production validation before rendering. RIGHTS.json records the local candidate rights boundary.
