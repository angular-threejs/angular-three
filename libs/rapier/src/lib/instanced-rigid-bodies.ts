import {
	ChangeDetectionStrategy,
	Component,
	computed,
	CUSTOM_ELEMENTS_SCHEMA,
	effect,
	ElementRef,
	inject,
	input,
	untracked,
	viewChild,
	viewChildren,
} from '@angular/core';
import { extend, getLocalState, NgtEuler, NgtObject3D, NgtQuaternion, NgtVector3, pick } from 'angular-three';
import { mergeInputs } from 'ngxtension/inject-inputs';
import { DynamicDrawUsage, InstancedMesh, Object3D } from 'three';
import { NgtrPhysics } from './physics';
import { NgtrAnyCollider, NgtrRigidBody, rigidBodyDefaultOptions } from './rigid-body';
import { NgtrRigidBodyOptions, NgtrRigidBodyState, NgtrRigidBodyType } from './types';
import { createColliderOptions } from './utils';

const defaultOptions: NgtrRigidBodyOptions = rigidBodyDefaultOptions;

@Component({
	selector: 'ngt-object3D[ngtrInstancedRigidBodies]',
	standalone: true,
	template: `
		<ngt-object3D #instanceWrapper>
			<ng-content />
		</ngt-object3D>

		@for (instance of instancesOptions(); track instance.key) {
			<ngt-object3D [ngtrRigidBody]="instance.type" [options]="instance">
				<ng-content select="[data-colliders]" />

				@for (childColliderOption of childColliderOptions(); track $index) {
					<ngt-object3D
						[ngtrCollider]="childColliderOption.shape"
						[args]="childColliderOption.args"
						[position]="childColliderOption.position"
						[rotation]="childColliderOption.rotation"
						[scale]="childColliderOption.scale"
						[name]="objectRef.nativeElement.name + '-instanced-collider-' + $index"
						[options]="childColliderOption.colliderOptions"
					/>
				}
			</ngt-object3D>
		}
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: {
		'[position]': 'position()',
		'[rotation]': 'rotation()',
		'[scale]': 'scale()',
		'[quaternion]': 'quaternion()',
		'[userData]': 'userData()',
	},
	imports: [NgtrRigidBody, NgtrRigidBody, NgtrAnyCollider],
})
export class NgtrInstancedRigidBodies {
	position = input<NgtVector3>([0, 0, 0]);
	rotation = input<NgtEuler>([0, 0, 0]);
	scale = input<NgtVector3>([1, 1, 1]);
	quaternion = input<NgtQuaternion>([0, 0, 0, 1]);
	userData = input<NgtObject3D['userData']>();
	instances = input<Array<NgtrRigidBodyOptions & { key: string | number; type: NgtrRigidBodyType }>>([]);
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });

	instanceWrapperRef = viewChild.required<ElementRef<Object3D>>('instanceWrapper');
	rigidBodyRefs = viewChildren(NgtrRigidBody);

	private physics = inject(NgtrPhysics);
	objectRef = inject<ElementRef<Object3D>>(ElementRef);

	private colliders = pick(this.options, 'colliders');

	private instancedMesh = computed(() => {
		const instanceWrapper = this.instanceWrapperRef().nativeElement;
		if (!instanceWrapper) return null;

		const localState = getLocalState(instanceWrapper);
		if (!localState) return null;

		// track object's children
		localState.objects();

		const firstChild = instanceWrapper.children[0];
		if (!firstChild || !(firstChild as InstancedMesh).isInstancedMesh) return null;

		return firstChild as InstancedMesh;
	});

	protected instancesOptions = computed(() => {
		const [instances, options] = [this.instances(), untracked(this.options)];
		return instances.map(
			(instance, index) =>
				({
					...options,
					...instance,
					key: `${instance.key}-${index}`,
					transformState: (state) => {
						const instancedMesh = untracked(this.instancedMesh);

						if (!instancedMesh) return state;

						return {
							...state,
							getMatrix: (matrix) => {
								instancedMesh.getMatrixAt(index, matrix);
								return matrix;
							},
							setMatrix: (matrix) => {
								instancedMesh.setMatrixAt(index, matrix);
								instancedMesh.instanceMatrix.needsUpdate = true;
							},
							meshType: 'instancedMesh',
						} as NgtrRigidBodyState;
					},
				}) as NgtrRigidBodyOptions & { key: string | number; type: NgtrRigidBodyType },
		);
	});

	protected childColliderOptions = computed(() => {
		const colliders = this.colliders();
		// if self colliders is false explicitly, disable auto colliders for this object entirely.
		if (colliders === false) return [];

		const physicsColliders = this.physics.colliders();
		// if physics colliders is false explicitly, disable auto colliders for this object entirely.
		if (physicsColliders === false) return [];

		const options = this.options();
		// if colliders on object is not set, use physics colliders
		if (!options.colliders) options.colliders = physicsColliders;

		const objectLocalState = getLocalState(this.objectRef.nativeElement);
		// track object's children
		objectLocalState?.nonObjects();
		objectLocalState?.objects();

		return createColliderOptions(this.objectRef.nativeElement, options);
	});

	constructor() {
		extend({ Object3D });
		effect(() => {
			this.setInstancedMeshMatrixEffect();
		});
	}

	private setInstancedMeshMatrixEffect() {
		const instancedMesh = this.instancedMesh();
		if (!instancedMesh) return;
		instancedMesh.instanceMatrix.setUsage(DynamicDrawUsage);
	}
}
