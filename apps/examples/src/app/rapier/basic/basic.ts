import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, signal } from '@angular/core';
import { beforeRender } from 'angular-three';
import { NgtrCuboidCollider, NgtrRigidBody } from 'angular-three-rapier';

@Component({
	selector: 'app-rapier-basic',
	template: `
		<ngt-object3D rigidBody [options]="{ colliders: 'hull' }" [position]="[0, 5, 0]">
			<ngt-mesh>
				<ngt-torus-geometry />
			</ngt-mesh>
		</ngt-object3D>

		@if (currentCollider() === 1) {
			<ngt-object3D [cuboidCollider]="[1, 0.5, 1]" (collisionExit)="currentCollider.set(2)" />
		} @else if (currentCollider() === 2) {
			<ngt-object3D
				[cuboidCollider]="[3, 0.5, 3]"
				[position]="[0, -1, 0]"
				(collisionExit)="currentCollider.set(3)"
			/>
		} @else if (currentCollider() === 3) {
			<ngt-object3D
				[cuboidCollider]="[6, 0.5, 6]"
				[position]="[0, -3, 0]"
				(collisionExit)="currentCollider.set(4)"
			/>
		} @else {
			<ngt-object3D [cuboidCollider]="[20, 0.5, 20]" [position]="[0, -6, 0]" />
		}
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'experience-basic-rapier' },
	imports: [NgtrRigidBody, NgtrCuboidCollider],
})
export default class Basic {
	protected currentCollider = signal(1);

	constructor() {
		beforeRender(({ camera }) => {
			const currentCollider = this.currentCollider();
			if (currentCollider === 2) {
				camera.position.lerp({ x: 10, y: 10, z: 10 }, 0.1);
			} else if (currentCollider === 3) {
				camera.position.lerp({ x: 15, y: 15, z: 15 }, 0.1);
			} else if (currentCollider === 4) {
				camera.position.lerp({ x: 20, y: 40, z: 40 }, 0.1);
			}
		});
	}
}
