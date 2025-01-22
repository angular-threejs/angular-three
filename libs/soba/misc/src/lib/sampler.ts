import {
	ChangeDetectionStrategy,
	Component,
	computed,
	CUSTOM_ELEMENTS_SCHEMA,
	effect,
	ElementRef,
	input,
	viewChild,
} from '@angular/core';
import { checkUpdate, extend, getInstanceState, is, NgtThreeElements, omit, pick, resolveRef } from 'angular-three';
import { mergeInputs } from 'ngxtension/inject-inputs';
import * as THREE from 'three';
import { Group } from 'three';
import { MeshSurfaceSampler } from 'three-stdlib';

interface SamplePayload {
	/**
	 * The position of the sample.
	 */
	position: THREE.Vector3;
	/**
	 * The normal of the mesh at the sampled position.
	 */
	normal: THREE.Vector3;
	/**
	 * The vertex color of the mesh at the sampled position.
	 */
	color: THREE.Color;
}

export type TransformFn = (payload: TransformPayload, i: number) => void;

interface TransformPayload extends SamplePayload {
	/**
	 * The dummy object used to transform each instance.
	 * This object's matrix will be updated after transforming & it will be used
	 * to set the instance's matrix.
	 */
	dummy: THREE.Object3D;
	/**
	 * The mesh that's initially passed to the sampler.
	 * Use this if you need to apply transforms from your mesh to your instances
	 * or if you need to grab attributes from the geometry.
	 */
	sampledMesh: THREE.Mesh;
}

export function surfaceSampler(
	mesh: () => ElementRef<THREE.Mesh> | THREE.Mesh | null | undefined,
	{
		count,
		transform,
		weight,
		instancedMesh,
	}: {
		count?: () => number;
		transform?: () => TransformFn | undefined;
		weight?: () => string | undefined;
		instancedMesh?: () => ElementRef<THREE.InstancedMesh> | THREE.InstancedMesh | null | undefined;
	} = {},
) {
	const initialBufferAttribute = (() => {
		const arr = Array.from({ length: count?.() ?? 16 }, () => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]).flat();
		return new THREE.InstancedBufferAttribute(Float32Array.from(arr), 16);
	})();

	return computed(() => {
		const currentMesh = resolveRef(mesh());
		if (!currentMesh) return initialBufferAttribute;

		const instanceState = getInstanceState(currentMesh);
		if (!instanceState) return initialBufferAttribute;

		const nonObjects = instanceState.nonObjects();
		if (
			!nonObjects ||
			!nonObjects.length ||
			nonObjects.every((nonObject) => !is.three<THREE.BufferGeometry>(nonObject, 'isBufferGeometry'))
		) {
			return initialBufferAttribute;
		}

		const sampler = new MeshSurfaceSampler(currentMesh);
		const _count = count?.() ?? 16;
		const _transform = transform?.();
		const _weight = weight?.();

		if (_weight) {
			sampler.setWeightAttribute(_weight);
		}

		sampler.build();

		const position = new THREE.Vector3();
		const normal = new THREE.Vector3();
		const color = new THREE.Color();
		const dummy = new THREE.Object3D();
		const instance = resolveRef(instancedMesh?.());

		currentMesh.updateMatrixWorld(true);

		for (let i = 0; i < _count; i++) {
			sampler.sample(position, normal, color);

			if (typeof _transform === 'function') {
				_transform({ dummy, sampledMesh: currentMesh, position, normal, color }, i);
			} else {
				dummy.position.copy(position);
			}

			dummy.updateMatrix();

			if (instance) {
				instance.setMatrixAt(i, dummy.matrix);
			}

			dummy.matrix.toArray(initialBufferAttribute.array, i * 16);
		}

		if (instance) {
			checkUpdate(instance.instanceMatrix);
		}

		checkUpdate(initialBufferAttribute);

		return new THREE.InstancedBufferAttribute(initialBufferAttribute.array, initialBufferAttribute.itemSize).copy(
			initialBufferAttribute,
		);
	});
}

export interface NgtsSamplerOptions extends Partial<NgtThreeElements['ngt-group']> {
	/**
	 * The NAME of the weight attribute to use when sampling.
	 *
	 * @see https://threejs.org/docs/#examples/en/math/MeshSurfaceSampler.setWeightAttribute
	 */
	weight?: string;
	/**
	 * Transformation to be applied to each instance.
	 * Receives a dummy object3D with all the sampled data ( @see TransformPayload ).
	 * It should mutate `transformPayload.dummy`.
	 *
	 * @see ( @todo add link to example )
	 *
	 * There is no need to update the dummy's matrix
	 */
	transform?: TransformFn;
	count: number;
}

const defaultOptions: NgtsSamplerOptions = {
	count: 16,
};

@Component({
	selector: 'ngts-sampler',
	template: `
		<ngt-group #group [parameters]="parameters()">
			<ng-content />
		</ngt-group>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtsSampler {
	mesh = input<ElementRef<THREE.Mesh> | THREE.Mesh | null>(null);
	instances = input<ElementRef<THREE.InstancedMesh> | THREE.InstancedMesh | null>(null);
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });
	protected parameters = omit(this.options, ['weight', 'transform', 'count']);

	// NOTE: this could have been a viewChild.required, but we need to _try_ to consume
	//  this Signal earlier than when a viewChild.required would resolve.
	groupRef = viewChild.required<ElementRef<THREE.Group>>('group');

	private count = pick(this.options, 'count');
	private weight = pick(this.options, 'weight');
	private transform = pick(this.options, 'transform');

	constructor() {
		extend({ Group });

		const meshToSample = computed(() => {
			const group = this.groupRef().nativeElement;
			const instanceState = getInstanceState(group);
			if (!instanceState) return null;

			const mesh = resolveRef(this.mesh());
			if (mesh) return mesh;

			const objects = instanceState.objects();
			return objects.find((c) => is.three<THREE.Mesh>(c, 'isMesh'));
		});

		const instancedMeshToSample = computed(() => {
			const group = this.groupRef().nativeElement;
			const instanceState = getInstanceState(group);
			if (!instanceState) return null;

			const instances = resolveRef(this.instances());
			if (instances) return instances;

			const objects = instanceState.objects();
			return objects.find(
				(c) => !!Object.getOwnPropertyDescriptor(c, 'instanceMatrix'),
			) as unknown as THREE.InstancedMesh;
		});

		// NOTE: because injectSurfaceSampler returns a computed, we need to consume
		//  this computed in a Reactive Context (an effect) to ensure the inner logic of
		//  injectSurfaceSampler is run properly.
		const sampler = surfaceSampler(meshToSample, {
			count: this.count,
			transform: this.transform,
			weight: this.weight,
			instancedMesh: instancedMeshToSample,
		});
		effect(sampler);
	}
}
