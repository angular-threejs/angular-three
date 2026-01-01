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
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { extend, NgtArgs } from 'angular-three';
import { NgtrPhysics, NgtrRigidBody } from 'angular-three-rapier';
import * as THREE from 'three';

extend(THREE);

@Component({
	selector: 'app-box',
	template: `
		<ngt-object3D rigidBody [position]="[0, 5, 0]">
			<ngt-mesh>
				<ngt-box-geometry />
				<ngt-mesh-standard-material color="hotpink" />
			</ngt-mesh>
		</ngt-object3D>
	`,
	imports: [NgtrRigidBody],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Box {}

@Component({
	selector: 'app-ground',
	template: `
		<ngt-object3D rigidBody="fixed" [position]="[0, -1, 0]">
			<ngt-mesh>
				<ngt-box-geometry *args="[20, 1, 20]" />
				<ngt-mesh-standard-material color="gray" />
			</ngt-mesh>
		</ngt-object3D>
	`,
	imports: [NgtrRigidBody, NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Ground {}

@Component({
	template: `
		<ngtr-physics [options]="{ gravity: [0, -9.81, 0] }">
			<ng-template>
				<app-box />
				<app-ground />
			</ng-template>
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

## Rigid Body

Use `ngt-object3D` with the `rigidBody` attribute. The rigid body type is specified as the attribute value:

```html
<!-- Dynamic (default when empty) -->
<ngt-object3D rigidBody [position]="[0, 5, 0]">
	<ngt-mesh>...</ngt-mesh>
</ngt-object3D>

<!-- Fixed (static) -->
<ngt-object3D rigidBody="fixed" [position]="[0, -1, 0]">
	<ngt-mesh>...</ngt-mesh>
</ngt-object3D>

<!-- Kinematic -->
<ngt-object3D rigidBody="kinematicPosition">
	<ngt-mesh>...</ngt-mesh>
</ngt-object3D>
```

### Rigid Body Types

- `''` or `'dynamic'` - Affected by forces and collisions
- `'fixed'` - Static, immovable body
- `'kinematicPosition'` - Controlled by position, affects dynamic bodies
- `'kinematicVelocity'` - Controlled by velocity, affects dynamic bodies

### Rigid Body Options

```html
<ngt-object3D
	rigidBody
	[options]="{
		colliders: 'ball',
		ccd: true,
		gravityScale: 0.5,
		linearVelocity: [0, 10, 0],
		angularVelocity: [0, 1, 0]
	}"
>
	...
</ngt-object3D>
```

### Rigid Body Events

```html
<ngt-object3D
	rigidBody
	(collisionEnter)="onCollisionEnter($event)"
	(collisionExit)="onCollisionExit($event)"
	(intersectionEnter)="onIntersectionEnter($event)"
	(intersectionExit)="onIntersectionExit($event)"
	(contactForce)="onContactForce($event)"
	(sleep)="onSleep()"
	(wake)="onWake()"
>
	...
</ngt-object3D>
```

## Colliders

Colliders use `ngt-object3D` with specific collider attributes. By default, rigid bodies auto-generate colliders from child meshes.

### Explicit Colliders

```html
<!-- Ball collider -->
<ngt-object3D [ballCollider]="[0.5]" [position]="[0, 2, 0]" />

<!-- Cuboid collider (half-extents) -->
<ngt-object3D [cuboidCollider]="[1, 0.5, 2]" [position]="[0, 0, 0]" />

<!-- Capsule collider (half-height, radius) -->
<ngt-object3D [capsuleCollider]="[0.5, 0.25]" [position]="[0, 1, 0]" />

<!-- Cylinder collider (half-height, radius) -->
<ngt-object3D [cylinderCollider]="[1, 0.5]" />

<!-- Cone collider (half-height, radius) -->
<ngt-object3D [coneCollider]="[1, 0.5]" />
```

### Available Collider Directives

| Directive                   | Args                              | Description         |
| --------------------------- | --------------------------------- | ------------------- |
| `NgtrBallCollider`          | `[radius]`                        | Sphere shape        |
| `NgtrCuboidCollider`        | `[halfW, halfH, halfD]`           | Box shape           |
| `NgtrCapsuleCollider`       | `[halfHeight, radius]`            | Capsule shape       |
| `NgtrCylinderCollider`      | `[halfHeight, radius]`            | Cylinder shape      |
| `NgtrConeCollider`          | `[halfHeight, radius]`            | Cone shape          |
| `NgtrConvexHullCollider`    | `[vertices]`                      | Convex hull         |
| `NgtrTrimeshCollider`       | `[vertices, indices]`             | Triangle mesh       |
| `NgtrHeightfieldCollider`   | `[width, height, heights, scale]` | Terrain heightfield |
| `NgtrRoundCuboidCollider`   | `[halfW, halfH, halfD, radius]`   | Rounded box         |
| `NgtrRoundCylinderCollider` | `[halfH, radius, borderRadius]`   | Rounded cylinder    |
| `NgtrRoundConeCollider`     | `[halfH, radius, borderRadius]`   | Rounded cone        |

### Disabling Auto-Colliders

```html
<ngt-object3D rigidBody [options]="{ colliders: false }">
	<!-- Manual colliders only -->
	<ngt-object3D [ballCollider]="[0.5]" />
</ngt-object3D>
```

### Mesh Collider

Generate colliders from mesh geometry:

```html
<ngt-object3D rigidBody [options]="{ colliders: false }">
	<ngt-object3D [meshCollider]="'trimesh'">
		<ngt-mesh>
			<ngt-torus-geometry />
			<ngt-mesh-standard-material />
		</ngt-mesh>
	</ngt-object3D>
</ngt-object3D>
```

## Joints

Create joints between rigid bodies using injectable functions:

```typescript
import { Component, viewChild } from '@angular/core';
import {
	NgtrRigidBody,
	sphericalJoint,
	revoluteJoint,
	prismaticJoint,
	fixedJoint,
	ropeJoint,
	springJoint,
} from 'angular-three-rapier';

@Component({
	template: `
		<ngt-object3D rigidBody="fixed" #bodyA="rigidBody">...</ngt-object3D>
		<ngt-object3D rigidBody #bodyB="rigidBody">...</ngt-object3D>
	`,
})
export class JointExample {
	bodyA = viewChild.required<NgtrRigidBody>('bodyA');
	bodyB = viewChild.required<NgtrRigidBody>('bodyB');

	// Spherical joint (ball-and-socket)
	joint = sphericalJoint(
		() => this.bodyA().rigidBody(),
		() => this.bodyB().rigidBody(),
		{
			data: {
				body1Anchor: [0, -0.5, 0],
				body2Anchor: [0, 0.5, 0],
			},
		},
	);

	// Revolute joint (hinge) with limits
	hingeJoint = revoluteJoint(
		() => this.bodyA().rigidBody(),
		() => this.bodyB().rigidBody(),
		{
			data: {
				body1Anchor: [0, 0, 0],
				body2Anchor: [0, 1, 0],
				axis: [0, 1, 0],
				limits: [-Math.PI / 2, Math.PI / 2],
			},
		},
	);

	// Prismatic joint (slider)
	sliderJoint = prismaticJoint(
		() => this.bodyA().rigidBody(),
		() => this.bodyB().rigidBody(),
		{
			data: {
				body1Anchor: [0, 0, 0],
				body2Anchor: [2, 0, 0],
				axis: [1, 0, 0],
				limits: [-1, 1],
			},
		},
	);

	// Rope joint (max distance constraint)
	rope = ropeJoint(
		() => this.bodyA().rigidBody(),
		() => this.bodyB().rigidBody(),
		{
			data: {
				body1Anchor: [0, 0, 0],
				body2Anchor: [0, 0, 0],
				length: 5,
			},
		},
	);

	// Spring joint
	spring = springJoint(
		() => this.bodyA().rigidBody(),
		() => this.bodyB().rigidBody(),
		{
			data: {
				body1Anchor: [0, 0, 0],
				body2Anchor: [0, 0, 0],
				restLength: 2,
				stiffness: 100,
				damping: 10,
			},
		},
	);
}
```

## Instanced Rigid Bodies

For efficient physics with many identical objects:

```typescript
import { NgtArgs } from 'angular-three';
import { NgtrInstancedRigidBodies } from 'angular-three-rapier';

@Component({
	template: `
		<ngt-object3D [instancedRigidBodies]="instances">
			<ngt-instanced-mesh [count]="instances.length" castShadow>
				<ngt-sphere-geometry *args="[0.5]" />
				<ngt-mesh-standard-material color="orange" />
			</ngt-instanced-mesh>
		</ngt-object3D>
	`,
	imports: [NgtrInstancedRigidBodies, NgtArgs],
})
export class Spheres {
	instances = Array.from({ length: 100 }, (_, i) => ({
		key: i,
		position: [Math.random() * 10, Math.random() * 10, 0] as [number, number, number],
	}));
}
```

## Interaction Groups

Filter collisions between objects:

```typescript
import { interactionGroups } from 'angular-three-rapier';

// Member of group 0, collides with groups 0 and 1
const groups = interactionGroups([0], [0, 1]);
```

```html
<!-- Using directive -->
<ngt-object3D rigidBody [interactionGroups]="[[0], [0, 1]]">...</ngt-object3D>
```

## Physics Hooks

```typescript
import { beforePhysicsStep, afterPhysicsStep } from 'angular-three-rapier';

@Component({...})
export class MyComponent {
	constructor() {
		beforePhysicsStep((world) => {
			// Run before each physics step
		});

		afterPhysicsStep((world) => {
			// Run after each physics step
		});
	}
}
```

## Debug Visualization

Enable debug rendering via physics options:

```html
<ngtr-physics [options]="{ debug: true }">
	<ng-template>
		<!-- your physics objects -->
	</ng-template>
</ngtr-physics>
```

## Addons

### Attractor

Apply gravitational or magnetic forces:

```typescript
import { NgtrAttractor } from 'angular-three-rapier/addons';
```

```html
<!-- Attractor -->
<ngt-object3D attractor [options]="{ strength: 10, range: 20, type: 'linear' }" />

<!-- Repeller (negative strength) -->
<ngt-object3D attractor [options]="{ strength: -10, range: 15 }" [position]="[5, 0, 0]" />

<!-- Newtonian gravity -->
<ngt-object3D
	attractor
	[options]="{
		strength: 1000,
		range: 50,
		type: 'newtonian',
		gravitationalConstant: 0.01
	}"
/>
```
