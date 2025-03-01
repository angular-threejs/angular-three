import {
	ChangeDetectionStrategy,
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	DestroyRef,
	inject,
	output,
	signal,
	viewChild,
} from '@angular/core';
import { NgtArgs } from 'angular-three';
import { NgtrContactForcePayload, NgtrRigidBody } from 'angular-three-rapier';
import * as THREE from 'three';

// magic number: this is the start force for where the ball drops from
// and is used to calculate the color change
const startForce = 6500;
const startColor = new THREE.Color(0xffffff);
const floorColor = signal<THREE.ColorRepresentation>(startColor.clone().multiplyScalar(1).getHex());

@Component({
	selector: 'app-ball',
	template: `
		<ngt-object3D
			rigidBody
			[position]="[2, 15, 0]"
			[options]="{ colliders: 'ball', restitution: 1.5 }"
			(contactForce)="onContactForce($event)"
			(collisionEnter)="onCollisionEnter()"
		>
			<ngt-mesh castShadow receiveShadow>
				<ngt-sphere-geometry />
				<ngt-mesh-physical-material color="red" />
			</ngt-mesh>
		</ngt-object3D>
	`,
	imports: [NgtrRigidBody],
	changeDetection: ChangeDetectionStrategy.OnPush,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Ball {
	contactForce = output<number>();

	private rigidBodyRef = viewChild.required(NgtrRigidBody);

	protected onContactForce(event: NgtrContactForcePayload) {
		const rigidBody = this.rigidBodyRef().rigidBody();

		const { totalForceMagnitude } = event;

		if (totalForceMagnitude < 300) {
			rigidBody?.applyImpulse({ x: 0, y: 65, z: 0 }, true);
		}

		this.contactForce.emit(totalForceMagnitude);
		console.log('contact force', event);
	}

	protected onCollisionEnter() {
		console.log('collision enter');
	}
}

@Component({
	selector: 'app-floor',
	template: `
		<ngt-object3D rigidBody="fixed" [options]="{ colliders: 'cuboid' }">
			<ngt-mesh>
				<ngt-box-geometry *args="[10, 1, 10]" />
				<ngt-mesh-physical-material [color]="floorColor()" />
			</ngt-mesh>
		</ngt-object3D>
	`,
	imports: [NgtrRigidBody, NgtArgs],
	changeDetection: ChangeDetectionStrategy.OnPush,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Floor {
	protected readonly floorColor = floorColor;
}

@Component({
	selector: 'app-rapier-contact-force-events',
	template: `
		<ngt-group [position]="[0, -10, -10]">
			<app-ball (contactForce)="onContactForce($event)" />
			<app-floor />
		</ngt-group>
	`,
	imports: [Ball, Floor],
	changeDetection: ChangeDetectionStrategy.OnPush,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export default class ContactForceEventsExample {
	constructor() {
		inject(DestroyRef).onDestroy(() => {
			floorColor.set(startColor.clone().getHex());
		});
	}

	protected onContactForce(totalForceMagnitude: number) {
		const color = startColor.clone().multiplyScalar(1 - totalForceMagnitude / startForce);
		floorColor.set(color.getHex());
	}
}
