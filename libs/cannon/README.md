# `angular-three-cannon`

This library is a wrapper around the [Cannon.js](https://schteppe.github.io/cannon.js/) physics engine for use with Angular Three.

## Documentation

All public APIs are documented with JSDoc comments. Your IDE will provide inline documentation, parameter hints, and examples as you code.

## Installation

```bash
npm install angular-three-cannon cannon-es @pmndrs/cannon-worker-api
# yarn add angular-three-cannon cannon-es @pmndrs/cannon-worker-api
# pnpm add angular-three-cannon cannon-es @pmndrs/cannon-worker-api
```

> Make sure to already have `angular-three` installed

## Usage

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

### Options

The `NgtcPhysics` component accepts an `options` input with the following properties:

```html
<ngtc-physics [options]="{ gravity: [0, -9.81, 0], iterations: 10 }">
	<!-- Physics bodies here -->
</ngtc-physics>
```

| Property                 | Type                     | Default                             |
| ------------------------ | ------------------------ | ----------------------------------- |
| `allowSleep`             | `boolean`                | `false`                             |
| `axisIndex`              | `0 \| 1 \| 2`            | `0`                                 |
| `broadphase`             | `'Naive' \| 'SAP'`       | `'Naive'`                           |
| `defaultContactMaterial` | `ContactMaterialOptions` | `{ contactEquationStiffness: 1e6 }` |
| `frictionGravity`        | `Vector3 \| null`        | `null`                              |
| `gravity`                | `Vector3`                | `[0, -9.81, 0]`                     |
| `isPaused`               | `boolean`                | `false`                             |
| `iterations`             | `number`                 | `5`                                 |
| `maxSubSteps`            | `number`                 | `10`                                |
| `quatNormalizeFast`      | `boolean`                | `false`                             |
| `quatNormalizeSkip`      | `number`                 | `0`                                 |
| `shouldInvalidate`       | `boolean`                | `true`                              |
| `size`                   | `number`                 | `1000`                              |
| `solver`                 | `'GS' \| 'Split'`        | `'GS'`                              |
| `stepSize`               | `number`                 | `1/60`                              |
| `tolerance`              | `number`                 | `0.001`                             |

## Debug

Read the [debug documentation](./debug/README.md) for more information on how to enable debug mode and view debug information.

## Bodies

Read the [body documentation](./body/README.md) for more information on how to create physics bodies and apply forces.

## Constraints

Read the [constraint documentation](./constraint/README.md) for more information on how to create constraints between physics bodies.
