# `angular-three-plugin`

Nx plugin for Angular Three providing generators and utilities for 3D application development.

## Documentation

All public APIs are documented with JSDoc comments. Your IDE will provide inline documentation, parameter hints, and examples as you code.

### Official Documentation

Please visit [Angular Three Documentation](https://angularthree.netlify.app)

## Installation

```bash
npm install -D angular-three-plugin
# yarn add -D angular-three-plugin
# pnpm add -D angular-three-plugin
```

## Generators

### `init`

Initializes Angular Three in your application. This generator:

- Installs `angular-three`, `three`, `@types/three`, and `ngxtension`
- Enables `skipLibCheck` in tsconfig for Three.js compatibility
- Adds `provideNgtRenderer()` to your application providers
- Optionally generates a starter SceneGraph component

```bash
nx g angular-three-plugin:init
```

Options:

| Option       | Description                              | Default           |
| ------------ | ---------------------------------------- | ----------------- |
| `sceneGraph` | How to generate the SceneGraph component | `'generate-only'` |

SceneGraph options:

- `append` - Append to parent component template
- `replace` - Replace parent component template
- `generate-only` - Generate component but don't modify template
- `none` - Don't generate a SceneGraph component

### `aux`

Adds auxiliary Angular Three packages to your project:

```bash
nx g angular-three-plugin:aux
```

Available packages:

- `angular-three-soba` - Utilities and abstractions
- `angular-three-rapier` - Rapier physics engine
- `angular-three-postprocessing` - Post-processing effects
- `angular-three-cannon` - Cannon.js physics engine
- `angular-three-tweakpane` - Tweakpane UI controls
- `angular-three-theatre` - Theatre.js animation toolkit

### `gltf`

Generates an Angular component from a GLTF/GLB 3D model:

```bash
nx g angular-three-plugin:gltf --modelPath=src/assets/model.glb --output=src/app/model.ts
```

Options:

| Option           | Description                             | Default   |
| ---------------- | --------------------------------------- | --------- |
| `modelPath`      | Path to GLTF/GLB model                  | Required  |
| `output`         | Output path for generated component     | Required  |
| `className`      | Component class name                    | `'Model'` |
| `selectorPrefix` | Component selector prefix               | `'app'`   |
| `draco`          | Use DracoLoader for compressed models   | `null`    |
| `shadows`        | Enable shadow casting/receiving         | `false`   |
| `transform`      | Transform meshes via gltf-transform     | `false`   |
| `instance`       | Instance re-occurring geometry          | `false`   |
| `bones`          | Layout bones declaratively              | `false`   |
| `console`        | Print output to console instead of file | `false`   |
