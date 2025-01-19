import {
	ChangeDetectionStrategy,
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	ElementRef,
	input,
	signal,
	viewChild,
} from '@angular/core';
import { NgtArgs, NgtPortalDeclarations, NgtVector3 } from 'angular-three';
import * as THREE from 'three';

@Component({
	selector: 'app-condition-box',
	template: `
		@if (true) {
			<ngt-mesh [position]="position()">
				<ngt-box-geometry *args="[0.5, 0.5, 0.5]" (attached)="onAttach($event)" />

				<ng-content>
					<ngt-mesh-normal-material />
				</ng-content>
			</ngt-mesh>
		}
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConditionBox {
	position = input<NgtVector3>(0);

	onAttach(event: any) {
		console.log('in condition box', event);
	}
}

@Component({
	selector: 'app-box',
	template: `
		<ngt-mesh [position]="position()">
			<ngt-box-geometry *args="[0.5, 0.5, 0.5]" />

			<ng-content>
				<ngt-mesh-basic-material [color]="color()" (attached)="onAttach($event)" />
			</ng-content>

			<ng-content select="[data-children]" />
		</ngt-mesh>
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Box {
	position = input<NgtVector3>(0);
	color = input('turquoise');

	onAttach(event: any) {
		console.log('in box', event);
	}
}

@Component({
	selector: 'app-scene',
	template: `
		<ngt-ambient-light [intensity]="Math.PI" />

		<ngt-group #group>
			<ngt-mesh (pointerover)="color.set('orange')" (pointerout)="color.set('hotpink')">
				<ngt-sphere-geometry *args="[0.5, 32, 32]" />
				<ngt-mesh-toon-material [color]="color()" (attached)="onAttach($event)" />
			</ngt-mesh>

			<!--
			@if (show()) {
				<ngt-mesh [position]="[3, 0, 0]">
					<ngt-icosahedron-geometry />
					<ngt-mesh-normal-material />
				</ngt-mesh>
			}
      -->

			<!--
<app-box [position]="[1, 0, 0]" />
			<app-box [position]="[-1, 0, 0]" color="red" />
			<app-box [position]="[0, 1, 0]">
				<ngt-mesh-standard-material color="green" />
			</app-box>

			<app-box [position]="[0, -1, 0]" color="purple" />

			@if (show()) {
				<app-box [position]="[1, 1, 0]">
					@if (show()) {
						<ngt-mesh-phong-material color="yellow" />
					}
				</app-box>
			}

			<app-box [position]="[-1, -1, 0]" color="brown">
				<app-box data-children [position]="[-0.5, -0.5, 0]" color="pink" />
			</app-box>

			<app-box [position]="[-1, 1, 0]">
				<ngt-mesh-lambert-material color="orange" />
				<app-box data-children [position]="[-0.5, 0.5, 0]" color="skyblue" />
			</app-box>

			<app-box [position]="[1, -1, 0]">
				@if (true) {
					<ngt-mesh-normal-material />
				}

				@if (show()) {
					<app-box data-children [position]="[0.5, -0.5, 0]" color="black" />
				}
			</app-box>
-->

			<!--
			<app-condition-box [position]="[0, 2, 0]" />
			@if (show()) {
				<app-condition-box [position]="[0, -2, 0]" />
			}
      -->
		</ngt-group>
		<!--
		<ngt-portal [container]="virtualScene">
			<ngt-group *portalContent>
				<app-box />
				<app-condition-box />
			</ngt-group>
		</ngt-portal>
    -->
	`,
	imports: [NgtArgs, Box, ConditionBox, NgtPortalDeclarations],
	changeDetection: ChangeDetectionStrategy.OnPush,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	host: {
		'(document:click)': 'onDocumentClick($event)',
	},
})
export class Scene {
	protected readonly Math = Math;

	protected show = signal(true);
	protected color = signal('hotpink');
	protected sphereArgs = signal([0.5, 32, 32]);

	protected virtualScene = new THREE.Scene();

	private groupRef = viewChild.required<ElementRef<THREE.Group>>('group');

	constructor() {
		// setInterval(() => {
		// 	this.show.update((v) => !v);
		// 	this.sphereArgs.update((v) => [v[0] === 0.5 ? 1 : 0.5, v[1], v[2]]);
		// }, 2500);
		//
		// injectBeforeRender(() => {
		// 	const group = this.groupRef().nativeElement;
		// 	group.rotation.x += 0.01;
		// 	group.rotation.y += 0.01;
		// });
	}

	onDocumentClick(event: MouseEvent) {
		console.log('document', event);
	}

	onAttach(event: any) {
		console.log('in scene', event);
	}
}
