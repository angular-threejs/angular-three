import {
	ChangeDetectionStrategy,
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	effect,
	ElementRef,
	inject,
	viewChild,
} from '@angular/core';
import { injectBeforeRender, NgtArgs, NON_ROOT } from 'angular-three';
import { NgtrInstancedRigidBodies, NgtrPhysics } from 'angular-three-rapier';
import { Color, InstancedMesh, Vector3 } from 'three';

const BALLS = 1000;

@Component({
	standalone: true,
	template: `
		<ngt-group>
			<ngt-object3D [ngtrInstancedRigidBodies]="bodies" [options]="{ colliders: 'ball', linearDamping: 5 }">
				<ngt-instanced-mesh #instancedMesh *args="[undefined, undefined, BALLS]" [castShadow]="true">
					<ngt-sphere-geometry *args="[0.2]" />
					<ngt-mesh-physical-material [roughness]="0" [metalness]="0.5" color="yellow" />
				</ngt-instanced-mesh>
			</ngt-object3D>
		</ngt-group>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'cluster-rapier' },
	imports: [NgtrInstancedRigidBodies, NgtArgs],
})
export class ClusterExample {
	static [NON_ROOT] = true;

	protected readonly BALLS = BALLS;
	protected bodies = Array.from({ length: BALLS }, (_, index) => {
		return {
			key: index,
			position: [Math.floor(index / 30), (index % 30) * 0.5, 0] as [number, number, number],
		};
	});

	private rigidBodiesRef = viewChild.required(NgtrInstancedRigidBodies);
	private instancedMeshRef = viewChild<ElementRef<InstancedMesh>>('instancedMesh');

	private physics = inject(NgtrPhysics);

	constructor() {
		injectBeforeRender(() => {
			const paused = this.physics.paused();
			if (paused) return;

			const rigidBodies = this.rigidBodiesRef().rigidBodyRefs();
			rigidBodies.forEach((body) => {
				const rigidBody = body.rigidBody();
				if (rigidBody) {
					const { x, y, z } = rigidBody.translation();
					const p = new Vector3(x, y, z);
					p.normalize().multiplyScalar(-0.01);
					rigidBody.applyImpulse(p, true);
				}
			});
		});

		effect(() => {
			const instancedMesh = this.instancedMeshRef()?.nativeElement;
			if (!instancedMesh) return;

			for (let i = 0; i < BALLS; i++) {
				instancedMesh.setColorAt(i, new Color(Math.random() * 0xffffff));
			}
			if (instancedMesh.instanceColor) instancedMesh.instanceColor.needsUpdate = true;
		});
	}
}
