import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { NgtArgs } from 'angular-three';
import { NgtsCameraControls } from 'angular-three-soba/controls';
import {
	NgtsAccumulativeShadows,
	NgtsEnvironment,
	NgtsFloat,
	NgtsLightformer,
	NgtsRandomizedLights,
} from 'angular-three-soba/staging';
import { Spheres } from './spheres';
import { Tank } from './tank';
import { Turtle } from './turtle';

@Component({
	template: `
		<ngt-color *args="['#c6e5db']" attach="background" />

		<!-- fish tank -->
		<app-tank [position]="[0, 0.25, 0]">
			<ngts-float [options]="{ rotationIntensity: 2, floatIntensity: 10, speed: 2 }">
				<app-turtle [position]="[0, -0.5, -1]" [rotation]="[0, Math.PI, 0]" [scale]="23" />
			</ngts-float>

			<app-spheres />
		</app-tank>

		<!-- soft shadows -->
		<ngts-accumulative-shadows
			[options]="{
				temporal: true,
				frames: 100,
				color: 'lightblue',
				colorBlend: 2,
				opacity: 0.7,
				alphaTest: 0.65,
				scale: 60,
				position: [0, -5, 0],
			}"
		>
			<ngts-randomized-lights
				[options]="{ amount: 8, radius: 15, ambient: 0.5, intensity: Math.PI, position: [-5, 10, -5], size: 20 }"
			/>
		</ngts-accumulative-shadows>

		<!-- custom env map -->
		<ngts-environment [options]="{ resolution: 1024 }">
			<ngt-group * [rotation]="[-Math.PI / 3, 0, 0]">
				<ngts-lightformer
					[options]="{ intensity: 4, rotation: [Math.PI / 2, 0, 0], position: [0, 5, -9], scale: [10, 10, 1] }"
				/>

				@for (x of lightPositions; track $index) {
					<ngts-lightformer
						[options]="{
							form: 'circle',
							intensity: 4,
							rotation: [Math.PI / 2, 0, 0],
							position: [x, 4, $index * 4],
							scale: [4, 1, 1],
						}"
					/>
				}

				<ngts-lightformer
					[options]="{ intensity: 2, rotation: [Math.PI / 2, 0, 0], position: [-5, 1, -1], scale: [50, 2, 1] }"
				/>
				<ngts-lightformer
					[options]="{ intensity: 2, rotation: [-Math.PI / 2, 0, 0], position: [10, 1, 0], scale: [50, 2, 1] }"
				/>
			</ngt-group>
		</ngts-environment>

		<ngts-camera-controls
			[options]="{
				minPolarAngle: 0,
				maxPolarAngle: Math.PI / 2,
				truckSpeed: 0,
				dollySpeed: 0,
			}"
		/>
	`,
	imports: [
		NgtArgs,
		Tank,
		NgtsFloat,
		Turtle,
		Spheres,
		NgtsAccumulativeShadows,
		NgtsRandomizedLights,
		NgtsEnvironment,
		NgtsLightformer,
		NgtsCameraControls,
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'aquarium-soba-experience' },
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Experience {
	protected readonly Math = Math;
	protected lightPositions = [2, 0, 2, 0, 2, 0, 2, 0];
}
