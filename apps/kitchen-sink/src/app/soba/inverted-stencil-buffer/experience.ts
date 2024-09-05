import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, input, signal } from '@angular/core';
import { NgtArgs, NgtEuler, NgtVector3 } from 'angular-three';
import { NgtsRoundedBox } from 'angular-three-soba/abstractions';
import { NgtsOrbitControls, NgtsPivotControls } from 'angular-three-soba/controls';
import { NgtsBounds, NgtsEnvironment, NgtsFloat, NgtsMask } from 'angular-three-soba/staging';
import { ColorRepresentation } from 'three';
import { Angular } from './angular';
import { Nx } from './nx';
import { NxCloud } from './nx-cloud';

export const invert = signal(false);
export const logo = signal<'angular' | 'nx' | 'nx-cloud'>('nx');

@Component({
	selector: 'app-frame',
	standalone: true,
	template: `
		<ngt-mesh [position]="position()">
			<ngt-ring-geometry *args="[1.095, 1.155, 64]" />
			<ngt-mesh-phong-material color="black" />
		</ngt-mesh>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs],
})
export class Frame {
	position = input<NgtVector3>([0, 0, 0]);
}

@Component({
	selector: 'app-circular-mask',
	standalone: true,
	template: `
		<ngt-group [position]="position()">
			<ngts-pivot-controls
				[options]="{ offset: [0, 0, 1], activeAxes: [true, true, false], disableRotations: true, depthTest: false }"
			>
				<app-frame [position]="[0, 0, 1]" />
				<ngts-mask id="1" [options]="{ position: [0, 0, 0.95] }">
					<ngt-circle-geometry *args="[1.15, 64]" />
				</ngts-mask>
			</ngts-pivot-controls>
		</ngt-group>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtsPivotControls, Frame, NgtsMask, NgtArgs],
})
export class CircularMask {
	position = input<NgtVector3>([0, 0, 0]);
}

@Component({
	selector: 'app-box',
	standalone: true,
	template: `
		<ngts-rounded-box
			[options]="{
				width: width(),
				height: height(),
				depth: depth(),
				radius: 0.05,
				smoothness: 4,
				position: position(),
				rotation: rotation(),
			}"
		>
			<ngt-mesh-phong-material [color]="color()" />
		</ngts-rounded-box>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtsRoundedBox],
})
export class Box {
	width = input.required<number>();
	height = input.required<number>();
	depth = input.required<number>();
	color = input.required<ColorRepresentation>();
	position = input<NgtVector3>([0, 0, 0]);
	rotation = input<NgtEuler>([0, 0, 0]);
}

@Component({
	standalone: true,
	template: `
		<ngt-color attach="background" *args="['#e0e0e0']" />

		<ngt-directional-light [position]="[1, 2, 1.5]" [intensity]="Math.PI * 0.5" [castShadow]="true" />
		<ngt-hemisphere-light [intensity]="Math.PI * 1.5" groundColor="red" />

		<app-circular-mask />
		<ngts-bounds [options]="{ fit: true, clip: true, observe: true }">
			<ngts-float [options]="{ floatIntensity: 4, rotationIntensity: 0, speed: 4 }">
				@switch (logo()) {
					@case ('angular') {
						<app-angular [invert]="invert()" [scale]="20" />
					}
					@case ('nx') {
						<app-nx [invert]="invert()" [scale]="20" />
					}
					@case ('nx-cloud') {
						<app-nx-cloud [invert]="invert()" [scale]="160" />
					}
				}
			</ngts-float>
			<app-box
				color="#EAC435"
				[width]="1"
				[height]="5"
				[depth]="1"
				[rotation]="[0, Math.PI / 4, 0]"
				[position]="[0, 0, -2]"
			/>
			<app-box color="#03CEA4" [width]="2" [height]="2" [depth]="2" [position]="[-2, 0, -2]" />
			<app-box color="#FB4D3D" [width]="2" [height]="2" [depth]="2" [position]="[2, 0, -2]" />
		</ngts-bounds>

		<ngts-environment [options]="{ preset: 'city' }" />
		<ngts-orbit-controls [options]="{ makeDefault: true }" />
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'inverted-stencil-buffer-soba-experience' },
	imports: [
		CircularMask,
		NgtsBounds,
		NgtsFloat,
		Box,
		NgtsEnvironment,
		NgtsOrbitControls,
		NgtArgs,
		Nx,
		Angular,
		NxCloud,
	],
})
export class Experience {
	protected readonly Math = Math;
	protected invert = invert;
	protected logo = logo;
}
