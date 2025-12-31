# `angular-three-rapier`

This library provides Rapier physics integration for Angular Three. [Rapier](https://rapier.rs/) is a fast, cross-platform physics engine written in Rust with JavaScript bindings.

## Documentation

All public APIs are documented with JSDoc comments. Your IDE will provide inline documentation, parameter hints, and examples as you code.

## Installation

```bash
npm install angular-three-rapier @dimforge/rapier3d-compat
# yarn add angular-three-rapier @dimforge/rapier3d-compat
# pnpm add angular-three-rapier @dimforge/rapier3d-compat
```

> Make sure to already have `angular-three` installed

## Usage

```typescript
import { Component, CUSTOM_ELEMENTS_SCHEMA, viewChild, ElementRef } from '@angular/core';
import { NgtrPhysics, NgtrRigidBody, NgtrCuboidCollider } from 'angular-three-rapier';
import { Mesh } from 'three';

@Component({
	selector: 'app-box',
	template: `
		<ngt-mesh ngtrRigidBody="dynamic" [position]="[0, 5, 0]">
			<ngt-box-geometry />
			<ngt-mesh-standard-material color="hotpink" />
		</ngt-mesh>
	`,
	imports: [NgtrRigidBody],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Box {}

@Component({
	selector: 'app-ground',
	template: `
		<ngt-mesh ngtrRigidBody="fixed" [position]="[0, -1, 0]">
			<ngt-box-geometry [args]="[20, 1, 20]" />
			<ngt-mesh-standard-material color="gray" />
		</ngt-mesh>
	`,
	imports: [NgtrRigidBody],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Ground {}

@Component({
	template: `
		<ngtr-physics [options]="{ gravity: [0, -9.81, 0] }">
			<app-box />
			<app-ground />
		</ngtr-physics>
	`,
	imports: [NgtrPhysics, Box, Ground],
})
export class SceneGraph {}
```

## Physics Options

| Property      | Description                                     | Default         |
| ------------- | ----------------------------------------------- | --------------- |
| `gravity`     | Gravity vector `[x, y, z]`                      | `[0, -9.81, 0]` |
| `colliders`   | Default collider type for rigid bodies          | `'cuboid'`      |
| `paused`      | Whether physics simulation is paused            | `false`         |
| `timeStep`    | Fixed timestep for physics simulation           | `1/60`          |
| `debug`       | Enable debug visualization                      | `false`         |
| `interpolate` | Enable transform interpolation                  | `true`          |
| `updateLoop`  | Update loop type: `'follow'` or `'independent'` | `'follow'`      |

## Rigid Body Types

- `'dynamic'` - Affected by forces and collisions
- `'fixed'` - Static, immovable body
- `'kinematicPosition'` - Controlled by position, affects dynamic bodies
- `'kinematicVelocity'` - Controlled by velocity, affects dynamic bodies

## Collider Types

Built-in collider directives:

- `NgtrCuboidCollider` - Box shape
- `NgtrBallCollider` - Sphere shape
- `NgtrCapsuleCollider` - Capsule shape
- `NgtrCylinderCollider` - Cylinder shape
- `NgtrConeCollider` - Cone shape
- `NgtrTrimeshCollider` - Triangle mesh (static only)
- `NgtrConvexHullCollider` - Convex hull
- `NgtrHeightfieldCollider` - Terrain heightfield

## Joints

Create joints between rigid bodies:

```typescript
import { fixedJoint, sphericalJoint, revoluteJoint, prismaticJoint } from 'angular-three-rapier';

// In your component
fixedJoint(bodyA, bodyB, {
	body1Anchor: [0, 0, 0],
	body2Anchor: [0, 1, 0],
});
```

## Debug Visualization

```html
<ngtr-physics>
	<ngtr-debug />
	<!-- your physics objects -->
</ngtr-physics>
```

## Addons

### Attractor

Apply gravitational or magnetic forces:

```typescript
import { NgtrAttractor } from 'angular-three-rapier/addons';
```

```html
<ngt-mesh ngtrAttractor [options]="{ strength: 10, range: 20, type: 'linear' }">
	<!-- attractor geometry -->
</ngt-mesh>
```
