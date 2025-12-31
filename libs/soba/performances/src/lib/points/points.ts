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
import { mergeInputs } from 'ngxtension/inject-inputs';
import * as THREE from 'three';
import { BufferAttribute, BufferGeometry, Points } from 'three';
import { NgtPositionPoint, PositionPoint } from './position-point';

/**
 * A component representing a single point within an NgtsPointsInstances container.
 *
 * Each NgtsPoint is a virtual point that contributes to the parent Points object.
 * Points can be individually positioned, colored, and sized while sharing the same
 * material for optimal rendering performance.
 *
 * @example
 * ```html
 * <ngts-points-instances>
 *   <ngt-points-material [size]="0.1" />
 *   @for (item of items; track item.id) {
 *     <ngts-point [options]="{ position: item.position, color: item.color, size: item.size }" />
 *   }
 * </ngts-points-instances>
 * ```
 */
@Component({
	selector: 'ngts-point',
	template: `
		<ngt-position-point #positionPoint [parameters]="options()" [instance]="points.pointsRef()">
			<ng-content />
		</ngt-position-point>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtsPoint {
	/**
	 * Options passed to the underlying PositionPoint, including position, color, and size.
	 */
	options = input({} as Partial<NgtPositionPoint>);

	/**
	 * Reference to the underlying PositionPoint element.
	 */
	positionPointRef = viewChild.required<ElementRef<PositionPoint>>('positionPoint');

	/** @internal */
	protected points = inject(NgtsPointsInstances);

	constructor() {
		extend({ PositionPoint });

		effect((onCleanup) => {
			const cleanUp = this.points.subscribe(this.positionPointRef().nativeElement);
			onCleanup(() => cleanUp());
		});
	}
}

/**
 * A component for rendering points from pre-computed buffer data.
 *
 * This component is optimized for cases where you have large arrays of point data
 * that you want to render directly without the overhead of individual point components.
 * Ideal for particle systems, data visualizations, or any scenario with many static
 * or programmatically-updated points.
 *
 * @example
 * ```html
 * <ngts-points-buffer [positions]="positionsArray" [colors]="colorsArray" [sizes]="sizesArray">
 *   <ngt-points-material [vertexColors]="true" />
 * </ngts-points-buffer>
 * ```
 */
@Component({
	selector: 'ngts-points-buffer',
	template: `
		<ngt-points #points [parameters]="options()">
			<ngt-buffer-geometry>
				<ngt-buffer-attribute
					attach="attributes.position"
					[count]="positions().length / stride()"
					[array]="positions()"
					[itemSize]="stride()"
					[usage]="DynamicDrawUsage"
				/>
				@if (colors(); as colors) {
					<ngt-buffer-attribute
						attach="attributes.color"
						[count]="colors.length / stride()"
						[array]="colors"
						[itemSize]="3"
						[usage]="DynamicDrawUsage"
					/>
				}
				@if (sizes(); as sizes) {
					<ngt-buffer-attribute
						attach="attributes.size"
						[count]="sizes.length / stride()"
						[array]="sizes"
						[itemSize]="1"
						[usage]="DynamicDrawUsage"
					/>
				}
			</ngt-buffer-geometry>
			<ng-content />
		</ngt-points>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtsPointsBuffer {
	/**
	 * Float32Array containing point positions. Length should be divisible by stride.
	 * For 3D points (stride=3): [x1, y1, z1, x2, y2, z2, ...]
	 */
	positions = input.required<Float32Array>();
	/**
	 * Optional Float32Array containing RGB color values for each point.
	 * Length should be (positions.length / stride) * 3.
	 */
	colors = input<Float32Array>();
	/**
	 * Optional Float32Array containing size values for each point.
	 * Length should be positions.length / stride.
	 */
	sizes = input<Float32Array>();
	/**
	 * The number of components per position (2 for 2D, 3 for 3D).
	 * @default 3
	 */
	stride = input<2 | 3>(3);
	/**
	 * Additional options passed to the Points object.
	 */
	options = input({} as Partial<NgtPositionPoint>);

	/**
	 * Reference to the underlying THREE.Points element.
	 */
	pointsRef = viewChild.required<ElementRef<THREE.Points>>('points');

	constructor() {
		extend({ Points, BufferAttribute, BufferGeometry });

		beforeRender(() => {
			const points = this.pointsRef()?.nativeElement;
			if (!points) return;

			const attributes = points.geometry.attributes;
			checkUpdate(attributes['position']);
			if (this.colors()) checkUpdate(attributes['color']);
			if (this.sizes()) checkUpdate(attributes['size']);
		});
	}

	/** @internal */
	protected readonly DynamicDrawUsage = THREE.DynamicDrawUsage;
}

const parentMatrix = new THREE.Matrix4();
const position = new THREE.Vector3();

/**
 * Configuration options for the NgtsPointsInstances component.
 */
export interface NgtsPointsInstancesOptions extends Partial<NgtThreeElements['ngt-points']> {
	/**
	 * Limits the number of visible points. When set, only the first `range` points
	 * are rendered. Useful for dynamic point counts without recreating buffers.
	 */
	range?: number;
	/**
	 * The maximum number of points that can be rendered.
	 * This determines the size of the position, color, and size buffers.
	 * @default 1000
	 */
	limit: number;
}

const defaultInstancesOptions: NgtsPointsInstancesOptions = { limit: 1000 };

/**
 * A component that efficiently renders many individual points with per-point control.
 *
 * Unlike NgtsPointsBuffer which uses pre-computed arrays, NgtsPointsInstances
 * allows you to add individual NgtsPoint children that can be dynamically
 * positioned, colored, and sized. Each point supports raycasting for interactivity.
 *
 * @example
 * ```html
 * <ngts-points-instances [options]="{ limit: 100 }">
 *   <ngt-points-material [size]="0.1" [vertexColors]="true" />
 *   @for (i of [0, 1, 2, 3, 4]; track i) {
 *     <ngts-point [options]="{ position: [i * 2, 0, 0], color: 'red' }" />
 *   }
 * </ngts-points-instances>
 * ```
 */
@Component({
	selector: 'ngts-points-instances',
	template: `
		<ngt-points
			#points
			[userData]="{ instances: positionPoints }"
			[matrixAutoUpdate]="false"
			[raycast]="null"
			[parameters]="parameters()"
		>
			<ngt-buffer-geometry>
				<ngt-buffer-attribute
					attach="attributes.position"
					[count]="buffers().positions.length / 3"
					[array]="buffers().positions"
					[itemSize]="3"
					[usage]="DynamicDrawUsage"
				/>
				<ngt-buffer-attribute
					attach="attributes.color"
					[count]="buffers().colors.length / 3"
					[array]="buffers().colors"
					[itemSize]="3"
					[usage]="DynamicDrawUsage"
				/>
				<ngt-buffer-attribute
					attach="attributes.size"
					[count]="buffers().sizes.length"
					[array]="buffers().sizes"
					[itemSize]="1"
					[usage]="DynamicDrawUsage"
				/>
			</ngt-buffer-geometry>
			<ng-content />
		</ngt-points>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtsPointsInstances {
	/**
	 * Configuration options for the points rendering.
	 */
	options = input(defaultInstancesOptions, { transform: mergeInputs(defaultInstancesOptions) });
	/**
	 * Computed parameters passed to the underlying Points object.
	 */
	parameters = omit(this.options, ['limit', 'range']);

	/**
	 * Reference to the underlying THREE.Points element.
	 */
	pointsRef = viewChild.required<ElementRef<THREE.Points>>('points');

	private limit = pick(this.options, 'limit');

	/**
	 * Computed buffer arrays for positions, colors, and sizes.
	 */
	buffers = computed(() => {
		const limit = this.limit();

		return {
			positions: new Float32Array(limit * 3),
			colors: Float32Array.from({ length: limit * 3 }, () => 1),
			sizes: Float32Array.from({ length: limit }, () => 1),
		};
	});

	/**
	 * Array of registered point references. Used internally to track all points.
	 */
	positionPoints: Array<ElementRef<PositionPoint> | PositionPoint> = [];

	constructor() {
		extend({ Points, BufferAttribute, BufferGeometry });

		effect(() => {
			const points = this.pointsRef()?.nativeElement;
			if (!points) return;
			checkUpdate(points.geometry.attributes['position']);
		});

		beforeRender(() => {
			const points = this.pointsRef()?.nativeElement;
			if (!points) return;

			const { limit, range } = this.options();
			const { positions, sizes, colors } = this.buffers();

			points.updateMatrix();
			points.updateMatrixWorld();
			parentMatrix.copy(points.matrixWorld).invert();

			points.geometry.drawRange.count = Math.min(
				limit,
				range !== undefined ? range : limit,
				this.positionPoints.length,
			);

			for (let i = 0; i < this.positionPoints.length; i++) {
				const positionPoint = resolveRef(this.positionPoints[i]);
				if (positionPoint) {
					positionPoint.getWorldPosition(position).applyMatrix4(parentMatrix);
					position.toArray(positions, i * 3);
					checkUpdate(points.geometry.attributes['position']);

					positionPoint.matrixWorldNeedsUpdate = true;
					positionPoint.color.toArray(colors, i * 3);
					checkUpdate(points.geometry.attributes['color']);

					sizes.set([positionPoint.size], i);
					checkUpdate(points.geometry.attributes['size']);
				}
			}
		});
	}

	/**
	 * Registers a point with this container.
	 *
	 * @param ref - The PositionPoint reference or element to register
	 * @returns A cleanup function to unregister the point
	 */
	subscribe(ref: ElementRef<PositionPoint> | PositionPoint) {
		this.positionPoints.push(ref);
		return () => {
			this.positionPoints = this.positionPoints.filter((p) => p !== ref);
		};
	}

	/** @internal */
	protected readonly DynamicDrawUsage = THREE.DynamicDrawUsage;
}
