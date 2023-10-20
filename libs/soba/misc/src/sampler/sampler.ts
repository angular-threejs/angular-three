import { CUSTOM_ELEMENTS_SCHEMA, Component, Injector, Input, computed, effect, signal, untracked } from '@angular/core';
import { checkUpdate, extend, injectNgtRef, is, signalStore, type NgtGroup, type NgtRef } from 'angular-three';
import { assertInjector } from 'ngxtension/assert-injector';
import * as THREE from 'three';
import { Group } from 'three';
import { MeshSurfaceSampler } from 'three-stdlib';

type SamplePayload = {
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
};

type TransformPayload = SamplePayload & {
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
};

export type NgtsSurfaceSamplerTransformFn = (payload: TransformPayload, i: number) => void;

export type NgtsSurfaceSamplerState = {
	count: number;
	mesh: NgtRef<THREE.Mesh>;
	transform?: NgtsSurfaceSamplerTransformFn;
	weight?: string;
	instancedMesh?: NgtRef<THREE.InstancedMesh>;
};

const defaultState: Omit<NgtsSurfaceSamplerState, 'mesh'> = {
	count: 16,
};

export function injectNgtsSurfaceSampler(
	surfaceSamplerState: () => (Partial<Omit<NgtsSurfaceSamplerState, 'mesh'>> & { mesh: NgtRef<THREE.Mesh> }) | null,
	{ injector }: { injector?: Injector } = {},
) {
	return assertInjector(injectNgtsSurfaceSampler, injector, () => {
		const state = computed(() => ({ ...defaultState, ...(surfaceSamplerState() || {}) }));
		const _buffer = signal(
			(() => {
				const arr = Array.from({ length: state().count }, () => [
					1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1,
				]).flat();
				return new THREE.InstancedBufferAttribute(Float32Array.from(arr), 16);
			})(),
		);

		effect(() => {
			const { mesh, count, transform, instancedMesh, weight } = state();
			const meshObj = is.ref(mesh) ? mesh.nativeElement : mesh;
			if (!meshObj) return;
			const instancedMeshObj = is.ref(instancedMesh) ? instancedMesh.nativeElement : instancedMesh;
			const buffer = untracked(_buffer);

			const sampler = new MeshSurfaceSampler(meshObj);

			if (weight) {
				sampler.setWeightAttribute(weight);
			}

			sampler.build();

			const position = new THREE.Vector3();
			const normal = new THREE.Vector3();
			const color = new THREE.Color();
			const dummy = new THREE.Object3D();

			meshObj.updateMatrixWorld(true);

			for (let i = 0; i < count; i++) {
				sampler.sample(position, normal, color);

				if (typeof transform === 'function') {
					transform({ dummy, sampledMesh: meshObj, position, normal, color }, i);
				} else {
					dummy.position.copy(position);
				}

				dummy.updateMatrix();

				if (instancedMeshObj) {
					instancedMeshObj.setMatrixAt(i, dummy.matrix);
				}

				dummy.matrix.toArray(buffer.array, i * 16);
			}

			if (instancedMeshObj) {
				checkUpdate(instancedMeshObj.instanceMatrix);
			}

			checkUpdate(buffer);

			untracked(() => {
				_buffer.set(buffer.clone() as THREE.InstancedBufferAttribute);
			});
		});

		return _buffer.asReadonly();
	});
}

extend({ Group });

declare global {
	interface HTMLElementTagNameMap {
		/**
		 * @extends ngt-group
		 */
		'ngts-sampler': NgtsSurfaceSamplerState & NgtGroup;
	}
}

@Component({
	selector: 'ngts-sampler',
	standalone: true,
	template: `
		<ngt-group ngtCompound [ref]="samplerRef">
			<ng-content />
		</ngt-group>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsSampler {
	private inputs = signalStore<NgtsSurfaceSamplerState>({ count: 16 });

	@Input() samplerRef = injectNgtRef<Group>();

	@Input({ alias: 'count' }) set _count(count: number) {
		this.inputs.set({ count });
	}

	@Input({ alias: 'mesh' }) set _mesh(mesh: NgtRef<THREE.Mesh>) {
		this.inputs.set({ mesh });
	}

	@Input({ alias: 'transform' }) set _transform(transform: NgtsSurfaceSamplerTransformFn) {
		this.inputs.set({ transform });
	}

	@Input({ alias: 'weight' }) set _weight(weight: string) {
		this.inputs.set({ weight });
	}

	@Input({ alias: 'instancedMesh' }) set _instancedMesh(instancedMesh: NgtRef<THREE.InstancedMesh>) {
		this.inputs.set({ instancedMesh });
	}

	private surfaceSamplerState = computed(() => {
		const sampler = this.samplerRef.nativeElement;
		if (!sampler) return null;
		const { count, weight, transform, mesh, instancedMesh } = this.inputs.state();

		const instancedMeshRef =
			instancedMesh ??
			(sampler.children.find((child) => child.hasOwnProperty('instanceMatrix')) as THREE.InstancedMesh);

		const meshRef = mesh ?? (sampler.children.find((child) => child.type === 'Mesh') as THREE.Mesh);

		return { count, weight, transform, mesh: meshRef, instancedMesh: instancedMeshRef };
	});

	constructor() {
		injectNgtsSurfaceSampler(this.surfaceSamplerState);
	}
}
