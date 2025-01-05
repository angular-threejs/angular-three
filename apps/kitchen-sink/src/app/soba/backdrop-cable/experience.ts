import {
	ChangeDetectionStrategy,
	Component,
	computed,
	CUSTOM_ELEMENTS_SCHEMA,
	ElementRef,
	viewChild,
} from '@angular/core';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import { NgtsPivotControls } from 'angular-three-soba/gizmos';
import { NgtsBackdrop, NgtsContactShadows, NgtsEnvironment, NgtsFloat } from 'angular-three-soba/staging';
import { Group } from 'three';
import { Astronaut } from './astronaut';
import { Cable } from './cable';
import { Spaceship } from './spaceship';

@Component({
	template: `
		<ngt-ambient-light [intensity]="Math.PI * 0.2" />
		<ngt-directional-light [position]="[-10, 0, -5]" [intensity]="Math.PI" color="red" />
		<ngt-directional-light [position]="[-1, -2, -5]" [intensity]="Math.PI * 0.2" color="#0c8cbf" />
		<ngt-spot-light
			[position]="[5, 0, 5]"
			[intensity]="Math.PI * 2.5"
			[penumbra]="1"
			[angle]="0.35"
			[decay]="0"
			[castShadow]="true"
			color="#0c8cbf"
		/>

		<ngts-float [options]="{ scale: 0.75, position: [0, 0.65, 0], rotation: [0, 0.6, 0] }">
			<ngts-pivot-controls [options]="{ anchor: [0, 0.7, 0], depthTest: true, scale: 0.5, lineWidth: 2 }">
				<app-spaceship />
			</ngts-pivot-controls>
		</ngts-float>

		<ngts-float
			[options]="{
				position: [1, 1.1, -0.5],
				rotation: [Math.PI / 3.5, 0, 0],
				rotationIntensity: 4,
				floatIntensity: 6,
				speed: 1.5,
			}"
		>
			<app-astronaut [options]="{ scale: 0.2 }">
				<ngt-group #astronaut [position]="[-0.6, 2, 0]" />
			</app-astronaut>
		</ngts-float>

		<app-cable [startRef]="spaceshipModelRef()" [endRef]="astronautRef()" />

		<ngts-backdrop [options]="{ castShadow: true, floor: 2, position: [0, -0.5, -3], scale: [50, 10, 4] }">
			<ngt-mesh-standard-material color="#353540" [envMapIntensity]="0.1" />
		</ngts-backdrop>

		<ngts-contact-shadows [options]="{ position: [0, -0.485, 0], scale: 5, blur: 1.5, far: 1 }" />
		<ngts-environment [options]="{ preset: 'city' }" />
		<ngts-orbit-controls [options]="{ makeDefault: true }" />
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'backdrop-cable-soba-experience' },
	imports: [
		NgtsFloat,
		Spaceship,
		Astronaut,
		Cable,
		NgtsBackdrop,
		NgtsContactShadows,
		NgtsEnvironment,
		NgtsOrbitControls,
		NgtsPivotControls,
	],
})
export class Experience {
	protected readonly Math = Math;

	protected astronautRef = viewChild.required<ElementRef<Group>>('astronaut');

	private spaceship = viewChild.required(Spaceship);
	protected spaceshipModelRef = computed(() => this.spaceship().modelRef());
}
