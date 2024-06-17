import {
	CUSTOM_ELEMENTS_SCHEMA,
	ChangeDetectionStrategy,
	Component,
	afterNextRender,
	inject,
	input,
	signal,
} from '@angular/core';
import { Triplet } from '@pmndrs/cannon-worker-api';
import { NgtArgs, extend } from 'angular-three';
import { NgtcPhysics, NgtcPhysicsContent } from 'angular-three-cannon';
import { injectBox, injectPlane } from 'angular-three-cannon/body';
import { NgtcDebug } from 'angular-three-cannon/debug';
import * as THREE from 'three';
import { State } from './state';

extend(THREE);

@Component({
	selector: 'app-plane',
	standalone: true,
	template: `
		<ngt-mesh [ref]="plane.ref" [receiveShadow]="true">
			<ngt-plane-geometry *args="args" />
			<ngt-mesh-standard-material color="#171717" />
		</ngt-mesh>
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Plane {
	position = input<Triplet>([0, 0, 0]);
	args = [1000, 1000];
	plane = injectPlane(() => ({ mass: 0, position: this.position(), args: this.args }));
}

@Component({
	selector: 'app-box',
	standalone: true,
	template: `
		<ngt-mesh [ref]="box.ref" [receiveShadow]="true" [castShadow]="true">
			<ngt-box-geometry *args="args" />
			<ngt-mesh-standard-material [roughness]="0.5" color="#575757" />
		</ngt-mesh>
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Box {
	position = input<Triplet>([0, 0, 0]);
	args: Triplet = [2, 2, 2];
	box = injectBox(() => ({ mass: 10000, position: this.position(), args: this.args }));
}

@Component({
	standalone: true,
	template: `
		<ngt-point-light [position]="[-10, -10, 30]" [intensity]="0.25 * Math.PI" [decay]="0" />
		<ngt-spot-light
			[intensity]="0.3 * Math.PI"
			[position]="[30, 30, 50]"
			[angle]="0.2"
			[penumbra]="1"
			[decay]="0"
			[castShadow]="true"
		/>

		<ngtc-physics
			[options]="{ gravity: [0, 0, state.gravity()], iterations: 10 }"
			[debug]="{ enabled: state.isDebugging(), color: 'white' }"
		>
			<ng-template physicsContent>
				<app-plane [position]="[0, 0, -10]" />
				@if (showPlane()) {
					<app-plane />
				}

				<app-box [position]="[1, 0, 1]" />
				<app-box [position]="[2, 1, 5]" />
				<app-box [position]="[0, 0, 6]" />
				<app-box [position]="[-1, 1, 8]" />
				<app-box [position]="[-2, 2, 13]" />
				<app-box [position]="[2, -1, 13]" />

				@if (!showPlane()) {
					<app-box [position]="[0.5, 1.0, 20]" />
				}
			</ng-template>
		</ngtc-physics>
	`,
	imports: [Box, Plane, NgtcPhysics, NgtcPhysicsContent, NgtcDebug],
	changeDetection: ChangeDetectionStrategy.OnPush,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	host: { class: 'cannon-basic-experience' },
})
export class Experience {
	Math = Math;
	state = inject(State);
	showPlane = signal(true);

	constructor() {
		afterNextRender(() => {
			setTimeout(() => {
				this.showPlane.set(false);
			}, 5000);
		});
	}
}
