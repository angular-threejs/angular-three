import {
	afterNextRender,
	ChangeDetectionStrategy,
	Component,
	computed,
	CUSTOM_ELEMENTS_SCHEMA,
	ElementRef,
	inject,
	input,
	viewChild,
} from '@angular/core';
import {
	checkUpdate,
	extend,
	injectBeforeRender,
	NgtArgs,
	NgtInstancedMesh,
	omit,
	pick,
	resolveRef,
} from 'angular-three';
import { setUpdateRange } from 'angular-three-soba/misc';
import { injectAutoEffect } from 'ngxtension/auto-effect';
import { mergeInputs } from 'ngxtension/inject-inputs';
import { DynamicDrawUsage, InstancedBufferAttribute, InstancedMesh, Matrix4, Quaternion, Vector3 } from 'three';
import { NgtPositionMesh, PositionMesh } from './position-mesh';

const parentMatrix = new Matrix4();
const instanceMatrix = new Matrix4();
const tempMatrix = new Matrix4();
const translation = new Vector3();
const rotation = new Quaternion();
const scale = new Vector3();

@Component({
	selector: 'ngts-instance',
	standalone: true,
	template: `
		<ngt-position-mesh #positionMesh [instance]="instances.instancedMeshRef()" [parameters]="options()">
			<ng-content />
		</ngt-position-mesh>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtsInstance {
	options = input({} as Partial<NgtPositionMesh>);

	instances = inject(NgtsInstances);

	positionMeshRef = viewChild.required<ElementRef<PositionMesh>>('positionMesh');

	constructor() {
		extend({ PositionMesh });

		const autoEffect = injectAutoEffect();

		afterNextRender(() => {
			autoEffect(() => {
				return this.instances.subscribe(this.positionMeshRef().nativeElement);
			});
		});
	}
}

export interface NgtsInstancesOptions extends Partial<NgtInstancedMesh> {
	range?: number;
	limit: number;
	frames: number;
}

const defaultOptions: NgtsInstancesOptions = {
	limit: 1000,
	frames: Infinity,
};

@Component({
	selector: 'ngts-instances',
	standalone: true,
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
	imports: [NgtArgs],
})
export class NgtsInstances {
	protected readonly DynamicDrawUsage = DynamicDrawUsage;

	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });
	parameters = omit(this.options, ['limit', 'frames', 'range']);

	instancedMeshRef = viewChild.required<ElementRef<InstancedMesh>>('instancedMesh');

	limit = pick(this.options, 'limit');

	buffers = computed(() => {
		const limit = this.limit();
		const matrices = new Float32Array(limit * 16);

		for (let i = 0; i < limit; i++) {
			tempMatrix.identity().toArray(matrices, i * 16);
		}

		const colors = new Float32Array([...Array.from({ length: limit * 3 }, () => 1)]);
		return { matrices, colors };
	});

	instances: Array<ElementRef<PositionMesh> | PositionMesh> = [];

	constructor() {
		extend({ InstancedMesh, InstancedBufferAttribute });

		const autoEffect = injectAutoEffect();

		afterNextRender(() => {
			autoEffect(() => {
				const instancedMesh = this.instancedMeshRef()?.nativeElement;
				if (!instancedMesh) return;
				checkUpdate(instancedMesh.instanceMatrix);
			});
		});

		let iterations = 0;
		let count = 0;

		injectBeforeRender(() => {
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
				setUpdateRange(instancedMesh.instanceMatrix, { offset: 0, count: count * 16 });
				if (instancedMesh.instanceColor) {
					setUpdateRange(instancedMesh.instanceColor, { offset: 0, count: count * 3 });
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

	subscribe(ref: ElementRef<PositionMesh> | PositionMesh) {
		this.instances.push(ref);
		return () => {
			this.instances = this.instances.filter((i) => i !== ref);
		};
	}
}
