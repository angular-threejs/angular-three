# `angular-three-cannon/body`

This module provides a set of custom injector functions to create physics bodies that link `ngt-*` objects in THREE.js with bodies in the Cannon.js physics world. These functions simplify the process of adding physics behavior to your 3D objects.

### Available `inject*` Functions

| Function                 | Description                                      | `getProps` Arguments                                                     | `object` Type |
| :----------------------- | :----------------------------------------------- | :----------------------------------------------------------------------- | :------------ |
| `injectBox`              | Creates a box-shaped physics body.               | `mass`, `position`, `args: [width, height, depth]`                       | `ElementRef`  |
| `injectConvexPolyhedron` | Creates a convex polyhedron-shaped physics body. | `mass`, `position`, `vertices`, `faces`                                  | `ElementRef`  |
| `injectCylinder`         | Creates a cylinder-shaped physics body.          | `mass`, `position`, `radiusTop`, `radiusBottom`, `height`, `numSegments` | `ElementRef`  |
| `injectHeightfield`      | Creates a heightfield-shaped physics body.       | `mass`, `position`, `data`, `elementSize`                                | `ElementRef`  |
| `injectParticle`         | Creates a particle physics body.                 | `mass`, `position`                                                       | `ElementRef`  |
| `injectPlane`            | Creates a plane-shaped physics body.             | `mass`, `position`                                                       | `ElementRef`  |
| `injectSphere`           | Creates a sphere-shaped physics body.            | `mass`, `position`, `radius`                                             | `ElementRef`  |
| `injectTrimesh`          | Creates a trimesh-shaped physics body.           | `mass`, `position`, `vertices`, `indices`                                | `ElementRef`  |
| `injectCompound`         | Creates a compound physics body.                 | `mass`, `position`, `shapes`                                             | `ElementRef`  |

**All functions also accept an optional `options` argument for additional customization.**

### Simple Usage of `injectBox()`

```typescript
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
		injectBox(() => ({ mass: 10000, position: [0, 0, 0], args: [1, 1, 1] }), this.mesh);
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
