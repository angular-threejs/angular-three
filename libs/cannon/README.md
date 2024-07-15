# `angular-three-cannon`

This library is a wrapper around the [Cannon.js](https://schteppe.github.io/cannon.js/) physics engine for use with Angular Three.

## Installation

```bash
npm install angular-three-cannon cannon-es @pmndrs/cannon-worker-api
# yarn add angular-three-cannon cannon-es @pmndrs/cannon-worker-api
# pnpm add angular-three-cannon cannon-es @pmndrs/cannon-worker-api
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

## Debug

Read the [debug documentation](./debug/README.md) for more information on how to enable debug mode and view debug information.

## Bodies

Read the [body documentation](./body/README.md) for more information on how to create physics bodies and apply forces.

## Constraints

Read the [constraint documentation](./constraint/README.md) for more information on how to create constraints between physics bodies.
