# `angular-three-cannon/constraint`

This module provides functions to create physics constraints that link physics bodies in the Cannon.js physics world. These functions simplify the process of adding constraints between your 3D objects.

### Available `inject*` Functions

| Function             | Description                                                                                                                                                  | Arguments                        |
| :------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------- |
| `injectPointToPoint` | Creates a point-to-point constraint between two bodies. The constraint tries to keep the distance between the anchor points constant.                        | `objectA`, `objectB`, `getProps` |
| `injectConeTwist`    | Creates a cone-twist constraint between two bodies. The constraint attempts to keep the bodies aligned along a common axis, allowing swing and twist motion. | `objectA`, `objectB`, `getProps` |
| `injectDistance`     | Creates a distance constraint between two bodies. The constraint tries to keep the distance between the bodies' center of masses constant.                   | `objectA`, `objectB`, `getProps` |
| `injectLock`         | Creates a lock constraint between two bodies. The constraint completely locks the motion of one body relative to another.                                    | `objectA`, `objectB`, `getProps` |
| `injectHinge`        | Creates a hinge constraint between two bodies. The constraint allows for rotation around a shared axis, like a door hinge.                                   | `objectA`, `objectB`, `getProps` |

**All functions' `getProps` argument is a function that returns the properties of the constraint.**

### Simple Usage of `injectHinge()`

```typescript
import { Component, viewChild, ElementRef } from '@angular/core';
import { injectHinge } from 'angular-three-cannon/constraint';

@Component({
	template: `
		<ngt-mesh #mesh1>
			<ngt-box-geometry />
		</ngt-mesh>
		<ngt-mesh #mesh2>
			<ngt-box-geometry />
		</ngt-mesh>
	`,
})
export class HingedBoxes {
	mesh1 = viewChild.required<ElementRef<Mesh>>('mesh1');
	mesh2 = viewChild.required<ElementRef<Mesh>>('mesh2');

	constructor() {
		// Create a hinge constraint between mesh1 and mesh2. Only works within <ngtc-physics>
		injectHinge(this.mesh1, this.mesh2, () => ({
			pivotA: [0, 0.5, 0], // hinge location on the first body
			pivotB: [0, -0.5, 0], // hinge location on the second body
			axisA: [0, 1, 0], // axis of rotation on the first body
			axisB: [0, 1, 0], // axis of rotation on the second body
		}));
	}
}
```
