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

/**
 * Data provided for each sampled point on a mesh surface.
 * @internal
 */
interface SamplePayload {
	/** The world-space position of the sample point */
	position: THREE.Vector3;
	/** The interpolated normal at the sample point */
	normal: THREE.Vector3;
	/** The interpolated vertex color at the sample point */
	color: THREE.Color;
}

/**
 * Transform function signature for customizing instance placement.
 *
 * @param payload - Sample data including position, normal, color, and transform objects
 * @param i - The index of the current sample (0 to count-1)
 */
export type TransformFn = (payload: TransformPayload, i: number) => void;

/**
 * Extended sample payload including transform helpers.
 * Passed to the transform function for each sampled point.
 */
interface TransformPayload extends SamplePayload {
	/**
	 * A dummy Object3D for calculating the transform matrix.
	 * Modify its position, rotation, and scale - the matrix will be
	 * applied to the corresponding instance automatically.
	 */
	dummy: THREE.Object3D;
	/**
	 * Reference to the source mesh being sampled.
	 * Useful for accessing geometry attributes or applying parent transforms.
	 */
	sampledMesh: THREE.Mesh;
}

/**
 * Creates a computed signal that samples points on a mesh surface.
 *
 * Uses THREE.MeshSurfaceSampler to distribute points across the mesh geometry.
 * Returns an InstancedBufferAttribute containing transform matrices for each sample,
 * suitable for use with InstancedMesh or custom instancing solutions.
 *
 * @param mesh - Factory returning the mesh to sample from
 * @param options - Sampling configuration
 * @param options.count - Factory returning number of samples (default: 16)
 * @param options.transform - Factory returning custom transform function
 * @param options.weight - Factory returning weight attribute name for biased sampling
 * @param options.instancedMesh - Factory returning InstancedMesh to update directly
 * @returns Computed signal yielding InstancedBufferAttribute with 4x4 matrices
 *
 * @example
 * ```typescript
 * const meshRef = viewChild<ElementRef<THREE.Mesh>>('mesh');
 * const instancesRef = viewChild<ElementRef<THREE.InstancedMesh>>('instances');
 *
 * const samples = surfaceSampler(
 *   () => meshRef()?.nativeElement,
 *   {
 *     count: () => 1000,
 *     instancedMesh: () => instancesRef()?.nativeElement,
 *     transform: () => ({ dummy, position, normal }) => {
 *       dummy.position.copy(position);
 *       dummy.lookAt(position.clone().add(normal));
 *       dummy.scale.setScalar(Math.random() * 0.5 + 0.5);
 *     }
 *   }
 * );
 * ```
 */
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
		const arr = Array.from({ length: count?.() ?? 16 }, () => [
			1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1,
		]).flat();
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

/**
 * Configuration options for the NgtsSampler component.
 */
export interface NgtsSamplerOptions extends Partial<NgtThreeElements['ngt-group']> {
	/**
	 * Name of a vertex attribute to use for weighted sampling.
	 * Higher values = more likely to be sampled. Useful for concentrating
	 * instances in specific areas (e.g., based on vertex colors or custom data).
	 *
	 * @see https://threejs.org/docs/#examples/en/math/MeshSurfaceSampler.setWeightAttribute
	 */
	weight?: string;

	/**
	 * Custom transform function applied to each sampled instance.
	 * Receives sample data and should mutate `payload.dummy` to set
	 * position, rotation, and scale. The dummy's matrix is automatically
	 * updated and applied after the function returns.
	 */
	transform?: TransformFn;

	/**
	 * Number of samples to distribute across the mesh surface.
	 * @default 16
	 */
	count: number;
}

const defaultOptions: NgtsSamplerOptions = {
	count: 16,
};

/**
 * Distributes instances across a mesh surface using MeshSurfaceSampler.
 *
 * This component samples points on a mesh and automatically updates an
 * InstancedMesh with the sampled transforms. Both the source mesh and
 * target instances can be provided as inputs or as children.
 *
 * @example
 * ```html
 * <!-- External mesh and instances -->
 * <ngt-mesh #sourceMesh>
 *   <ngt-torus-knot-geometry />
 *   <ngt-mesh-standard-material />
 * </ngt-mesh>
 *
 * <ngts-sampler
 *   [mesh]="sourceMesh"
 *   [instances]="instancesRef"
 *   [options]="{ count: 500, transform: scatterTransform }"
 * >
 *   <ngt-instanced-mesh #instancesRef [count]="500">
 *     <ngt-sphere-geometry [args]="[0.02]" />
 *     <ngt-mesh-basic-material color="red" />
 *   </ngt-instanced-mesh>
 * </ngts-sampler>
 * ```
 */
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
	/**
	 * The mesh to sample points from.
	 * If not provided, uses the first Mesh child of this component.
	 */
	mesh = input<ElementRef<THREE.Mesh> | THREE.Mesh | null>(null);

	/**
	 * The InstancedMesh to update with sampled transforms.
	 * If not provided, uses the first InstancedMesh child of this component.
	 */
	instances = input<ElementRef<THREE.InstancedMesh> | THREE.InstancedMesh | null>(null);

	/**
	 * Sampler configuration including count, weight attribute, and transform function.
	 */
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });
	protected parameters = omit(this.options, ['weight', 'transform', 'count']);

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

		// NOTE: because surfaceSampler returns a computed, we need to consume
		//  this computed in a Reactive Context (an effect) to ensure the inner logic of
		//  surfaceSampler is run properly.
		const sampler = surfaceSampler(meshToSample, {
			count: this.count,
			transform: this.transform,
			weight: this.weight,
			instancedMesh: instancedMeshToSample,
		});
		effect(sampler);
	}
}
