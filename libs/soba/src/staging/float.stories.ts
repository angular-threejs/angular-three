import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Meta } from '@storybook/angular';
import { NgtArgs } from 'angular-three';
import { NgtsFloat } from 'angular-three-soba/staging';
import { DoubleSide } from 'three';
import { makeDecorators, makeStoryObject } from '../setup-canvas';

@Component({
	standalone: true,
	template: `
		<ngts-float [options]="options()">
			<ngt-mesh>
				<ngt-box-geometry *args="[2, 2, 2]" />
				<ngt-mesh-standard-material [wireframe]="true" color="white" />
			</ngt-mesh>
		</ngts-float>

		<!-- ground plane -->
		<ngt-mesh [position]="[0, -6, 0]" [rotation]="[-Math.PI / 2, 0, 0]">
			<ngt-plane-geometry *args="[200, 200, 75, 75]" />
			<ngt-mesh-basic-material [wireframe]="true" color="red" [side]="DoubleSide" />
		</ngt-mesh>
	`,

	imports: [NgtsFloat, NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class DefaultFloatStory {
	Math = Math;
	DoubleSide = DoubleSide;

	floatingRange = input([undefined, 1]);
	rotationIntensity = input(4);
	floatIntensity = input(2);
	speed = input(5);

	options = computed(() => ({
		speed: this.speed(),
		rotationIntensity: this.rotationIntensity(),
		floatIntensity: this.floatIntensity(),
		floatingRange: this.floatingRange(),
		position: [0, 1.1, 0],
		rotation: [Math.PI / 3.5, 0, 0],
	}));
}

export default {
	title: 'Staging/Float',
	decorators: makeDecorators(),
} as Meta;

export const Default = makeStoryObject(DefaultFloatStory, {
	canvasOptions: { camera: { position: [0, 0, 10] } },
	argsOptions: {
		floatingRange: [undefined, 1],
		rotationIntensity: 4,
		floatIntensity: 2,
		speed: 5,
	},
});
