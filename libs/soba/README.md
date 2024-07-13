# `angular-three-soba`

`angular-three-soba` provides a comprehensive set of utilities and abstractions for building 3D applications with Angular Three. It offers components and helpers for various aspects of your projects, including cameras, controls, loaders, materials, shaders, and more. These components are ported from the popular React Three Fiber [`drei`](https://github.com/pmndrs/drei) library, making it easier for developers familiar with `drei` to leverage its functionality within the Angular ecosystem.

## Installation

```bash
npm install angular-three-soba three-stdlib
# yarn add angular-three-soba three-stdlib
# pnpm add angular-three-soba three-stdlib
```

> There are more peer dependencies that the consumers might need to install separately based on the secondary entry points that they pull in. Check the secondary entry points documentation for more information.

## Secondary Entry Points

`angular-three-soba` is organized into multiple secondary entry points, each focusing on a specific area of functionality. This modular structure allows you to import only the components you need, keeping your project lean and efficient.

### `angular-three-soba/abstractions`

Provides abstract components and patterns for building reusable and composable 3D elements in Angular Three.

[Read more about `angular-three-soba/abstractions`](./abstractions/README.md)

### `angular-three-soba/cameras`

Offers a variety of camera components, including specialized cameras like the `CubeCamera`, `OrthographicCamera`, and `PerspectiveCamera`, as well as helper components for camera controls.

[Read more about `angular-three-soba/cameras`](./cameras/README.md)

### `angular-three-soba/controls`

Includes components for user interaction and camera manipulation, such as the `OrbitControls`, `PointerLockControls`, and `TransformControls`.

[Read more about `angular-three-soba/controls`](./controls/README.md)

### `angular-three-soba/loaders`

Provides loaders for different types of 3D assets, including GLTF, texture, cube texture, HDR, and more.

[Read more about `angular-three-soba/loaders`](./loaders/README.md)

### `angular-three-soba/materials`

Offers a collection of materials with advanced features, such as `MeshReflectorMaterial`, `PhysicalMaterial`, `ShaderMaterial`, and `NormalMaterial`.

[Read more about `angular-three-soba/materials`](./materials/README.md)

### `angular-three-soba/misc`

Contains miscellaneous components for various tasks, like the `Stats` component for displaying performance statistics, the `Shadow` component for rendering shadows, and the `Text` component for adding 3D text.

[Read more about `angular-three-soba/misc`](./misc/README.md)

### `angular-three-soba/shaders`

Includes shader components and utilities for creating custom shaders and post-processing effects.

[Read more about `angular-three-soba/shaders`](./shaders/README.md)

### `angular-three-soba/staging`

Provides helpful components for staging and managing 3D scenes, such as the `Environment` component for setting up environment lighting, the `Stage` component for creating a basic stage setup, and the `PresentationControls` component for interactive scene presentations.

[Read more about `angular-three-soba/staging`](./staging/README.md)
