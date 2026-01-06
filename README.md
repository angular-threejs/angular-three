# Angular Three workspace

## Versioning

Angular Three follows a modified semantic versioning scheme to balance stability with the fast-paced Three.js ecosystem:

| Version           | Meaning                                                                                              | Examples          |
| ----------------- | ---------------------------------------------------------------------------------------------------- | ----------------- |
| **Patch** (x.x.X) | Bug fixes and new features. **No breaking changes ever.**                                            | `4.0.0` → `4.0.1` |
| **Minor** (x.X.0) | Breaking changes for Three.js version bumps, or Angular minor updates that require breaking changes. | `4.0.x` → `4.1.0` |
| **Major** (X.0.0) | True breaking changes: API changes, Angular major bumps, or other peer dependency major bumps.       | `4.x.x` → `5.0.0` |

> **Why this approach?**
> Three.js releases frequently, and following true semver would exhaust major version numbers quickly. By using minor versions for Three.js breaking changes, we maintain a practical versioning scheme while clearly communicating compatibility boundaries.

## Netlify Status

- Angular Three: [![Angular Three Netlify Status](https://api.netlify.com/api/v1/badges/63a4face-28af-41d4-8b42-003c80c8cff0/deploy-status)](https://app.netlify.com/sites/angularthree/deploys)
- Angular Three Demo: [![Angular Three Demo Netlify Status](https://api.netlify.com/api/v1/badges/c3dec680-1621-4a7c-a136-5be24c288019/deploy-status)](https://app.netlify.com/sites/angularthreedemo/deploys)
- Angular Three Soba: [![Angular Three Soba Netlify Status](https://api.netlify.com/api/v1/badges/9e72d542-fccd-45cb-98c7-5336ccb82ec3/deploy-status)](https://app.netlify.com/sites/angularthreesoba/deploys)

Here, you'll find the source code for the entire `angular-three` ecosystem, the documentation, and the examples.

## Documentation

The documentation is available at [angularthree.org](https://angularthree.org).

## Examples

The examples are available at [demo.angularthree.org](https://demo.angularthree.org).

## Packages

| Package                                                         | Description                                        |
| --------------------------------------------------------------- | -------------------------------------------------- |
| [angular-three](./libs/core/README.md)                          | Core library - Angular renderer for Three.js       |
| [angular-three-soba](./libs/soba/README.md)                     | Helpers, abstractions, and ready-to-use components |
| [angular-three-cannon](./libs/cannon/README.md)                 | Cannon.js physics integration                      |
| [angular-three-rapier](./libs/rapier/README.md)                 | Rapier physics integration                         |
| [angular-three-postprocessing](./libs/postprocessing/README.md) | Post-processing effects                            |
| [angular-three-theatre](./libs/theatre/README.md)               | Theatre.js animation integration                   |
| [angular-three-tweakpane](./libs/tweakpane/README.md)           | Tweakpane debug controls                           |
| [angular-three-plugin](./libs/plugin/README.md)                 | Nx plugin with generators and utilities            |
