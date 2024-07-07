import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, effect, input, viewChild } from '@angular/core';
import { Meta } from '@storybook/angular';
import { NgtArgs } from 'angular-three';
import { NgtsCameraControls } from 'angular-three-soba/controls';
import { MathUtils } from 'three';
import { makeDecorators, makeStoryObject, select } from '../setup-canvas';

const rotations = {
	'theta 45deg': [45 * MathUtils.DEG2RAD, 0, true],
	'theta -90deg': [-90 * MathUtils.DEG2RAD, 0, true],
	'theta 360deg': [360 * MathUtils.DEG2RAD, 0, true],
	'phi 20deg': [0, 20 * MathUtils.DEG2RAD, true],
} as const;

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

export default {
	title: 'Controls/Camera Controls',
	decorators: makeDecorators(),
} as Meta;

export const Default = makeStoryObject(DefaultCameraControlsStory, {
	canvasOptions: { camera: { fov: 60 }, controls: false },
	argsOptions: {
		rotate: select('none', { options: [...Object.keys(rotations), 'none'] }),
	},
	parameters: {
		deepControls: { enabled: false },
	},
});
