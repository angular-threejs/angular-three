# angular-three-rapier/addons

Secondary entry point of `angular-three-rapier`. It can be used by importing from `angular-three-rapier/addons`.

## Installation

This package requires `angular-three-rapier` as a peer dependency.

```bash
npm install angular-three-rapier @dimforge/rapier3d-compat
```

## NgtrAttractor

A directive that creates a gravitational attractor point in the physics world. All dynamic rigid bodies within range will be attracted (or repelled) towards this point.

### Basic Usage

```html
<!-- Simple attractor at origin -->
<ngt-object3D attractor [options]="{ strength: 5, range: 20 }" />

<!-- Repeller (negative strength) -->
<ngt-object3D attractor [options]="{ strength: -10, range: 15 }" [position]="[5, 0, 0]" />
```

### Gravity Types

The attractor supports three different gravity calculation models:

```html
<!-- Static: Constant force regardless of distance -->
<ngt-object3D attractor [options]="{ type: 'static', strength: 5, range: 20 }" />

<!-- Linear: Force increases as objects get closer -->
<ngt-object3D attractor [options]="{ type: 'linear', strength: 5, range: 20 }" />

<!-- Newtonian: Realistic inverse-square law (like real gravity) -->
<ngt-object3D
	attractor
	[options]="{
  type: 'newtonian',
  strength: 1000,
  range: 50,
  gravitationalConstant: 0.01
}"
/>
```

### Options

| Option                  | Type                                  | Default     | Description                                                                   |
| ----------------------- | ------------------------------------- | ----------- | ----------------------------------------------------------------------------- |
| `strength`              | `number`                              | `1`         | Force strength. Positive attracts, negative repels.                           |
| `range`                 | `number`                              | `10`        | Effective range in world units. Objects outside this range are unaffected.    |
| `type`                  | `'static' \| 'linear' \| 'newtonian'` | `'static'`  | Gravity calculation model.                                                    |
| `gravitationalConstant` | `number`                              | `6.673e-11` | Gravitational constant for newtonian type.                                    |
| `collisionGroups`       | `InteractionGroups`                   | `undefined` | Limits which rigid bodies are affected. If unset, affects all dynamic bodies. |

### Gravity Type Details

- **static**: Constant force regardless of distance. Good for simple push/pull effects.
- **linear**: Force scales linearly with distance (closer = stronger). Provides smooth attraction.
- **newtonian**: Force follows Newton's law of universal gravitation (`F = G * m1 * m2 / r²`). Most realistic but can cause extreme forces at close range.

## applyAttractorForceOnRigidBody

A utility function for manually applying attractor forces to rigid bodies. Useful for custom physics behavior.

### Usage

```typescript
import { applyAttractorForceOnRigidBody } from 'angular-three-rapier/addons';
import { beforePhysicsStep } from 'angular-three-rapier';

// In your component
beforePhysicsStep((world) => {
	world.bodies.forEach((body) => {
		if (body.isDynamic()) {
			applyAttractorForceOnRigidBody(body, {
				object: attractorMesh, // THREE.Object3D position reference
				strength: 10,
				range: 20,
				type: 'newtonian',
				gravitationalConstant: 0.01,
			});
		}
	});
});
```

### Parameters

| Parameter                       | Type                       | Description                                            |
| ------------------------------- | -------------------------- | ------------------------------------------------------ |
| `rigidBody`                     | `RigidBody`                | The Rapier rigid body to apply force to.               |
| `options.object`                | `THREE.Object3D`           | Object3D whose world position is the attractor center. |
| `options.strength`              | `number`                   | Force strength (positive attracts, negative repels).   |
| `options.range`                 | `number`                   | Maximum distance for the force to apply.               |
| `options.type`                  | `NgtrAttractorGravityType` | Gravity calculation type.                              |
| `options.gravitationalConstant` | `number`                   | Gravitational constant for newtonian calculations.     |
| `options.collisionGroups`       | `InteractionGroups`        | Optional collision group filter.                       |

## Debug Visualization

When physics debug mode is enabled on `NgtrPhysics`, attractors automatically display debug visualization:

- Blue sphere with normals for attractors (positive strength)
- Red sphere with normals for repellers (negative strength)
- Normal length indicates the range
