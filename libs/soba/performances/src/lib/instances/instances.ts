import {
	ChangeDetectionStrategy,
	Component,
	computed,
	CUSTOM_ELEMENTS_SCHEMA,
	effect,
	ElementRef,
	inject,
	input,
	viewChild,
} from '@angular/core';
import { beforeRender, checkUpdate, extend, NgtThreeElements, omit, pick, resolveRef } from 'angular-three';
import { setUpdateRange } from 'angular-three-soba/misc';
import { mergeInputs } from 'ngxtension/inject-inputs';
import * as THREE from 'three';
import { InstancedBufferAttribute, InstancedMesh } from 'three';
import { NgtPositionMesh, PositionMesh } from './position-mesh';

const parentMatrix = new THREE.Matrix4();
const instanceMatrix = new THREE.Matrix4();
const tempMatrix = new THREE.Matrix4();
const translation = new THREE.Vector3();
const rotation = new THREE.Quaternion();
const scale = new THREE.Vector3();

/**
 * A component representing a single instance within an NgtsInstances container.
 *
 * Each NgtsInstance is a virtual mesh that contributes to the parent InstancedMesh.
 * Instances can be individually positioned, rotated, scaled, and colored while
 * sharing the same geometry and material for optimal rendering performance.
 *
 * @example
 * ```html
 * <ngts-instances>
 *   <ngt-box-geometry />
 *   <ngt-mesh-standard-material />
 *   @for (item of items; track item.id) {
 *     <ngts-instance [options]="{ position: item.position, color: item.color }" />
 *   }
 * </ngts-instances>
 * ```
 */
@Component({
	selector: 'ngts-instance',
	template: `
		<ngt-position-mesh #positionMesh [instance]="instances.instancedMeshRef()" [parameters]="options()">
			<ng-content />
		</ngt-position-mesh>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtsInstance {
	/**
	 * Options passed to the underlying PositionMesh, including position, rotation, scale, and color.
	 */
	options = input({} as Partial<NgtPositionMesh>);

	/** @internal */
	protected instances = inject(NgtsInstances);

	/**
	 * Reference to the underlying PositionMesh element.
	 */
	positionMeshRef = viewChild.required<ElementRef<PositionMesh>>('positionMesh');

	constructor() {
		extend({ PositionMesh });

		effect((onCleanup) => {
			const cleanup = this.instances.subscribe(this.positionMeshRef().nativeElement);
			onCleanup(() => cleanup());
		});
	}
}

/**
 * Configuration options for the NgtsInstances component.
 */
export interface NgtsInstancesOptions extends Partial<NgtThreeElements['ngt-instanced-mesh']> {
	/**
	 * Limits the number of visible instances. When set, only the first `range` instances
	 * are rendered. Useful for dynamic instance counts without recreating the buffer.
	 */
	range?: number;
	/**
	 * The maximum number of instances that can be rendered.
	 * This determines the size of the instance buffers.
	 * @default 1000
	 */
	limit: number;
	/**
	 * The number of frames to update instance transforms.
	 * Set to Infinity for continuous updates, or a specific number to stop
	 * updating after that many frames (useful for static instances).
	 * @default Infinity
	 */
	frames: number;
}

const defaultOptions: NgtsInstancesOptions = {
	limit: 1000,
	frames: Infinity,
};

/**
 * A component that efficiently renders many instances of the same geometry and material.
 *
 * This component uses THREE.InstancedMesh under the hood to batch render multiple
 * objects with a single draw call, providing significant performance improvements
 * when rendering many similar objects.
 *
 * Place geometry and material as direct children, and NgtsInstance components
 * for each instance you want to render.
 *
 * @example
 * ```html
 * <ngts-instances [options]="{ limit: 100 }">
 *   <ngt-box-geometry />
 *   <ngt-mesh-standard-material />
 *   @for (i of [0, 1, 2, 3, 4]; track i) {
 *     <ngts-instance [options]="{ position: [i * 2, 0, 0] }" />
 *   }
 * </ngts-instances>
 * ```
 */
@Component({
	selector: 'ngts-instances',
	template: `
		<ngt-instanced-mesh
			#instancedMesh
			[userData]="{ instances }"
			[matrixAutoUpdate]="false"
			[raycast]="null"
			[parameters]="parameters()"
		>
			<ngt-instanced-buffer-attribute
				attach="instanceMatrix"
				[usage]="DynamicDrawUsage"
				[count]="buffers().matrices.length / 16"
				[array]="buffers().matrices"
				[itemSize]="16"
			/>
			<ngt-instanced-buffer-attribute
				attach="instanceColor"
				[usage]="DynamicDrawUsage"
				[count]="buffers().colors.length / 3"
				[array]="buffers().colors"
				[itemSize]="3"
			/>
			<ng-content />
		</ngt-instanced-mesh>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtsInstances {
	/** @internal */
	protected readonly DynamicDrawUsage = THREE.DynamicDrawUsage;

	/**
	 * Configuration options for the instanced rendering.
	 */
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });
	/** @internal */
	protected parameters = omit(this.options, ['limit', 'frames', 'range']);

	/**
	 * Reference to the underlying THREE.InstancedMesh element.
	 */
	instancedMeshRef = viewChild.required<ElementRef<THREE.InstancedMesh>>('instancedMesh');

	private limit = pick(this.options, 'limit');

	/** @internal */
	protected buffers = computed(() => {
		const limit = this.limit();
		const matrices = new Float32Array(limit * 16);

		for (let i = 0; i < limit; i++) {
			tempMatrix.identity().toArray(matrices, i * 16);
		}

		const colors = new Float32Array([...Array.from({ length: limit * 3 }, () => 1)]);
		return { matrices, colors };
	});

	/**
	 * Array of registered instance references. Used internally to track all instances.
	 */
	instances: Array<ElementRef<PositionMesh> | PositionMesh> = [];

	constructor() {
		extend({ InstancedMesh, InstancedBufferAttribute });

		effect(() => {
			const instancedMesh = this.instancedMeshRef()?.nativeElement;
			if (!instancedMesh) return;
			checkUpdate(instancedMesh.instanceMatrix);
		});

		let iterations = 0;
		let count = 0;

		beforeRender(() => {
			const instancedMesh = this.instancedMeshRef()?.nativeElement;
			if (!instancedMesh) return;
			const { frames, limit, range } = this.options();
			const { matrices, colors } = this.buffers();
			if (frames === Infinity || iterations < frames) {
				instancedMesh.updateMatrix();
				instancedMesh.updateMatrixWorld();
				parentMatrix.copy(instancedMesh.matrixWorld).invert();

				count = Math.min(limit, range !== undefined ? range : limit, this.instances.length);
				instancedMesh.count = count;
				setUpdateRange(instancedMesh.instanceMatrix, { start: 0, count: count * 16 });
				if (instancedMesh.instanceColor) {
					setUpdateRange(instancedMesh.instanceColor, { start: 0, count: count * 3 });
				}

				for (let i = 0; i < this.instances.length; i++) {
					const instance = resolveRef(this.instances[i]);
					if (instance) {
						// Multiply the inverse of the InstancedMesh world matrix or else
						// Instances will be double-transformed if <Instances> isn't at identity
						instance.matrixWorld.decompose(translation, rotation, scale);
						instanceMatrix.compose(translation, rotation, scale).premultiply(parentMatrix);
						instanceMatrix.toArray(matrices, i * 16);
						checkUpdate(instancedMesh.instanceMatrix);
						instance.color.toArray(colors, i * 3);
						checkUpdate(instancedMesh.instanceColor);
					}
				}
				iterations++;
			}
		});
	}

	/**
	 * Registers an instance with this container.
	 *
	 * @param ref - The PositionMesh reference or element to register
	 * @returns A cleanup function to unregister the instance
	 */
	subscribe(ref: ElementRef<PositionMesh> | PositionMesh) {
		this.instances.push(ref);
		return () => {
			this.instances = this.instances.filter((i) => i !== ref);
		};
	}
}
