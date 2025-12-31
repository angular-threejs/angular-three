# `angular-three-cannon/body`

This module provides functions to create physics bodies that link `ngt-*` objects in THREE.js with bodies in the Cannon.js physics world. These functions simplify the process of adding physics behavior to your 3D objects.

### Available Body Functions

| Function           | Description                                      | `args` Arguments                                 | `object` Type |
| :----------------- | :----------------------------------------------- | :----------------------------------------------- | :------------ |
| `box`              | Creates a box-shaped physics body.               | `[width, height, depth]`                         | `ElementRef`  |
| `convexPolyhedron` | Creates a convex polyhedron-shaped physics body. | `[vertices, faces]`                              | `ElementRef`  |
| `cylinder`         | Creates a cylinder-shaped physics body.          | `[radiusTop, radiusBottom, height, numSegments]` | `ElementRef`  |
| `heightfield`      | Creates a heightfield-shaped physics body.       | `[data, { elementSize }]`                        | `ElementRef`  |
| `particle`         | Creates a particle physics body.                 | (none)                                           | `ElementRef`  |
| `plane`            | Creates a plane-shaped physics body.             | (none)                                           | `ElementRef`  |
| `sphere`           | Creates a sphere-shaped physics body.            | `[radius]`                                       | `ElementRef`  |
| `trimesh`          | Creates a trimesh-shaped physics body.           | `[vertices, indices]`                            | `ElementRef`  |
| `compound`         | Creates a compound physics body.                 | (uses `shapes` property instead)                 | `ElementRef`  |

**All functions also accept an optional `options` argument for additional customization.**

### Simple Usage of `box()`

```typescript
import { Component, viewChild, ElementRef } from '@angular/core';
import { Mesh } from 'three';
import { NgtcPhysics } from 'angular-three-cannon';
import { box } from 'angular-three-cannon/body';

@Component({
	template: `
		<ngt-mesh #mesh>
			<ngt-box-geometry />
		</ngt-mesh>
	`,
})
export class Box {
	mesh = viewChild.required<ElementRef<Mesh>>('mesh');

	constructor() {
		// Make this mesh a Box body in Physics. Only works within ngtc-physics
		box(() => ({ mass: 10000, position: [0, 0, 0], args: [1, 1, 1] }), this.mesh);
	}
}

@Component({
	template: `
		<ngtc-physics>
			<app-box />
		</ngtc-physics>
	`,
	imports: [NgtcPhysics, Box],
})
export class SceneGraph {}
```

### Deprecated Functions

The following `inject*` functions are deprecated and will be removed in v5.0.0. Use the new function names instead:

| Deprecated               | Use Instead        |
| :----------------------- | :----------------- |
| `injectBox`              | `box`              |
| `injectConvexPolyhedron` | `convexPolyhedron` |
| `injectCylinder`         | `cylinder`         |
| `injectHeightfield`      | `heightfield`      |
| `injectParticle`         | `particle`         |
| `injectPlane`            | `plane`            |
| `injectSphere`           | `sphere`           |
| `injectTrimesh`          | `trimesh`          |
| `injectCompound`         | `compound`         |
