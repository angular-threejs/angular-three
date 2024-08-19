import {
	afterNextRender,
	ChangeDetectionStrategy,
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	effect,
	ElementRef,
	inject,
	Injector,
	input,
	signal,
	untracked,
	viewChild,
} from '@angular/core';
import { checkUpdate, extend, getLocalState, NgtGroup, omit, resolveRef } from 'angular-three';
import { assertInjector } from 'ngxtension/assert-injector';
import { injectAutoEffect } from 'ngxtension/auto-effect';
import { mergeInputs } from 'ngxtension/inject-inputs';
import { BufferGeometry, Color, Group, InstancedBufferAttribute, InstancedMesh, Mesh, Object3D, Vector3 } from 'three';
import { MeshSurfaceSampler } from 'three-stdlib';

interface SamplePayload {
	/**
	 * The position of the sample.
	 */
	position: Vector3;
	/**
	 * The normal of the mesh at the sampled position.
	 */
	normal: Vector3;
	/**
	 * The vertex color of the mesh at the sampled position.
	 */
	color: Color;
}

export type TransformFn = (payload: TransformPayload, i: number) => void;

interface TransformPayload extends SamplePayload {
	/**
	 * The dummy object used to transform each instance.
	 * This object's matrix will be updated after transforming & it will be used
	 * to set the instance's matrix.
	 */
	dummy: Object3D;
	/**
	 * The mesh that's initially passed to the sampler.
	 * Use this if you need to apply transforms from your mesh to your instances
	 * or if you need to grab attributes from the geometry.
	 */
	sampledMesh: Mesh;
}

export function injectSurfaceSampler(
	mesh: () => ElementRef<Mesh> | Mesh | null | undefined,
	options: () => {
		count?: number;
		transform?: TransformFn;
		weight?: string;
		instanceMesh?: ElementRef<InstancedMesh> | InstancedMesh | null;
	} = () => ({}),
	{ injector }: { injector?: Injector } = {},
) {
	return assertInjector(injectSurfaceSampler, injector, () => {
		const buffer = signal(
			(() => {
				const arr = Array.from({ length: options().count ?? 16 }, () => [
					1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1,
				]).flat();
				return new InstancedBufferAttribute(Float32Array.from(arr), 16);
			})(),
		);

		effect(
			() => {
				const currentMesh = resolveRef(mesh());
				if (!currentMesh) return;

				const localState = getLocalState(currentMesh);
				if (!localState) return;

				const nonObjects = localState.nonObjects();
				if (
					!nonObjects ||
					!nonObjects.length ||
					nonObjects.every((nonObject) => !(nonObject as BufferGeometry).isBufferGeometry)
				) {
					return;
				}

				const sampler = new MeshSurfaceSampler(currentMesh);

				const { weight, count = 16, transform, instanceMesh } = options();

				if (weight) {
					sampler.setWeightAttribute(weight);
				}

				sampler.build();

				const position = new Vector3();
				const normal = new Vector3();
				const color = new Color();
				const dummy = new Object3D();
				const instance = resolveRef(instanceMesh);

				currentMesh.updateMatrixWorld(true);

				for (let i = 0; i < count; i++) {
					sampler.sample(position, normal, color);

					if (typeof transform === 'function') {
						transform({ dummy, sampledMesh: currentMesh, position, normal, color }, i);
					} else {
						dummy.position.copy(position);
					}

					dummy.updateMatrix();

					if (instance) {
						instance.setMatrixAt(i, dummy.matrix);
					}

					dummy.matrix.toArray(untracked(buffer).array, i * 16);
				}

				if (instance) {
					checkUpdate(instance.instanceMatrix);
				}

				checkUpdate(buffer);

				buffer.set(
					new InstancedBufferAttribute(untracked(buffer).array, untracked(buffer).itemSize).copy(untracked(buffer)),
				);
			},
			{ allowSignalWrites: true },
		);

		return buffer.asReadonly();
	});
}

export interface NgtsSamplerOptions extends Partial<NgtGroup> {
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
	standalone: true,
	template: `
		<ngt-group #group [parameters]="parameters()">
			<ng-content />
		</ngt-group>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtsSampler {
	mesh = input<ElementRef<Mesh> | Mesh | null>(null);
	instances = input<ElementRef<InstancedMesh> | InstancedMesh | null>(null);
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });
	parameters = omit(this.options, ['weight', 'transform', 'count']);

	groupRef = viewChild.required<ElementRef<Group>>('group');

	private meshToSample = signal<Mesh | null>(null);
	private instancedToSample = signal<InstancedMesh | null>(null);

	constructor() {
		extend({ Group });
		const autoEffect = injectAutoEffect();
		const injector = inject(Injector);

		afterNextRender(() => {
			autoEffect(
				() => {
					const group = this.groupRef().nativeElement;
					const localState = getLocalState(group);
					if (!localState) return;

					const [mesh, instances] = [resolveRef(this.mesh()), resolveRef(this.instances())];

					this.meshToSample.set(mesh ?? (localState.objects().find((c) => c.type === 'Mesh') as Mesh));
					this.instancedToSample.set(
						instances ??
							(localState
								.objects()
								.find((c) => !!Object.getOwnPropertyDescriptor(c, 'instanceMatrix')) as InstancedMesh),
					);
				},
				{ allowSignalWrites: true },
			);

			injectSurfaceSampler(
				this.meshToSample,
				() => ({
					count: this.options().count,
					transform: this.options().transform,
					weight: this.options().weight,
					instanceMesh: this.instancedToSample(),
				}),
				{ injector },
			);
		});
	}
}
