# `angular-three-cannon/constraint`

This module provides functions to create physics constraints that link physics bodies in the Cannon.js physics world. These functions simplify the process of adding constraints between your 3D objects.

### Available Constraint Functions

| Function       | Description                                                                                                                                                  |
| :------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pointToPoint` | Creates a point-to-point constraint between two bodies. The constraint tries to keep the distance between the anchor points constant.                        |
| `coneTwist`    | Creates a cone-twist constraint between two bodies. The constraint attempts to keep the bodies aligned along a common axis, allowing swing and twist motion. |
| `distance`     | Creates a distance constraint between two bodies. The constraint tries to keep the distance between the bodies' center of masses constant.                   |
| `lock`         | Creates a lock constraint between two bodies. The constraint completely locks the motion of one body relative to another.                                    |
| `hinge`        | Creates a hinge constraint between two bodies. The constraint allows for rotation around a shared axis, like a door hinge.                                   |

**All functions take `bodyA`, `bodyB`, and an optional `options` object as arguments.**

### Simple Usage of `hinge()`

```typescript
import { Component, viewChild, ElementRef } from '@angular/core';
import { Mesh } from 'three';
import { hinge } from 'angular-three-cannon/constraint';

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
		hinge(this.mesh1, this.mesh2, {
			options: {
				pivotA: [0, 0.5, 0], // hinge location on the first body
				pivotB: [0, -0.5, 0], // hinge location on the second body
				axisA: [0, 1, 0], // axis of rotation on the first body
				axisB: [0, 1, 0], // axis of rotation on the second body
			},
		});
	}
}
```

### Constraint Options

All constraint functions accept an optional third argument with the following properties:

```typescript
interface NgtcConstraintOptions {
	injector?: Injector; // Angular injector for dependency injection
	disableOnStart?: boolean; // Whether to create the constraint disabled (default: false)
	options?: ConstraintSpecificOptions; // Constraint-specific configuration
}
```

### Deprecated Functions

The following `inject*` functions are deprecated and will be removed in v5.0.0. Use the new function names instead:

| Deprecated           | Use Instead    |
| :------------------- | :------------- |
| `injectPointToPoint` | `pointToPoint` |
| `injectConeTwist`    | `coneTwist`    |
| `injectDistance`     | `distance`     |
| `injectLock`         | `lock`         |
| `injectHinge`        | `hinge`        |
