import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, signal } from '@angular/core';
import { injectBeforeRender, NgtArgs } from 'angular-three';
import { NgtrCuboidCollider, NgtrPhysics, NgtrRigidBody } from 'angular-three-rapier';
import { NgtsPerspectiveCamera } from 'angular-three-soba/cameras';
import { NgtsOrbitControls } from 'angular-three-soba/controls';

@Component({
	standalone: true,
	template: `
		<ngt-color attach="background" *args="['black']" />

		<ngts-perspective-camera [options]="{ makeDefault: true, position: [5, 5, 5] }" />

		<ngtr-physics [options]="{ debug: true }">
			<ngt-object3D ngtrRigidBody [options]="{ colliders: 'hull' }" [position]="[0, 5, 0]">
				<ngt-mesh>
					<ngt-torus-geometry />
				</ngt-mesh>
			</ngt-object3D>

			@if (currentCollider() === 1) {
				<ngt-object3D ngtrCuboidCollider [args]="[1, 0.5, 1]" (collisionExit)="currentCollider.set(2)" />
			} @else if (currentCollider() === 2) {
				<ngt-object3D
					ngtrCuboidCollider
					[position]="[0, -1, 0]"
					[args]="[3, 0.5, 3]"
					(collisionExit)="currentCollider.set(3)"
				/>
			} @else if (currentCollider() === 3) {
				<ngt-object3D
					ngtrCuboidCollider
					[position]="[0, -3, 0]"
					[args]="[6, 0.5, 6]"
					(collisionExit)="currentCollider.set(4)"
				/>
			} @else {
				<ngt-object3D ngtrCuboidCollider [position]="[0, -6, 0]" [args]="[20, 0.5, 20]" />
			}
		</ngtr-physics>

		<ngts-orbit-controls />
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'experience-basic-rapier' },
	imports: [NgtrPhysics, NgtrRigidBody, NgtrCuboidCollider, NgtArgs, NgtsOrbitControls, NgtsPerspectiveCamera],
})
export class Experience {
	protected currentCollider = signal(1);

	constructor() {
		injectBeforeRender(({ camera }) => {
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
