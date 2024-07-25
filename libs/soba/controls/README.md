# `angular-three-soba/controls`

This secondary entry point includes controls for manipulating the camera in your scene. It requires `camera-controls` as an additional dependency.

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
- [NgtsOrbitControls](#ngtsorbitcontrols)

## NgtsCameraControls

A component that provides advanced camera controls based on the `camera-controls` library. It allows you to manipulate the camera's position, rotation, and other properties through various interactions.

### Object Input (`NgtsCameraControlsOptions`)

| Property    | Description                                                                                          | Default Value            |
| ----------- | ---------------------------------------------------------------------------------------------------- | ------------------------ |
| camera      | An instance of `NgtCamera` that the controls will manipulate.                                        | `NgtStore.camera`        |
| domElement  | The HTML element that the controls will listen for events on.                                        | `NgtStore.gl.domElement` |
| makeDefault | A boolean flag indicating whether these controls should be set as the default controls in the store. | `false`                  |
| events      | A boolean flag indicating whether to enable or disable event listeners for the controls.             | `false`                  |
| regress     | A boolean flag indicating whether to enable or disable performance regression for the controls.      | `false`                  |

Other options are available in the `camera-controls` library. For more information, see the [official documentation](https://github.com/yomotsu/camera-controls?tab=readme-ov-file)

### Usage

```ts
@Component({
	standalone: true,
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
