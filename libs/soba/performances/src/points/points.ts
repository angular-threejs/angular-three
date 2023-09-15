import { NgIf, NgTemplateOutlet } from '@angular/common';
import {
	CUSTOM_ELEMENTS_SCHEMA,
	Component,
	ContentChild,
	Injector,
	Input,
	NgZone,
	TemplateRef,
	computed,
	effect,
	forwardRef,
	inject,
	signal,
	untracked,
	type OnInit,
} from '@angular/core';
import {
	checkUpdate,
	extend,
	injectBeforeRender,
	injectNgtRef,
	injectNgtStore,
	is,
	type NgtGroup,
	type NgtPoints,
	type NgtRef,
} from 'angular-three';
import { NgtsSobaContent } from 'angular-three-soba/utils';
import { createInjectionToken } from 'ngxtension/create-injection-token';
import * as THREE from 'three';
import { BufferAttribute, BufferGeometry, Points } from 'three';
import { NgtsPointsInput, type NgtsPointsBuffersState, type NgtsPointsInstancesState } from './points-input';
import { PositionPoint } from './position-point';

extend({ Points, BufferGeometry, BufferAttribute, PositionPoint });

declare global {
	interface HTMLElementTagNameMap {
		/**
		 * @extends ngt-points
		 */
		'ngts-points-instances': NgtsPointsInstancesState & NgtPoints;
		/**
		 * @extends ngt-points
		 */
		'ngts-points-buffers': NgtsPointsBuffersState & NgtPoints;
		/**
		 * @extends ngt-points
		 */
		'ngts-points': (NgtsPointsBuffersState | NgtsPointsInstancesState) & NgtsPoints;
		/**
		 * @extends ngt-group
		 */
		'ngt-position-point': PositionPoint & NgtGroup;
	}
}

export const [injectNgtsPointsInstanceApi, provideNgtsPointsInstancesApi] = createInjectionToken(
	function pointsInstancesApi(instances: NgtsPointsInstances) {
		return instances.api;
	},
	{ isRoot: false, deps: [forwardRef(() => NgtsPointsInstances)] },
);

@Component({
	selector: 'ngts-points-instances',
	standalone: true,
	template: `
		<ngt-points
			[ref]="pointsInput.pointsRef"
			[userData]="{ instances: points() }"
			[matrixAutoUpdate]="false"
			[raycast]="nullRaycast"
			ngtCompound
		>
			<ngt-buffer-geometry>
				<ngt-buffer-attribute
					attach="attributes.position"
					[count]="positions().length / 3"
					[array]="positions()"
					[itemSize]="3"
					[usage]="DynamicDrawUsage"
				/>
				<ngt-buffer-attribute
					attach="attributes.color"
					[count]="colors().length / 3"
					[array]="colors()"
					[itemSize]="3"
					[usage]="DynamicDrawUsage"
				/>
				<ngt-buffer-attribute
					attach="attributes.size"
					[count]="sizes().length"
					[array]="sizes()"
					[itemSize]="1"
					[usage]="DynamicDrawUsage"
				/>
			</ngt-buffer-geometry>
			<ng-content />
		</ngt-points>
	`,
	providers: [provideNgtsPointsInstancesApi()],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsPointsInstances {
	nullRaycast = () => null;
	DynamicDrawUsage = THREE.DynamicDrawUsage;

	pointsInput = inject(NgtsPointsInput);

	private positionPoints = signal<NgtRef<PositionPoint>[]>([]);
	private parentMatrix = new THREE.Matrix4();
	private position = new THREE.Vector3();

	points = this.positionPoints.asReadonly();
	positions = computed(() => new Float32Array(this.pointsInput.limit() * 3));
	colors = computed(() => Float32Array.from({ length: this.pointsInput.limit() * 3 }, () => 1));
	sizes = computed(() => Float32Array.from({ length: this.pointsInput.limit() }, () => 1));

	injector = inject(Injector);

	api = {
		getParent: () => this.pointsInput.pointsRef,
		subscribe: (pointRef: NgtRef<PositionPoint>) => {
			untracked(() => {
				this.positionPoints.update((s) => [...s, pointRef]);
			});
			return () => {
				untracked(() => {
					this.positionPoints.update((s) => s.filter((positionPoint) => positionPoint !== pointRef));
				});
			};
		},
	};

	constructor() {
		this.checkUpdatePositionAttribute();
		this.beforeRender();
	}

	private checkUpdatePositionAttribute() {
		effect(() => {
			const points = this.pointsInput.pointsRef.nativeElement;
			if (!points) return;
			checkUpdate(points.geometry.attributes['position']);
		});
	}

	private beforeRender() {
		injectBeforeRender(() => {
			const points = this.pointsInput.pointsRef.nativeElement;
			if (!points) return;
			const [limit, range, positionPoints, positions, colors, sizes] = [
				this.pointsInput.limit(),
				this.pointsInput.range(),
				this.positionPoints(),
				this.positions(),
				this.colors(),
				this.sizes(),
			];

			points.updateMatrix();
			points.updateMatrixWorld();
			this.parentMatrix.copy(points.matrixWorld).invert();

			points.geometry.drawRange.count = Math.min(
				limit,
				range !== undefined ? range : limit,
				positionPoints.length,
			);

			for (let i = 0; i < positionPoints.length; i++) {
				const positionPointRef = positionPoints[i];
				const positionPoint = is.ref(positionPointRef) ? positionPointRef.nativeElement : positionPointRef;
				if (!positionPoint) continue;
				positionPoint.getWorldPosition(this.position).applyMatrix4(this.parentMatrix);
				this.position.toArray(positions, i * 3);
				checkUpdate(points.geometry.attributes['position']);
				positionPoint.matrixWorldNeedsUpdate = true;

				positionPoint.color.toArray(colors, i * 3);
				checkUpdate(points.geometry.attributes['color']);

				sizes.set([positionPoint.size], i);
				checkUpdate(points.geometry.attributes['size']);
			}
		});
	}
}

@Component({
	selector: 'ngts-point',
	standalone: true,
	template: `
		<ngt-position-point
			[instance]="pointsInstancesApi.getParent()"
			[ref]="pointRef"
			[instanceKey]="pointRef"
			ngtCompound
		>
			<ng-content />
		</ngt-position-point>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsPoint implements OnInit {
	@Input() pointRef = injectNgtRef<PositionPoint>();

	private zone = inject(NgZone);
	private injector = inject(Injector);
	pointsInstancesApi = injectNgtsPointsInstanceApi();

	ngOnInit() {
		effect(
			(onCleanup) => {
				const cleanup = this.zone.runOutsideAngular(() => this.pointsInstancesApi.subscribe(this.pointRef));
				onCleanup(cleanup);
			},
			{ injector: this.injector },
		);
	}
}

@Component({
	selector: 'ngts-points-buffers',
	standalone: true,
	template: `
		<ngt-points [ref]="pointsInput.pointsRef" ngtCompound>
			<ngt-buffer-geometry>
				<ngt-buffer-attribute
					attach="attributes.position"
					[count]="pointsInput.positions().length / pointsInput.stride()"
					[array]="pointsInput.positions()"
					[itemSize]="pointsInput.stride()"
					[usage]="DynamicDrawUsage"
				/>
				<ngt-buffer-attribute
					attach="attributes.color"
					[count]="pointsInput.colorsLength() / pointsInput.stride()"
					[array]="pointsInput.colors()"
					[itemSize]="pointsInput.stride()"
					[usage]="DynamicDrawUsage"
				/>
				<ngt-buffer-attribute
					attach="attributes.size"
					[count]="pointsInput.sizesLength() / pointsInput.stride()"
					[array]="pointsInput.sizes()"
					[itemSize]="1"
					[usage]="DynamicDrawUsage"
				/>
			</ngt-buffer-geometry>
			<ng-content />
		</ngt-points>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsPointsBuffers {
	DynamicDrawUsage = THREE.DynamicDrawUsage;

	pointsInput = inject(NgtsPointsInput);

	store = injectNgtStore();

	constructor() {
		injectBeforeRender(() => {
			const points = this.pointsInput.pointsRef.nativeElement;
			if (!points) return;
			const [sizes, colors] = [this.pointsInput.sizes(), this.pointsInput.colors()];
			const attr = points.geometry.attributes;
			checkUpdate(attr['position']);
			if (colors) checkUpdate(attr['color']);
			if (sizes) checkUpdate(attr['size']);
		});
	}
}

@Component({
	selector: 'ngts-points',
	standalone: true,
	template: `
		<ngts-points-buffers *ngIf="positions()">
			<ng-container *ngTemplateOutlet="content" />
		</ngts-points-buffers>
		<ngts-points-instances *ngIf="!positions()" #pointsInstances>
			<!-- NOTE: passing in the injector to templateOutlet allow the consumers to abstract ngts-point -->
			<ng-container *ngTemplateOutlet="content; injector: pointsInstances.injector" />
		</ngts-points-instances>
	`,
	imports: [NgIf, NgtsPointsBuffers, NgtsPointsInstances, NgTemplateOutlet],
	providers: [{ provide: NgtsPointsInput, useExisting: NgtsPoints }],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsPoints extends NgtsPointsInput {
	@ContentChild(NgtsSobaContent, { static: true, read: TemplateRef }) content!: TemplateRef<unknown>;
}
