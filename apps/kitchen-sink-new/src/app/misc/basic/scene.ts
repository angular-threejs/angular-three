import {
	Attribute,
	ChangeDetectionStrategy,
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	ElementRef,
	input,
	signal,
	viewChild,
} from '@angular/core';
import { injectBeforeRender, injectStore, NgtArgs, NgtPortalDeclarations, NgtVector3 } from 'angular-three';
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

	constructor(@Attribute('context') context: string) {
		const store = injectStore();
		console.log({ context, store: store.snapshot.id, previous: store.snapshot.previousRoot });
	}

	onAttach(event: any) {
		console.log('in box', event);
	}
}

@Component({
	selector: 'app-nested-box',
	template: `
		<ngt-mesh [position]="position()">
			<ngt-box-geometry *args="[0.5, 0.5, 0.5]" />
			<ngt-mesh-basic-material [color]="color()" (attached)="onAttach($event)" />

			<ng-content>
				<app-box context="in nested box in root" [position]="position()" />
			</ng-content>

			<ng-content select="[data-children]" />
		</ngt-mesh>
	`,
	imports: [NgtArgs, Box],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NestedBox {
	position = input<NgtVector3>(0);
	color = input('turquoise');

	onAttach(event: any) {
		console.log('in nested box', event);
	}
}

@Component({
	selector: 'app-scene',
	template: `
		<ngt-ambient-light [intensity]="Math.PI" />
		<ngt-directional-light [position]="5" [intensity]="Math.PI" />

		<ngt-group #group>
			<!-- regular old three element -->
			<ngt-mesh (pointerover)="color.set('orange')" (pointerout)="color.set('hotpink')">
				<ngt-sphere-geometry *args="[0.5, 32, 32]" />
				<ngt-mesh-toon-material [color]="color()" (attached)="onAttach($event)" />
			</ngt-mesh>

			<ngt-primitive *args="[mesh]" [parameters]="{ position: [2, 0, 0] }" />

			<!--			<app-nested-box [position]="[-3, 0, 0]" />-->

			<!--			&lt;!&ndash; three element under condition &ndash;&gt;-->
			<!--			@if (show()) {-->
			<!--				<ngt-mesh [position]="[3, 0, 0]">-->
			<!--					<ngt-icosahedron-geometry />-->
			<!--					<ngt-mesh-normal-material />-->
			<!--				</ngt-mesh>-->
			<!--			}-->

			<!--			&lt;!&ndash; component wrapping three elemnent &ndash;&gt;-->
			<!--			<app-box [position]="[1, 0, 0]" />-->

			<!--			&lt;!&ndash; with input for default content &ndash;&gt;-->
			<!--			<app-box [position]="[-1, 0, 0]" color="red" />-->

			<!--			&lt;!&ndash; with custom ng content &ndash;&gt;-->
			<!--			<app-box [position]="[0, 1, 0]">-->
			<!--				<ngt-mesh-standard-material color="green" />-->
			<!--			</app-box>-->

			<!--			&lt;!&ndash; with property binding for input for default content &ndash;&gt;-->
			<!--			<app-box [position]="[0, -1, 0]" [color]="color()" />-->

			<!--			&lt;!&ndash; component under condition &ndash;&gt;-->
			<!--			@if (show()) {-->
			<!--				<app-box [position]="[1, 1, 0]">-->
			<!--					@if (show()) {-->
			<!--						<ngt-mesh-phong-material color="yellow" />-->
			<!--					}-->
			<!--				</app-box>-->
			<!--			}-->

			<!--			&lt;!&ndash; component with component as content &ndash;&gt;-->
			<!--			<app-box [position]="[-1, -1, 0]" color="brown" context="in root">-->
			<!--				<app-box data-children [position]="[-0.5, -0.5, 0]" color="pink" context="in box content in root" />-->
			<!--			</app-box>-->

			<!--			&lt;!&ndash; component with both content projection slots &ndash;&gt;-->
			<!--			<app-box [position]="[-1, 1, 0]">-->
			<!--				<ngt-mesh-lambert-material color="orange" />-->
			<!--				<app-box data-children [position]="[-0.5, 0.5, 0]" color="skyblue" />-->
			<!--			</app-box>-->

			<!--			&lt;!&ndash; component with conditional content slots &ndash;&gt;-->
			<!--			<app-box [position]="[1, -1, 0]">-->
			<!--				@if (true) {-->
			<!--					<ngt-mesh-normal-material />-->
			<!--				}-->

			<!--				@if (show()) {-->
			<!--					<app-box data-children [position]="[0.5, -0.5, 0]" color="black" />-->
			<!--				}-->
			<!--			</app-box>-->

			<!--			&lt;!&ndash; component with conditional template &ndash;&gt;-->
			<!--			<app-condition-box [position]="[0, 2, 0]" />-->

			<!--			&lt;!&ndash; component with conditional template under condition &ndash;&gt;-->
			<!--			@if (show()) {-->
			<!--				<app-condition-box [position]="[0, -2, 0]" />-->
			<!--			}-->
		</ngt-group>

		<!-- portal -->
		<!--		<ngt-portal [container]="virtualScene">-->
		<!--			<ngt-group *portalContent>-->
		<!--				&lt;!&ndash; component inside portal &ndash;&gt;-->
		<!--				<app-box context="in portal" />-->

		<!--				@if (show()) {-->
		<!--					<app-box context="in portal in condition" />-->
		<!--				}-->
		<!--			</ngt-group>-->
		<!--		</ngt-portal>-->
	`,
	imports: [NgtArgs, Box, ConditionBox, NgtPortalDeclarations, NestedBox],
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

	protected mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(), new THREE.MeshNormalMaterial());

	constructor() {
		setInterval(() => {
			this.show.update((v) => !v);
			this.sphereArgs.update((v) => [v[0] === 0.5 ? 1 : 0.5, v[1], v[2]]);
		}, 2500);

		injectBeforeRender(({ delta }) => {
			const group = this.groupRef().nativeElement;
			group.rotation.x += delta;
			group.rotation.y += delta;
		});
	}

	onDocumentClick(event: MouseEvent) {
		console.log('document', event);
	}

	onAttach(event: any) {
		console.log('in scene', event);
	}
}
