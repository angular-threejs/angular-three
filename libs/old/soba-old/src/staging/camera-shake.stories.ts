import { Component, CUSTOM_ELEMENTS_SCHEMA, Input } from '@angular/core';
import { NgtArgs, type NgtBeforeRenderEvent } from 'angular-three-old';
import { NgtsOrbitControls } from 'angular-three-soba-old/controls';
import { NgtsCameraShake } from 'angular-three-soba-old/staging';
import * as THREE from 'three';
import { makeDecorators, makeStoryObject, number } from '../setup-canvas';

const numberArgs = number(0.05, { range: true, max: 1, min: 0, step: 0.05 });
const frequencyArgs = number(0.8, { range: true, max: 10, min: 0, step: 0.1 });
const argsOptions = {
	maxPitch: numberArgs,
	maxRoll: numberArgs,
	maxYaw: numberArgs,
	pitchFrequency: frequencyArgs,
	rollFrequency: frequencyArgs,
	yawFrequency: frequencyArgs,
};

@Component({
	selector: 'camera-shake-scene',
	standalone: true,
	template: `
		<ngt-mesh (beforeRender)="onBeforeRender($event)">
			<ngt-box-geometry *args="[2, 2, 2]" />
			<ngt-mesh-standard-material [wireframe]="true" />
		</ngt-mesh>
		<ngt-mesh [position]="[0, -6, 0]" [rotation]="[Math.PI / -2, 0, 0]">
			<ngt-plane-geometry *args="[200, 200, 75, 75]" />
			<ngt-mesh-basic-material [wireframe]="true" color="red" [side]="DoubleSide" />
		</ngt-mesh>
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class Scene {
	Math = Math;
	DoubleSide = THREE.DoubleSide;

	onBeforeRender({ object: mesh }: NgtBeforeRenderEvent<THREE.Mesh>) {
		mesh.rotation.x = mesh.rotation.y += 0.01;
	}
}

@Component({
	standalone: true,
	template: `
		<ngts-orbit-controls [makeDefault]="true" />
		<ngts-camera-shake
			[maxPitch]="maxPitch"
			[maxRoll]="maxRoll"
			[maxYaw]="maxYaw"
			[pitchFrequency]="pitchFrequency"
			[rollFrequency]="rollFrequency"
			[yawFrequency]="yawFrequency"
		/>
		<camera-shake-scene />
	`,
	imports: [NgtsCameraShake, Scene, NgtsOrbitControls],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class WithOrbitControlsStory {
	@Input() maxPitch = argsOptions.maxPitch.defaultValue;
	@Input() maxRoll = argsOptions.maxRoll.defaultValue;
	@Input() maxYaw = argsOptions.maxYaw.defaultValue;
	@Input() pitchFrequency = argsOptions.pitchFrequency.defaultValue;
	@Input() rollFrequency = argsOptions.rollFrequency.defaultValue;
	@Input() yawFrequency = argsOptions.yawFrequency.defaultValue;
}

@Component({
	standalone: true,
	template: `
		<ngts-camera-shake
			[maxPitch]="maxPitch"
			[maxRoll]="maxRoll"
			[maxYaw]="maxYaw"
			[pitchFrequency]="pitchFrequency"
			[rollFrequency]="rollFrequency"
			[yawFrequency]="yawFrequency"
		/>
		<camera-shake-scene />
	`,
	imports: [NgtsCameraShake, Scene],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class DefaultCameraShakeStory {
	@Input() maxPitch = argsOptions.maxPitch.defaultValue;
	@Input() maxRoll = argsOptions.maxRoll.defaultValue;
	@Input() maxYaw = argsOptions.maxYaw.defaultValue;
	@Input() pitchFrequency = argsOptions.pitchFrequency.defaultValue;
	@Input() rollFrequency = argsOptions.rollFrequency.defaultValue;
	@Input() yawFrequency = argsOptions.yawFrequency.defaultValue;
}

export default {
	title: 'Staging/Camera Shake',
	decorators: makeDecorators(),
};

export const Default = makeStoryObject(DefaultCameraShakeStory, {
	canvasOptions: { camera: { position: [0, 0, 10] }, controls: false },
	argsOptions,
});

export const WithOrbitControls = makeStoryObject(WithOrbitControlsStory, {
	canvasOptions: { camera: { position: [0, 0, 10] }, controls: false },
	argsOptions,
});
