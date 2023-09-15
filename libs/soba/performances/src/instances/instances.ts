import { NgTemplateOutlet } from '@angular/common';
import {
	Component,
	computed,
	ContentChild,
	CUSTOM_ELEMENTS_SCHEMA,
	effect,
	forwardRef,
	inject,
	Injector,
	Input,
	NgZone,
	signal,
	TemplateRef,
	untracked,
} from '@angular/core';
import {
	checkUpdate,
	extend,
	injectBeforeRender,
	injectNgtRef,
	is,
	NgtArgs,
	signalStore,
	type NgtGroup,
	type NgtInstancedMesh,
	type NgtRef,
} from 'angular-three';
import { NgtsSobaContent } from 'angular-three-soba/utils';
import { createInjectionToken } from 'ngxtension/create-injection-token';
import * as THREE from 'three';
import { InstancedBufferAttribute, InstancedMesh } from 'three';
import { PositionMesh } from './position-mesh';

extend({ PositionMesh, InstancedMesh, InstancedBufferAttribute });

export type NgtsInstancesState = {
	range?: number;
	limit: number;
	frames: number;
};

declare global {
	interface HTMLElementTagNameMap {
		/**
		 * @extends ngt-group
		 */
		'ngt-position-mesh': PositionMesh & NgtGroup;
		/**
		 * @extends ngt-instanced-mesh
		 */
		'ngts-instances': NgtsInstancesState & NgtInstancedMesh;
	}
}

const parentMatrix = /*@__PURE__*/ new THREE.Matrix4();
const instanceMatrix = /*@__PURE__*/ new THREE.Matrix4();
const tempMatrix = /*@__PURE__*/ new THREE.Matrix4();
const translation = /*@__PURE__*/ new THREE.Vector3();
const rotation = /*@__PURE__*/ new THREE.Quaternion();
const scale = /*@__PURE__*/ new THREE.Vector3();

export const [injectNgtsInstancesApi, provideNgtsInstancesApi] = createInjectionToken(
	(instances: NgtsInstances) => instances.api,
	{ isRoot: false, deps: [forwardRef(() => NgtsInstances)] },
);

@Component({
	selector: 'ngts-instance',
	standalone: true,
	template: `
		<ngt-position-mesh
			[ref]="instanceRef"
			[instance]="instancesApi.getParent()"
			[instanceKey]="instanceRef"
			ngtCompound
		>
			<ng-content />
		</ngt-position-mesh>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsInstance {
	@Input() instanceRef = injectNgtRef<PositionMesh>();

	private zone = inject(NgZone);
	private injector = inject(Injector);
	instancesApi = injectNgtsInstancesApi();

	ngOnInit() {
		effect(
			(onCleanup) => {
				const cleanup = this.zone.runOutsideAngular(() => this.instancesApi.subscribe(this.instanceRef));
				onCleanup(cleanup);
			},
			{ injector: this.injector },
		);
	}
}

@Component({
	selector: 'ngts-instances',
	standalone: true,
	template: `
		<ngt-instanced-mesh
			[userData]="{ instances: meshes() }"
			[ref]="instancesRef"
			[matrixAutoUpdate]="false"
			[raycast]="nullRaycast"
			ngtCompound
		>
			<ngt-instanced-buffer-attribute
				*args="[buffers().matrices, 16]"
				attach="instanceMatrix"
				[usage]="DynamicDrawUsage"
			/>
			<ngt-instanced-buffer-attribute
				*args="[buffers().colors, 3]"
				attach="instanceColor"
				[usage]="DynamicDrawUsage"
			/>
			<ng-container *ngTemplateOutlet="content" />
		</ngt-instanced-mesh>
	`,
	imports: [NgtArgs, NgTemplateOutlet],
	providers: [provideNgtsInstancesApi()],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsInstances {
	DynamicDrawUsage = THREE.DynamicDrawUsage;
	nullRaycast = () => null;

	private inputs = signalStore<NgtsInstancesState>({ limit: 1000, frames: Infinity });

	@Input() instancesRef = injectNgtRef<InstancedMesh>();

	@Input({ alias: 'range' }) set _range(range: number) {
		this.inputs.set({ range });
	}

	@Input({ alias: 'limit' }) set _limit(limit: number) {
		this.inputs.set({ limit });
	}

	@Input({ alias: 'frames' }) set _frames(frames: number) {
		this.inputs.set({ frames });
	}

	@ContentChild(NgtsSobaContent, { static: true, read: TemplateRef }) content!: TemplateRef<unknown>;

	private limit = this.inputs.select('limit');

	private positionMeshes = signal<NgtRef<PositionMesh>[]>([]);
	meshes = this.positionMeshes.asReadonly();

	buffers = computed(() => {
		const limit = this.limit();
		const matrices = new Float32Array(limit * 16);

		for (let i = 0; i < limit; i++) {
			tempMatrix.identity().toArray(matrices, i * 16);
		}

		const colors = new Float32Array([...Array.from({ length: limit * 3 }, () => 1)]);
		return { matrices, colors };
	});

	api = {
		getParent: () => this.instancesRef,
		subscribe: (meshRef: NgtRef<PositionMesh>) => {
			untracked(() => {
				this.positionMeshes.update((s) => [...s, meshRef]);
			});
			return () => {
				untracked(() => {
					this.positionMeshes.update((s) => s.filter((positionMesh) => positionMesh !== meshRef));
				});
			};
		},
	};

	constructor() {
		this.checkUpdate();
		this.beforeRender();
	}

	private checkUpdate() {
		effect(() => {
			const instancedMesh = this.instancesRef.nativeElement;
			if (!instancedMesh) return;
			// NOTE: not sure why matrices ends up a different instance than array
			// we reassign it here
			instancedMesh.instanceMatrix.array = untracked(this.buffers).matrices;
			checkUpdate(instancedMesh.instanceMatrix);
		});
	}

	private beforeRender() {
		let count = 0;
		let updateRange = 0;
		injectBeforeRender(() => {
			const [{ frames, limit, range }, instancedMesh, instances, { matrices, colors }] = [
				this.inputs.get(),
				this.instancesRef.nativeElement,
				this.meshes(),
				this.buffers(),
			];
			if ((frames === Infinity || count < frames) && instancedMesh) {
				instancedMesh.updateMatrix();
				instancedMesh.updateMatrixWorld();
				parentMatrix.copy(instancedMesh.matrixWorld).invert();

				updateRange = Math.min(limit, range !== undefined ? range : limit, instances.length);
				instancedMesh.count = updateRange;
				instancedMesh.instanceMatrix.updateRange.count = updateRange * 16;
				if (instancedMesh.instanceColor) {
					instancedMesh.instanceColor.updateRange.count = updateRange * 3;
				}

				for (let i = 0; i < instances.length; i++) {
					const instanceRef = instances[i];
					const instance = is.ref(instanceRef) ? instanceRef.nativeElement : instanceRef;
					// Multiply the inverse of the InstancedMesh world matrix or else
					// Instances will be double-transformed if <Instances> isn't at identity
					instance.matrixWorld.decompose(translation, rotation, scale);
					instanceMatrix.compose(translation, rotation, scale).premultiply(parentMatrix);
					instanceMatrix.toArray(matrices, i * 16);
					checkUpdate(instancedMesh.instanceMatrix);
					instance.color.toArray(colors, i * 3);
					checkUpdate(instancedMesh.instanceColor);
				}
				count++;
			}
		});
	}
}
