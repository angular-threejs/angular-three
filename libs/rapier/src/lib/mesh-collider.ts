import {
	ChangeDetectionStrategy,
	Component,
	computed,
	CUSTOM_ELEMENTS_SCHEMA,
	ElementRef,
	inject,
	input,
} from '@angular/core';
import { extend, getInstanceState } from 'angular-three';
import * as THREE from 'three';
import { Object3D } from 'three';
import { NgtrAnyCollider, NgtrRigidBody } from './rigid-body';
import type { NgtrRigidBodyAutoCollider } from './types';
import { createColliderOptions } from './utils';

@Component({
	selector: 'ngt-object3D[ngtrMeshCollider]',
	template: `
		<ng-content />
		@for (childColliderOption of childColliderOptions(); track $index) {
			<ngt-object3D
				[ngtrCollider]="childColliderOption.shape"
				[args]="childColliderOption.args"
				[position]="childColliderOption.position"
				[rotation]="childColliderOption.rotation"
				[scale]="childColliderOption.scale"
				[name]="objectRef.nativeElement.name + '-mesh-collider-' + $index"
				[options]="childColliderOption.colliderOptions"
			/>
		}
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtrAnyCollider],
})
export class NgtrMeshCollider {
	colliders = input.required<NgtrRigidBodyAutoCollider>({ alias: 'ngtrMeshCollider' });

	objectRef = inject<ElementRef<THREE.Object3D>>(ElementRef);
	private rigidBody = inject(NgtrRigidBody);

	protected childColliderOptions = computed(() => {
		const rigidBodyOptions = this.rigidBody.options();
		rigidBodyOptions.colliders = this.colliders();

		const objectInstaceState = getInstanceState(this.objectRef.nativeElement);
		if (!objectInstaceState) return [];

		// track object's children
		objectInstaceState.nonObjects();
		objectInstaceState.objects();

		return createColliderOptions(this.objectRef.nativeElement, rigidBodyOptions, false);
	});

	constructor() {
		extend({ Object3D });
		this.objectRef.nativeElement.userData ??= {};
		this.objectRef.nativeElement.userData['ngtrRapierType'] = 'MeshCollider';
	}
}
