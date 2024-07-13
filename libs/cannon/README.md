# `angular-three-cannon`

This library is a wrapper around the [Cannon.js](https://schteppe.github.io/cannon.js/) physics engine for use with Angular Three.

## Installation

```bash
npm install angular-three-cannon cannon-es cannon-es-debugger @pmndrs/cannon-worker-api
# yarn add angular-three-cannon cannon-es cannon-es-debugger @pmndrs/cannon-worker-api
# pnpm add angular-three-cannon cannon-es cannon-es-debugger @pmndrs/cannon-worker-api
```

> Make sure to already have `angular-three` installed

## Usage

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

### Inputs

- `allowSleep?: boolean`
- `axisIndex?: 0 | 1 | 2`
- `broadphase?: 'Naive' | 'SAP'`
- `defaultContactMaterial?: ContactMaterialOptions`
- `frictionGravity?: Vector3 | null`
- `gravity?: Vector3`
- `isPaused?: boolean`
- `iterations?: number`
- `maxSubSteps?: number`
- `quatNormalizeFast?: boolean`
- `quatNormalizeSkip?: number`
- `shouldInvalidate?: boolean`
- `size?: number`
- `solver?: 'GS' | 'Split'`
- `stepSize?: number`
- `tolerance?: number`

## NgtcPhysicsApi

`NgtcPhysicsApi` is an interface that provides access to the internal state and functionality of the `ngtc-physics` component. You can use it to interact with the physics simulation, subscribe to events, and access references to physics bodies.

```typescript
export class Box {
	physicsApi = injectPhysicsApi();
}
```

The `NgtcPhysicsApi` provides the following properties:

- `bodies`: A dictionary mapping object UUIDs to their corresponding body indices in the physics simulation.
- `events`: An object for subscribing to physics events (e.g., collide, collideBegin, collideEnd, rayhit).
- `refs`: An object containing references to the THREE.js objects that are part of the physics simulation.
- `scaleOverrides`: An object for setting custom scale values for specific objects in the simulation.
- `subscriptions`: An object for managing event subscriptions.
- `worker`: A signal representing the Cannon.js worker used for physics calculations.

## Debug

Check [./debug/README.md]

## Bodies

Check [./body/README.md]

## Constraints

Check [./constraint/README.md]
