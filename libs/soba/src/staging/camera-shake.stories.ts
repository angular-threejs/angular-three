import {
	CUSTOM_ELEMENTS_SCHEMA,
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	input,
	viewChild,
} from '@angular/core';
import { Meta } from '@storybook/angular';
import { NgtArgs, injectBeforeRender } from 'angular-three';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import { NgtsCameraShake, NgtsCameraShakeOptions } from 'angular-three-soba/staging';
import { DoubleSide, Mesh } from 'three';
import { makeDecorators, makeStoryObject, number } from '../setup-canvas';

@Component({
	selector: 'camera-shake-objects',
	standalone: true,
	template: `
		<ngt-mesh #cube>
			<ngt-box-geometry *args="[2, 2, 2]" />
			<ngt-mesh-standard-material [wireframe]="true" color="white" />
		</ngt-mesh>
		<ngt-mesh [position]="[0, -6, 0]" [rotation]="[-Math.PI / 2, 0, 0]">
			<ngt-plane-geometry *args="[200, 200, 75, 75]" />
			<ngt-mesh-basic-material [wireframe]="true" color="red" [side]="DoubleSide" />
		</ngt-mesh>
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class Objects {
	DoubleSide = DoubleSide;
	Math = Math;

	cube = viewChild.required<ElementRef<Mesh>>('cube');

	constructor() {
		injectBeforeRender(() => {
			const cube = this.cube().nativeElement;
			cube.rotation.x = cube.rotation.y += 0.01;
		});
	}
}

@Component({
	standalone: true,
	template: `
		<ngts-camera-shake [options]="options()" />
		<camera-shake-objects />
	`,
	imports: [Objects, NgtsCameraShake],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class DefaultCameraShakeStory {
	options = input<Partial<NgtsCameraShakeOptions>>();
}

@Component({
	standalone: true,
	template: `
		<ngts-orbit-controls [options]="{ makeDefault: true }" />
		<ngts-camera-shake [options]="options()" />
		<camera-shake-objects />
	`,
	imports: [Objects, NgtsCameraShake, NgtsOrbitControls],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class WithOrbitControlsCameraShakeStory {
	options = input<Partial<NgtsCameraShakeOptions>>();
}

export default {
	title: 'Staging/Camera Shake',
	decorators: makeDecorators(),
} as Meta;

export const Default = makeStoryObject(DefaultCameraShakeStory, {
	canvasOptions: { camera: { position: [0, 0, 10] }, controls: false },
	argsOptions: {
		options: {
			maxPitch: number(0.05, { range: true, min: 0, max: 1, step: 0.05 }),
			maxRoll: number(0.05, { range: true, min: 0, max: 1, step: 0.05 }),
			maxYaw: number(0.05, { range: true, min: 0, max: 1, step: 0.05 }),
			pitchFrequency: number(0.8, { range: true, min: 0, max: 10, step: 0.1 }),
			rollFrequency: number(0.8, { range: true, min: 0, max: 10, step: 0.1 }),
			yawFrequency: number(0.8, { range: true, min: 0, max: 10, step: 0.1 }),
		},
	},
});

export const WithOrbitControls = makeStoryObject(WithOrbitControlsCameraShakeStory, {
	canvasOptions: { camera: { position: [0, 0, 10] }, controls: false },
	argsOptions: {
		options: {
			maxPitch: number(0.05, { range: true, min: 0, max: 1, step: 0.05 }),
			maxRoll: number(0.05, { range: true, min: 0, max: 1, step: 0.05 }),
			maxYaw: number(0.05, { range: true, min: 0, max: 1, step: 0.05 }),
			pitchFrequency: number(0.8, { range: true, min: 0, max: 10, step: 0.1 }),
			rollFrequency: number(0.8, { range: true, min: 0, max: 10, step: 0.1 }),
			yawFrequency: number(0.8, { range: true, min: 0, max: 10, step: 0.1 }),
		},
	},
});
