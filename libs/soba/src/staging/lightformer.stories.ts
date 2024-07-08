import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, viewChild } from '@angular/core';
import { Meta } from '@storybook/angular';
import { injectBeforeRender, NgtArgs } from 'angular-three';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import { NgtsContactShadows, NgtsEnvironment, NgtsLightformer } from 'angular-three-soba/staging';
import { Mesh } from 'three';
import { makeDecorators, makeStoryFunction } from '../setup-canvas';

@Component({
	standalone: true,
	template: `
		<ngts-environment [options]="{ background: true, preset: 'sunset' }">
			<ng-template>
				<ngt-color *args="['black']" attach="background" />
				<ngts-lightformer [options]="{ position: [0, 0, -5], scale: 10, color: 'red', intensity: 10, form: 'ring' }" />
			</ng-template>
		</ngts-environment>

		<ngt-mesh [position]="[-1.5, 0, 0]">
			<ngt-sphere-geometry />
			<ngt-mesh-standard-material color="orange" />
		</ngt-mesh>

		<ngt-mesh #cube [position]="[1.5, 0, 0]" [scale]="1.5">
			<ngt-box-geometry />
			<ngt-mesh-standard-material color="mediumpurple" />
		</ngt-mesh>

		<ngt-mesh [position]="[0, -1, 0]" [rotation]="[-Math.PI / 2, 0, 0]" [scale]="10">
			<ngt-plane-geometry />
			<ngt-mesh-standard-material color="greenyellow" />
		</ngt-mesh>

		<ngts-contact-shadows
			[options]="{ position: [0, -0.99, 0], scale: 10, resolution: 512, opacity: 0.4, blur: 2.8 }"
		/>

		<ngts-orbit-controls [options]="{ makeDefault: true, autoRotate: true, autoRotateSpeed: 0.5, enablePan: false }" />
	`,
	imports: [NgtsEnvironment, NgtsLightformer, NgtsContactShadows, NgtArgs, NgtsOrbitControls],
	changeDetection: ChangeDetectionStrategy.OnPush,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class DefaultLightformerStory {
	Math = Math;

	cube = viewChild.required<ElementRef<Mesh>>('cube');

	constructor() {
		injectBeforeRender(({ delta }) => {
			const cube = this.cube().nativeElement;
			cube.rotation.y += delta * 0.2;
		});
	}
}

export default {
	title: 'Staging/Lightformer',
	decorators: makeDecorators(),
} as Meta;

export const Default = makeStoryFunction(DefaultLightformerStory, {
	// camera: { position: [-3, 3, 3] },
	controls: false,
	lights: false,
	background: 'ivory',
});
