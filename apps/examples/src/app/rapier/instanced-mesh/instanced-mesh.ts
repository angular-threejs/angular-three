import {
	ChangeDetectionStrategy,
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	effect,
	ElementRef,
	signal,
	viewChild,
} from '@angular/core';
import { checkUpdate, injectStore, NgtArgs, NgtThreeEvent } from 'angular-three';
import { NgtrInstancedRigidBodies, NgtrInstancedRigidBodyOptions } from 'angular-three-rapier';
import { Color, InstancedMesh } from 'three';
import { ResetOrbitControls } from '../reset-orbit-controls';
import { suzanneResource } from '../suzanne';

const MAX_COUNT = 2000;

@Component({
	selector: 'app-rapier-instanced-mesh',
	template: `
		<ngt-group>
			@if (gltf.value(); as gltf) {
				<ngt-object3D
					#instancedRigidBodies="instancedRigidBodies"
					[instancedRigidBodies]="bodies()"
					[options]="{ colliders: 'hull' }"
				>
					<ngt-instanced-mesh
						*args="[gltf.nodes.Suzanne.geometry, undefined, MAX_COUNT]"
						#instancedMesh
						castShadow
						[count]="bodies().length"
						(click)="onClick(instancedRigidBodies, $event)"
					>
						<ngt-mesh-physical-material />
					</ngt-instanced-mesh>
				</ngt-object3D>
			}
		</ngt-group>
	`,
	hostDirectives: [ResetOrbitControls],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'instanced-mesh-rapier' },
	imports: [NgtrInstancedRigidBodies, NgtArgs],
})
export default class InstancedMeshExample {
	protected readonly MAX_COUNT = MAX_COUNT;

	private instancedMeshRef = viewChild<ElementRef<InstancedMesh>>('instancedMesh');

	protected gltf = suzanneResource();
	private store = injectStore();

	protected bodies = signal(Array.from({ length: 100 }, () => this.createBody()));

	constructor() {
		effect(() => {
			const instancedMesh = this.instancedMeshRef()?.nativeElement;
			if (!instancedMesh) return;

			for (let i = 0; i < MAX_COUNT; i++) {
				instancedMesh.setColorAt(i, new Color(Math.random() * 0xffffff));
			}
			checkUpdate(instancedMesh.instanceColor);
		});

		effect((onCleanup) => {
			const sub = this.store.snapshot.pointerMissed$.subscribe(() => {
				this.bodies.update((prev) => [...prev, this.createBody()]);
			});
			onCleanup(() => sub.unsubscribe());
		});
	}

	protected onClick(instancedRigidBodies: NgtrInstancedRigidBodies, event: NgtThreeEvent<MouseEvent>) {
		if (event.instanceId !== undefined) {
			instancedRigidBodies
				.rigidBodyRefs()
				.at(event.instanceId)
				?.rigidBody()
				?.applyTorqueImpulse({ x: 0, y: 50, z: 0 }, true);
		}
	}

	private createBody(): NgtrInstancedRigidBodyOptions {
		return {
			key: Math.random(),
			position: [Math.random() * 20, Math.random() * 20, Math.random() * 20],
			rotation: [Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2],
			scale: [0.5 + Math.random(), 0.5 + Math.random(), 0.5 + Math.random()],
		};
	}
}
