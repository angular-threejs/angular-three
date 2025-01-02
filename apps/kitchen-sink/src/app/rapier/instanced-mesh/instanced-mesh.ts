import {
	ChangeDetectionStrategy,
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	effect,
	ElementRef,
	signal,
	viewChild,
} from '@angular/core';
import { injectStore, NgtArgs, NgtThreeEvent, NON_ROOT } from 'angular-three';
import { NgtrInstancedRigidBodies, NgtrInstancedRigidBodyOptions } from 'angular-three-rapier';
import { Color, InstancedMesh } from 'three';
import { injectSuzanne } from '../suzanne';

const MAX_COUNT = 2000;

@Component({
    template: `
		<ngt-group>
			@if (gltf(); as gltf) {
				<ngt-object3D
					#instancedRigidBodies="instancedRigidBodies"
					[ngtrInstancedRigidBodies]="bodies()"
					[options]="{ colliders: 'hull' }"
				>
					<ngt-instanced-mesh
						*args="[gltf.nodes.Suzanne.geometry, undefined, MAX_COUNT]"
						#instancedMesh
						[castShadow]="true"
						[count]="bodies().length"
						(click)="onClick(instancedRigidBodies, $any($event))"
					>
						<ngt-mesh-physical-material />
					</ngt-instanced-mesh>
				</ngt-object3D>
			}
		</ngt-group>
	`,
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: 'instanced-mesh-rapier' },
    imports: [NgtrInstancedRigidBodies, NgtArgs]
})
export class InstancedMeshExample {
	static [NON_ROOT] = true;

	protected readonly MAX_COUNT = MAX_COUNT;

	private instancedMeshRef = viewChild<ElementRef<InstancedMesh>>('instancedMesh');

	protected gltf = injectSuzanne();
	private store = injectStore();

	protected bodies = signal(Array.from({ length: 100 }, () => this.createBody()));

	constructor() {
		effect(() => {
			const instancedMesh = this.instancedMeshRef()?.nativeElement;
			if (!instancedMesh) return;

			for (let i = 0; i < MAX_COUNT; i++) {
				instancedMesh.setColorAt(i, new Color(Math.random() * 0xffffff));
			}
			if (instancedMesh.instanceColor) {
				instancedMesh.instanceColor.needsUpdate = true;
			}
		});

		effect((onCleanup) => {
			const sub = this.store.snapshot.pointerMissed$.subscribe(() => {
				this.bodies.update((prev) => [...prev, this.createBody()]);
			});
			onCleanup(() => sub.unsubscribe());
		});
	}

	private createBody(): NgtrInstancedRigidBodyOptions {
		return {
			key: Math.random(),
			position: [Math.random() * 20, Math.random() * 20, Math.random() * 20],
			rotation: [Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2],
			scale: [0.5 + Math.random(), 0.5 + Math.random(), 0.5 + Math.random()],
		};
	}

	onClick(instancedRigidBodies: NgtrInstancedRigidBodies, event: NgtThreeEvent<MouseEvent>) {
		if (event.instanceId !== undefined) {
			instancedRigidBodies
				.rigidBodyRefs()
				.at(event.instanceId)
				?.rigidBody()
				?.applyTorqueImpulse({ x: 0, y: 50, z: 0 }, true);
		}
	}
}
