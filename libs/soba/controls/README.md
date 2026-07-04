# `angular-three-soba/controls`

This secondary entry point includes controls for manipulating the camera in your scene.

| Package           | Description                      |
| ----------------- | -------------------------------- |
| `camera-controls` | required by `NgtsCameraControls` |
| `maath`           | required by `NgtsScrollControls` |

```bash
npm install camera-controls maath
# yarn add camera-controls maath
# pnpm add camera-controls maath
```

## TOC

- [NgtsCameraControls](#ngtscameracontrols)
- [NgtsKeyboardControls](#ngtskeyboardcontrols)
- [NgtsOrbitControls](#ngtsorbitcontrols)
- [NgtsPointerLockControls](#ngtspointerLockcontrols)
- [NgtsScrollControls](#ngtsscrollcontrols)
- [NgtsTrackballControls](#ngtstrackballcontrols)

## NgtsCameraControls

A component that provides advanced camera controls based on the `camera-controls` library. It allows you to manipulate the camera's position, rotation, and other properties through various interactions.

### Object Input (`NgtsCameraControlsOptions`)

| Property    | Description                                                                                          | Default Value            |
| ----------- | ---------------------------------------------------------------------------------------------------- | ------------------------ |
| camera      | An instance of `NgtCamera` that the controls will manipulate.                                        | `NgtStore.camera`        |
| domElement  | The HTML element that the controls will listen for events on.                                        | `NgtStore.gl.domElement` |
| makeDefault | A boolean flag indicating whether these controls should be set as the default controls in the store. | `false`                  |
| regress     | A boolean flag indicating whether to enable or disable performance regression for the controls.      | `false`                  |

Other options are available in the `camera-controls` library. For more information, see the [official documentation](https://github.com/yomotsu/camera-controls?tab=readme-ov-file)

### Usage

```ts
@Component({
	template: `
		<ngt-mesh>
			<ngt-box-geometry />
			<ngt-mesh-basic-material color="red" [wireframe]="true" />
		</ngt-mesh>

		<ngt-grid-helper *args="[50, 50]" [position]="[0, -1, 0]" />

		<ngts-camera-controls />
	`,
	imports: [NgtsCameraControls, NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class DefaultCameraControlsStory {
	rotate = input<keyof typeof rotations | 'none'>('none');

	cameraControlsRef = viewChild.required(NgtsCameraControls);

	constructor() {
		effect(() => {
			const [rotate, controls] = [this.rotate(), this.cameraControlsRef().controls()];
			if (rotate !== 'none') {
				const [theta, phi, animate] = rotations[rotate];
				void controls.rotate(theta, phi, animate);
			} else {
				void controls.reset(true);
			}
		});
	}
}
```

## NgtsKeyboardControls

A renderless attribute directive that turns a user-defined controls map into keyboard state, ported from `@react-three/drei`'s `KeyboardControls`. It attaches `keydown`/`keyup` listeners to `window` (or a custom `domElement`) and distributes the pressed state of named actions to descendants via dependency injection — what happens when an action is pressed is entirely up to consumers of `injectKeyboardControls`.

Multiple physical keys can map to one action. Held keys are reference-counted per action, so OS auto-repeat and overlapping holds of sibling keys never produce duplicate transitions. Prefer `event.code` values (e.g. `'KeyW'`, `'Space'`) in the map — `event.key` values are layout- and case-sensitive.

### Inputs

| Property         | Description                                                                                                                                          | Default Value |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| keyboardControls | The controls map: an array of `{ name, keys, up? }` entries. A `model()` — hostDirective consumers can `inject(NgtsKeyboardControls).map.set(...)`.  | `[]`          |
| domElement       | The event source the listeners attach to.                                                                                                            | `window`      |
| preventDefault   | When `true`, listeners are registered non-passively and `preventDefault()` is called for mapped keys (e.g. to stop `Space` from scrolling the page). | `false`       |

Each entry supports two discrete-action modes on top of the default pressed-while-held behavior:

- `up: false` — fire-on-press: the state latches `true` after the first press and only `keyChange` fires on subsequent press edges. Consume via `keyChange`.
- `toggle: true` — stateful on/off: each press edge flips the state between `true` and `false`; `keyup` is ignored (takes precedence over `up`). Consume via the reactive `select()` signal.

### Outputs

| Output    | Description                                                                                           |
| --------- | ----------------------------------------------------------------------------------------------------- |
| keyChange | Emits `{ name, pressed, state }` on every action transition (and on each press edge for `up: false`). |

### Usage

Define the map once at module level with `createKeyboardControls` — a runtime identity function that infers the action names as literal types, so the returned `injectKeyboardControls` is fully typed without repeating the generic at every call site:

```ts
export const { controlsMap, injectKeyboardControls } = createKeyboardControls([
	{ name: 'forward', keys: ['ArrowUp', 'KeyW'] },
	{ name: 'back', keys: ['ArrowDown', 'KeyS'] },
	{ name: 'left', keys: ['ArrowLeft', 'KeyA'] },
	{ name: 'right', keys: ['ArrowRight', 'KeyD'] },
	{ name: 'jump', keys: ['Space'], up: false },
]);
```

Provide it via the template:

```html
<ngt-group [keyboardControls]="controlsMap">
	<app-player />
</ngt-group>
```

or via `hostDirectives`, setting the map programmatically:

```ts
@Component({
	hostDirectives: [NgtsKeyboardControls],
	/* ... */
})
export class SceneGraph {
	constructor() {
		inject(NgtsKeyboardControls).map.set(controlsMap);
	}
}
```

Consume it in any descendant:

```ts
@Component({
	/* ... */
})
export class Player {
	private keyboardControls = injectKeyboardControls();

	// reactive form: a memoized Signal<boolean> per action
	protected jumping = this.keyboardControls.select('jump');

	constructor() {
		// transient form: poll a non-reactive snapshot in the frame loop
		beforeRender(({ delta }) => {
			const { forward, back, left, right } = this.keyboardControls.snapshot;
			// move things
		});

		// edge events for discrete actions
		this.keyboardControls.keyChange.subscribe(({ name, pressed }) => {
			if (name === 'jump' && pressed) {
				// jump!
			}
		});
	}
}
```

## NgtsOrbitControls

A component that provides orbit controls for rotating the camera around a target point. It is based on the OrbitControls class from the `three-stdlib` library.

### Object Input (`NgtsOrbitControlsOptions`)

| Property      | Description                                                                                          | Default Value            |
| ------------- | ---------------------------------------------------------------------------------------------------- | ------------------------ |
| camera        | An instance of `NgtCamera` that the controls will manipulate.                                        | `NgtStore.camera`        |
| domElement    | The HTML element that the controls will listen for events on.                                        | `NgtStore.gl.domElement` |
| target        | The coordinates that the camera will orbit around.                                                   | `[0, 0, 0]`              |
| makeDefault   | A boolean flag indicating whether these controls should be set as the default controls in the store. | `false`                  |
| regress       | A boolean flag indicating whether to enable or disable performance regression for the controls.      | `false`                  |
| enableDamping | A boolean flag indicating whether to enable or disable damping (smoothness) of the camera movement.  | `true`                   |
| keyEvents     | A boolean flag or an HTML element indicating whether to enable keyboard events for the controls.     | `false`                  |

Other options can pass through to `OrbitControls`.

### Usage

```html
<ngts-orbit-controls [options]="{ autoRotate: true }" />
```

## NgtsPointerLockControls

A component that provides first-person style controls by locking the mouse pointer. It is based on the PointerLockControls class from the `three-stdlib` library.

### Object Input (`NgtsPointerLockControlsOptions`)

| Property    | Description                                                                                          | Default Value            |
| ----------- | ---------------------------------------------------------------------------------------------------- | ------------------------ |
| camera      | An instance of `THREE.Camera` that the controls will manipulate.                                     | `NgtStore.camera`        |
| domElement  | The HTML element that the controls will listen for events on.                                        | `NgtStore.gl.domElement` |
| makeDefault | A boolean flag indicating whether these controls should be set as the default controls in the store. | `false`                  |
| enabled     | A boolean flag indicating whether the controls are enabled.                                          | `true`                   |
| selector    | A CSS selector for elements that will trigger pointer lock on click.                                 | `undefined`              |

### Outputs

| Output | Description                                |
| ------ | ------------------------------------------ |
| lock   | Emits when the pointer is locked.          |
| unlock | Emits when the pointer is unlocked.        |
| change | Emits when the camera orientation changes. |

### Usage

```html
<ngts-pointer-lock-controls [options]="{ selector: '#lock-button' }" (lock)="onLock()" (unlock)="onUnlock()" />
```

## NgtsScrollControls

A component that enables scroll-based interactions within a Three.js canvas. It creates a scrollable container that can be used to control animations and camera movements based on scroll position.

### Object Input (`NgtsScrollControlsOptions`)

| Property   | Description                                                       | Default Value |
| ---------- | ----------------------------------------------------------------- | ------------- |
| eps        | Precision threshold for detecting scroll changes.                 | `0.00001`     |
| horizontal | Whether to enable horizontal scrolling instead of vertical.       | `false`       |
| infinite   | Whether to enable infinite/continuous scrolling (experimental).   | `false`       |
| pages      | Defines the length of the scroll area. Each page is height:100%.  | `1`           |
| distance   | A factor that increases scroll bar travel distance.               | `1`           |
| damping    | Friction/smoothing duration in seconds.                           | `0.25`        |
| maxSpeed   | Maximum scroll speed in units per second.                         | `Infinity`    |
| prepend    | If true, attaches the scroll container before the canvas element. | `false`       |
| enabled    | Whether scroll controls are enabled.                              | `true`        |
| style      | Additional CSS styles to apply to the scroll container.           | `{}`          |

### Companion Directives

#### `NgtsCanvasScrollContent`

A directive that automatically positions a group based on scroll progress. Apply to an `ngt-group` element.

```html
<ngt-group canvasScrollContent>
	<!-- 3D content that moves with scroll -->
</ngt-group>
```

#### `NgtsHTMLScrollContent`

A directive that automatically transforms an HTML element based on scroll progress. Apply to a `div` element.

```html
<div htmlScrollContent>
	<!-- HTML content that scrolls in sync with 3D content -->
</div>
```

### Properties and Methods

| Property/Method                    | Description                                              |
| ---------------------------------- | -------------------------------------------------------- |
| `progress`                         | A model that tracks the current scroll progress (0-1).   |
| `offset`                           | The damped scroll offset value.                          |
| `delta`                            | The change in offset since last frame.                   |
| `range(from, distance, margin?)`   | Returns linear progress (0-1) within a scroll range.     |
| `curve(from, distance, margin?)`   | Returns sinusoidal progress (0-1) within a scroll range. |
| `visible(from, distance, margin?)` | Returns true if currently within the specified range.    |

### Usage

```html
<ngts-scroll-controls [options]="{ pages: 3, damping: 0.1 }">
	<ngt-group canvasScrollContent>
		<!-- 3D content that moves with scroll -->
	</ngt-group>
</ngts-scroll-controls>
```

```ts
@Component({
	template: `
		<ngts-scroll-controls [options]="{ pages: 3 }">
			<ngt-group canvasScrollContent>
				<ngt-mesh [position]="[0, 0, 0]">
					<ngt-box-geometry />
					<ngt-mesh-standard-material />
				</ngt-mesh>
			</ngt-group>
		</ngts-scroll-controls>
	`,
	imports: [NgtsScrollControls, NgtsCanvasScrollContent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class ScrollScene {
	scrollControls = viewChild.required(NgtsScrollControls);

	constructor() {
		effect(() => {
			// Access scroll utilities
			const visible = this.scrollControls().visible(0, 1 / 3);
			const progress = this.scrollControls().range(0, 1 / 3);
		});
	}
}
```

## NgtsTrackballControls

A component that provides trackball-style camera controls for the Three.js scene. Unlike OrbitControls, TrackballControls have no restrictions on vertical rotation, allowing the camera to flip upside down.

### Object Input (`NgtsTrackballControlsOptions`)

| Property    | Description                                                                                          | Default Value            |
| ----------- | ---------------------------------------------------------------------------------------------------- | ------------------------ |
| camera      | An instance of `THREE.Camera` that the controls will manipulate.                                     | `NgtStore.camera`        |
| domElement  | The HTML element that the controls will listen for events on.                                        | `NgtStore.gl.domElement` |
| target      | The target point to orbit around.                                                                    | `[0, 0, 0]`              |
| makeDefault | A boolean flag indicating whether these controls should be set as the default controls in the store. | `false`                  |
| regress     | A boolean flag indicating whether to enable or disable performance regression for the controls.      | `false`                  |

Other options can pass through to `TrackballControls`.

### Outputs

| Output  | Description                                         |
| ------- | --------------------------------------------------- |
| changed | Emits when the camera position/orientation changes. |
| started | Emits when user interaction starts.                 |
| ended   | Emits when user interaction ends.                   |

### Usage

```html
<ngts-trackball-controls [options]="{ makeDefault: true }" (changed)="onControlsChange($event)" />
```
