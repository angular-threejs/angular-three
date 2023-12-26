import { CUSTOM_ELEMENTS_SCHEMA, Component, Input } from '@angular/core';
import { NgtArgs } from 'angular-three-old';
import { NgtsFloat, type NgtsFloatState } from 'angular-three-soba-old/staging';
import * as THREE from 'three';
import { makeDecorators, makeStoryObject, number } from '../setup-canvas';

@Component({
	standalone: true,
	template: `
		<ngts-float
			[position]="[0, 1.1, 0]"
			[rotation]="[Math.PI / 3.5, 0, 0]"
			[floatingRange]="floatingRange"
			[floatIntensity]="floatIntensity"
			[rotationIntensity]="rotationIntensity"
			[speed]="speed"
		>
			<ngt-mesh>
				<ngt-box-geometry *args="[2, 2, 2]" />
				<ngt-mesh-standard-material [wireframe]="true" color="white" />
			</ngt-mesh>
		</ngts-float>

		<ngt-mesh [position]="[0, -6, 0]" [rotation]="[Math.PI / -2, 0, 0]">
			<ngt-plane-geometry *args="[200, 200, 75, 75]" />
			<ngt-mesh-basic-material [wireframe]="true" color="red" [side]="DoubleSide" />
		</ngt-mesh>
	`,
	imports: [NgtsFloat, NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class DefaultFloatStory {
	Math = Math;
	DoubleSide = THREE.DoubleSide;

	@Input() floatingRange: NgtsFloatState['floatingRange'] = [undefined, 1];
	@Input() floatIntensity: NgtsFloatState['floatIntensity'] = 2;
	@Input() rotationIntensity: NgtsFloatState['rotationIntensity'] = 4;
	@Input() speed: NgtsFloatState['speed'] = 5;
}

export default {
	title: 'Staging/Float',
	decorators: makeDecorators(),
};

export const Default = makeStoryObject(DefaultFloatStory, {
	canvasOptions: { camera: { position: [0, 0, 10] } },
	argsOptions: {
		floatingRange: [number(0), number(1)],
		floatIntensity: number(2),
		rotationIntensity: number(4),
		speed: number(5),
	},
});
