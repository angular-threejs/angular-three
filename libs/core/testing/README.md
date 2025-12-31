# `angular-three/testing`

Secondary entry point of `angular-three` providing testing utilities for Angular Three components.

## Installation

This entry point is included with `angular-three`:

```bash
npm install angular-three
```

## Usage

### `NgtTestBed`

Test utilities for Angular Three components. Provides a testing environment similar to Angular's `TestBed` but specifically designed for Three.js scene graphs.

```typescript
import { NgtTestBed } from 'angular-three/testing';
import { Component, CUSTOM_ELEMENTS_SCHEMA, signal } from '@angular/core';
import { Mesh, BoxGeometry, MeshBasicMaterial } from 'three';

@Component({
	template: `
		<ngt-mesh
			[scale]="clicked() ? 1.5 : 1"
			(click)="clicked.set(!clicked())"
			(pointerover)="hovered.set(true)"
			(pointerout)="hovered.set(false)"
		>
			<ngt-box-geometry />
			<ngt-mesh-basic-material [color]="hovered() ? 'hotpink' : 'orange'" />
		</ngt-mesh>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class SceneGraph {
	hovered = signal(false);
	clicked = signal(false);
}

describe('SceneGraph', () => {
	it('should handle interactions', async () => {
		const { scene, fireEvent, advance, toGraph } = NgtTestBed.create(SceneGraph);

		// Access scene children
		const mesh = scene.children[0] as Mesh<BoxGeometry, MeshBasicMaterial>;
		expect(mesh.material.color.getHexString()).toEqual('ffa500'); // orange

		// Fire pointer events
		await fireEvent(mesh, 'pointerover');
		expect(mesh.material.color.getHexString()).toEqual('ff69b4'); // hotpink

		// Fire click events
		await fireEvent(mesh, 'click');
		expect(mesh.scale.toArray()).toEqual([1.5, 1.5, 1.5]);

		// Advance animation frames
		await advance(1, 0.016);

		// Inspect scene hierarchy
		const graph = toGraph();
		expect(graph).toContainEqual({ type: 'Mesh', name: '', children: [] });
	});
});
```

### `NgtTestBed.create()` Options

```typescript
const result = NgtTestBed.create(SceneGraph, {
	// Input values for the scene graph component
	sceneGraphInputs: { myInput: 'value' },

	// Mock canvas dimensions
	mockCanvasOptions: {
		width: 1280,
		height: 800,
		beforeReturn: (canvas) => {
			/* customize canvas */
		},
	},

	// Canvas configuration (same as NgtCanvas inputs)
	canvasConfiguration: {
		shadows: true,
		dpr: [1, 2],
		camera: { position: [0, 0, 5] },
	},

	// Standard TestBed options
	providers: [],
	imports: [],
	declarations: [],
});
```

### Return Value

`NgtTestBed.create()` returns:

| Property                 | Type                    | Description                            |
| ------------------------ | ----------------------- | -------------------------------------- |
| `store`                  | `SignalState<NgtState>` | The Angular Three store                |
| `fixture`                | `ComponentFixture`      | Angular test fixture                   |
| `sceneGraphComponentRef` | `ComponentRef<T>`       | Reference to the scene graph component |
| `scene`                  | `THREE.Scene`           | The Three.js scene                     |
| `sceneInstanceNode`      | `NgtInstanceNode`       | Instance state of the scene            |
| `canvas`                 | `HTMLCanvasElement`     | The mocked canvas element              |
| `destroy`                | `() => void`            | Cleanup function                       |
| `fireEvent`              | `Function`              | Fire events on Three.js objects        |
| `advance`                | `Function`              | Advance animation frames               |
| `toGraph`                | `Function`              | Convert scene to inspectable graph     |

### Helper Functions

#### `fireEvent()`

Fire events on Three.js objects to simulate user interactions:

```typescript
await fireEvent(mesh, 'click');
await fireEvent(mesh, 'pointerover');
await fireEvent(mesh, 'pointerout');
await fireEvent(mesh, 'pointerdown', { button: 0 });
```

#### `advance()`

Advance animation frames for testing `beforeRender` callbacks:

```typescript
// Advance 10 frames with delta of 0.016 seconds each
await advance(10, 0.016);

// Advance with variable deltas
await advance(3, [0.016, 0.032, 0.016]);
```

#### `toGraph()`

Convert the scene hierarchy to an inspectable object graph:

```typescript
const graph = toGraph();
// Returns: [{ type: 'Mesh', name: 'myMesh', children: [...] }]
```

### `NgtTestCanvas`

Internal component used by `NgtTestBed` to provide a container for rendering scene graph components during testing. You typically don't need to use this directly.
