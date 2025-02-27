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
import {
	applyProps,
	extend,
	getInstanceState,
	is,
	NgtEuler,
	NgtQuaternion,
	NgtThreeElements,
	NgtVector3,
	pick,
} from 'angular-three';
import { mergeInputs } from 'ngxtension/inject-inputs';
import * as THREE from 'three';
import { Object3D } from 'three';
import { NgtrPhysics } from './physics';
import { NgtrAnyCollider, NgtrRigidBody, rigidBodyDefaultOptions } from './rigid-body';
import { NgtrRigidBodyOptions, NgtrRigidBodyState, NgtrRigidBodyType } from './types';
import { createColliderOptions } from './utils';

export interface NgtrInstancedRigidBodyOptions {
	key: string | number;
	type?: NgtrRigidBodyType;
	position?: NgtVector3;
	rotation?: NgtEuler;
	scale?: NgtVector3;
	quaternion?: NgtQuaternion;
	userData?: NgtThreeElements['ngt-object3D']['userData'];
	options?: NgtrRigidBodyOptions;
}

const defaultOptions: NgtrRigidBodyOptions = rigidBodyDefaultOptions;

@Component({
	selector: 'ngt-object3D[instancedRigidBodies]',
	exportAs: 'instancedRigidBodies',
	template: `
		<ngt-object3D #instanceWrapper>
			<ng-content />
		</ngt-object3D>

		@for (instance of instancesOptions(); track instance.key) {
			<ngt-object3D
				[rigidBody]="instance.type"
				[options]="instance.options"
				[position]="instance.position"
				[rotation]="instance.rotation"
				[scale]="instance.scale"
				[quaternion]="instance.quaternion"
				[userData]="instance.userData"
				[name]="instance.key + '-instanced-rigid-body-' + $index"
			>
				<ng-content select="[data-colliders]" />

				@for (childColliderOption of childColliderOptions(); track $index) {
					<ngt-object3D
						[collider]="childColliderOption.shape"
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
	imports: [NgtrRigidBody, NgtrAnyCollider],
})
export class NgtrInstancedRigidBodies {
	position = input<NgtVector3>([0, 0, 0]);
	rotation = input<NgtEuler>();
	scale = input<NgtVector3>([1, 1, 1]);
	quaternion = input<NgtQuaternion>();
	userData = input<NgtThreeElements['ngt-object3D']['userData']>();
	instances = input([], {
		alias: 'instancedRigidBodies',
		transform: (value: Array<NgtrInstancedRigidBodyOptions> | '') => {
			if (value === '') return [];
			return value;
		},
	});
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });

	private object3DParameters = computed(() => {
		const [position, rotation, scale, quaternion, userData] = [
			this.position(),
			this.rotation(),
			this.scale(),
			this.quaternion(),
			this.userData(),
		];

		const parameters = { position, scale, userData };

		if (quaternion) {
			Object.assign(parameters, { quaternion });
		} else if (rotation) {
			Object.assign(parameters, { rotation });
		} else {
			Object.assign(parameters, { rotation: [0, 0, 0] });
		}

		return parameters;
	});

	private instanceWrapperRef = viewChild.required<ElementRef<THREE.Object3D>>('instanceWrapper');
	rigidBodyRefs = viewChildren(NgtrRigidBody);

	private physics = inject(NgtrPhysics);
	objectRef = inject<ElementRef<THREE.Object3D>>(ElementRef);

	private colliders = pick(this.options, 'colliders');

	private instancedMesh = computed(() => {
		const instanceWrapper = this.instanceWrapperRef().nativeElement;
		if (!instanceWrapper) return null;

		const instanceState = getInstanceState(instanceWrapper);
		if (!instanceState) return null;

		// track object's children
		instanceState.objects();
		const firstChild = instanceWrapper.children[0];
		if (!firstChild || !(firstChild as THREE.InstancedMesh).isInstancedMesh) return null;

		return firstChild as THREE.InstancedMesh;
	});

	protected instancesOptions = computed(() => {
		const [instances, options, instancedMesh] = [this.instances(), untracked(this.options), this.instancedMesh()];
		if (!instancedMesh) return [];
		return instances.map(
			(instance, index) =>
				({
					...instance,
					options: {
						...options,
						...(instance.options || {}),
						transformState: (state) => {
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
					},
					key: `${instance.key}-${index}` + `${instancedMesh?.uuid || ''}`,
				}) as Omit<NgtrInstancedRigidBodyOptions, 'options' | 'position' | 'scale'> & {
					position: NgtVector3;
					scale: NgtVector3;
					options: Partial<NgtrRigidBodyOptions>;
				},
		);
	});

	protected childColliderOptions = computed(() => {
		const colliders = this.colliders();
		// if self colliders is false explicitly, disable auto colliders for this object entirely.
		if (colliders === false) return [];

		const physicsColliders = this.physics.colliders();
		// if physics colliders is false explicitly AND colliders is not set, disable auto colliders for this object entirely.
		if (physicsColliders === false && colliders === undefined) return [];

		const options = this.options();
		// if colliders on object is not set, use physics colliders
		if (!options.colliders) options.colliders = physicsColliders;

		const objectInstanceState = getInstanceState(this.objectRef.nativeElement);
		if (!objectInstanceState) return [];

		// track object's parent and non-object children
		const [parent] = [objectInstanceState.parent(), objectInstanceState.nonObjects()];
		if (!parent || !is.three<THREE.Object3D>(parent, 'isObject3D')) return [];

		return createColliderOptions(this.objectRef.nativeElement, options);
	});

	constructor() {
		extend({ Object3D });

		effect(() => {
			const object3DParameters = this.object3DParameters();
			applyProps(this.objectRef.nativeElement, object3DParameters);
		});

		effect(() => {
			const instancedMesh = this.instancedMesh();
			if (!instancedMesh) return;
			instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
		});
	}
}
