import { NgIf } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, Input, signal } from '@angular/core';
import type { Triplet } from '@pmndrs/cannon-worker-api';
import { NgtArgs } from 'angular-three';
import { NgtcPhysics } from 'angular-three-cannon';
import { NgtcDebug } from 'angular-three-cannon/debug';
import { injectBox, injectPlane } from 'angular-three-cannon/services';

@Component({
	selector: 'app-plane',
	standalone: true,
	template: `
		<ngt-mesh [ref]="planeApi.ref" [receiveShadow]="true">
			<ngt-plane-geometry *args="[1000, 1000]" />
			<ngt-mesh-standard-material color="#171717" />
		</ngt-mesh>
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Plane {
	Math = Math;
	@Input() position: Triplet = [0, 0, 0];

	planeApi = injectPlane(() => ({ mass: 0, position: this.position, args: [1000, 1000] }));
}

@Component({
	selector: 'app-box',
	standalone: true,
	template: `
		<ngt-mesh [ref]="boxApi.ref" [receiveShadow]="true" [castShadow]="true">
			<ngt-box-geometry *args="[2, 2, 2]" />
			<ngt-mesh-standard-material [roughness]="0.5" color="#575757" />
		</ngt-mesh>
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Box {
	@Input() position: Triplet = [0, 0, 0];

	boxApi = injectBox(() => ({ mass: 10000, position: this.position, args: [2, 2, 2] }));
}

@Component({
	standalone: true,
	template: `
		<ngt-point-light [position]="[-10, -10, 30]" [intensity]="0.25 * Math.PI" />
		<ngt-spot-light
			[intensity]="0.3 * Math.PI"
			[position]="[30, 30, 50]"
			[angle]="0.2"
			[penumbra]="1"
			[castShadow]="true"
		/>
		<ngtc-physics [gravity]="[0, 0, -25]" [iterations]="10">
			<ngtc-debug color="white" [disabled]="true">
				<app-plane [position]="[0, 0, -10]" />
				<app-plane *ngIf="showPlane()" />
				<app-box [position]="[1, 0, 1]" />
				<app-box [position]="[2, 1, 5]" />
				<app-box [position]="[0, 0, 6]" />
				<app-box [position]="[-1, 1, 8]" />
				<app-box [position]="[-2, 2, 13]" />
				<app-box [position]="[2, -1, 13]" />
				<app-box *ngIf="!showPlane()" [position]="[0.5, 1.0, 20]" />
			</ngtc-debug>
		</ngtc-physics>
	`,
	imports: [Box, Plane, NgtcPhysics, NgIf, NgtcDebug],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CannonScene {
	Math = Math;
	showPlane = signal(true);

	ngOnInit() {
		setTimeout(() => {
			this.showPlane.set(false);
		}, 5000);
	}
}
