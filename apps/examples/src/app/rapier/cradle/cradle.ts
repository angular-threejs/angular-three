import { ChangeDetectionStrategy, Component, computed, CUSTOM_ELEMENTS_SCHEMA, input, viewChild } from '@angular/core';
import { NgtEuler, NgtVector3 } from 'angular-three';
import { NgtrBallCollider, NgtrCylinderCollider, NgtrRigidBody, sphericalJoint } from 'angular-three-rapier';
import { ResetOrbitControls } from '../reset-orbit-controls';

@Component({
	selector: 'app-rod',
	template: `
		<ngt-group>
			<ngt-object3D #anchor="rigidBody" rigidBody [position]="position()" [rotation]="rotation()" />
			<ngt-object3D
				#rod="rigidBody"
				rigidBody
				[position]="position()"
				[rotation]="rotation()"
				[options]="{ colliders: false }"
			>
				<ngt-mesh castShadow receiveShadow [position.y]="-1" [scale]="[0.05, 2, 0.05]">
					<ngt-cylinder-geometry />
					<ngt-mesh-standard-material color="black" />
				</ngt-mesh>

				<ngt-mesh castShadow receiveShadow [position.y]="-2" [scale]="0.2">
					<ngt-sphere-geometry />
					<ngt-mesh-standard-material [metalness]="1" [roughness]="0.3" />
				</ngt-mesh>

				<ngt-object3D [cylinderCollider]="[1, 0.05]" [position]="[0, -1, 0]" />
				<ngt-object3D [ballCollider]="[0.2]" [position]="[0, -2, 0]" [options]="{ restitution: 1.2 }" />
			</ngt-object3D>
		</ngt-group>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtrRigidBody, NgtrCylinderCollider, NgtrBallCollider],
})
export class Rod {
	position = input<NgtVector3>([0, 0, 0]);
	rotation = input<NgtEuler>([0, 0, 0]);

	private anchorRef = viewChild.required('anchor', { read: NgtrRigidBody });
	private rodRef = viewChild.required('rod', { read: NgtrRigidBody });

	constructor() {
		const anchor = computed(() => this.anchorRef().rigidBody());
		const rod = computed(() => this.rodRef().rigidBody());

		sphericalJoint(anchor, rod, {
			data: { body1Anchor: [0, 0, 0], body2Anchor: [0, 0, 0] },
		});
	}
}

@Component({
	selector: 'app-cradle-rapier',
	template: `
		<ngt-group [rotation.x]="1" [scale]="3">
			<app-rod [position]="[0, 0, 0]" />
			<app-rod [position]="[0.5, 0, 0]" />
			<app-rod [position]="[1, 0, 0]" />
			<app-rod [position]="[1.5, 0, 0]" />
			<app-rod [position]="[2, 0, 0]" [rotation]="[0, 0, 2]" />
		</ngt-group>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	hostDirectives: [ResetOrbitControls],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [Rod],
})
export default class CradleExample {}
