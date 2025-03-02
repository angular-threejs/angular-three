import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, signal, viewChild } from '@angular/core';
import { ActiveCollisionTypes } from '@dimforge/rapier3d-compat';
import { injectBeforeRender, NgtArgs } from 'angular-three';
import { NgtrRigidBody } from 'angular-three-rapier';
import { ResetOrbitControls } from '../reset-orbit-controls';

@Component({
	selector: 'app-ball',
	template: `
		<ngt-object3D
			rigidBody="kinematicPosition"
			[options]="{ colliders: 'ball', activeCollisionTypes }"
			(collisionEnter)="color.set('green')"
			(collisionExit)="color.set('blue')"
		>
			<ngt-mesh>
				<ngt-sphere-geometry />
				<ngt-mesh-standard-material [color]="color()" />
			</ngt-mesh>
		</ngt-object3D>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	imports: [NgtrRigidBody],
})
export class Ball {
	protected readonly activeCollisionTypes = ActiveCollisionTypes.DEFAULT | ActiveCollisionTypes.KINEMATIC_FIXED;

	private rigidBodyRef = viewChild.required(NgtrRigidBody);

	protected color = signal('blue');

	constructor() {
		injectBeforeRender(({ clock }) => {
			const rb = this.rigidBodyRef().rigidBody();
			if (!rb) return;

			rb.setTranslation({ x: Math.sin(clock.elapsedTime) * 3, y: 0, z: 0 }, true);
		});
	}
}

@Component({
	selector: 'app-wall',
	template: `
		<ngt-object3D rigidBody="fixed" [options]="{ colliders: 'cuboid' }">
			<ngt-mesh>
				<ngt-box-geometry *args="[0.5, 5, 2]" />
				<ngt-mesh-standard-material transparent [opacity]="0.5" />
			</ngt-mesh>
		</ngt-object3D>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	imports: [NgtrRigidBody, NgtArgs],
})
export class Wall {}

@Component({
	selector: 'app-active-collision-types-rapier',
	template: `
		<ngt-group>
			<app-ball />
			<app-wall />
		</ngt-group>
	`,
	hostDirectives: [ResetOrbitControls],
	changeDetection: ChangeDetectionStrategy.OnPush,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	imports: [Ball, Wall],
})
export default class ActiveCollisionTypesExample {}
