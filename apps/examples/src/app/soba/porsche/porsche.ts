import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { injectBeforeRender } from 'angular-three';
import { injectGLTF } from 'angular-three-soba/loaders';
import { NgtsAccumulativeShadows, NgtsEnvironment, NgtsRandomizedLights } from 'angular-three-soba/staging';
import { NgtCanvas } from 'angular-three/dom';
import { Vector3 } from 'three';
import { color, colorAsHex } from './color';
import { Lightformers } from './lightformers';
import { Model } from './model';

injectGLTF.preload(() => './911-transformed.glb');

@Component({
	selector: 'app-scene-graph',
	template: `
		<ngt-spot-light
			[position]="[0, 15, 0]"
			[angle]="0.3"
			[penumbra]="1"
			castShadow
			[intensity]="2 * Math.PI"
			[decay]="0"
		>
			<ngt-value [rawValue]="-0.0001" attach="shadow.bias" />
		</ngt-spot-light>
		<ngt-ambient-light [intensity]="0.5 * Math.PI" />

		<app-porsche-model #model [position]="[-0.5, -0.18, 0]" [rotation]="[0, Math.PI / 5, 0]" [scale]="1.6" />

		<ngts-accumulative-shadows
			[options]="{ position: [0, -1.16, 0], frames: 100, alphaTest: 0.9, scale: 10, visible: !!model.gltf() }"
		>
			<ngts-randomized-lights
				[options]="{ amount: 8, radius: 10, ambient: 0.5, position: [1, 5, -1], intensity: 1.5 * Math.PI }"
			/>
		</ngts-accumulative-shadows>

		<ngts-environment [options]="{ background: true, blur: 1, resolution: 256, frames: Infinity }">
			<app-lightformers * />
		</ngts-environment>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtsAccumulativeShadows, NgtsRandomizedLights, Model, NgtsEnvironment, Lightformers],
})
export class SceneGraph {
	protected Math = Math;
	protected Infinity = Infinity;

	constructor() {
		const v = new Vector3();

		injectBeforeRender(({ clock, camera }) => {
			const t = clock.elapsedTime;
			camera.position.lerp(v.set(Math.sin(t / 5), 0, 12 + Math.cos(t / 5) / 2), 0.05);
			camera.lookAt(0, 0, 0);
		});
	}
}

@Component({
	template: `
		<ngt-canvas [camera]="{ position: [5, 0, 15], fov: 30 }" shadows>
			<app-scene-graph *canvasContent />
		</ngt-canvas>
		<input class="absolute top-0 right-0" type="color" [value]="colorAsHex()" (change)="onChange($event)" />
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtCanvas, SceneGraph],
	host: { class: 'porsche-soba' },
})
export default class Porsche {
	protected colorAsHex = colorAsHex;

	onChange(event: Event): void {
		const input = event.target as HTMLInputElement;
		color.set(input.value);
	}
}
