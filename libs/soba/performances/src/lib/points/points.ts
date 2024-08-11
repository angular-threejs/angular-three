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
import { checkUpdate, extend, injectBeforeRender, NgtPoints, omit, pick, resolveRef } from 'angular-three';
import { injectAutoEffect } from 'ngxtension/auto-effect';
import { mergeInputs } from 'ngxtension/inject-inputs';
import { BufferAttribute, BufferGeometry, DynamicDrawUsage, Matrix4, Points, Vector3 } from 'three';
import { NgtPositionPoint, PositionPoint } from './position-point';

@Component({
	selector: 'ngts-point',
	standalone: true,
	template: `
		<ngt-position-point #positionPoint [parameters]="options()" [instance]="points.pointsRef()">
			<ng-content />
		</ngt-position-point>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtsPoint {
	options = input({} as Partial<NgtPositionPoint>);

	positionPointRef = viewChild.required<ElementRef<PositionPoint>>('positionPoint');

	points = inject(NgtsPointsInstances);

	constructor() {
		extend({ PositionPoint });

		const autoEffect = injectAutoEffect();

		afterNextRender(() => {
			autoEffect(() => {
				return this.points.subscribe(this.positionPointRef().nativeElement);
			});
		});
	}
}

@Component({
	selector: 'ngts-points-buffer',
	standalone: true,
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
	positions = input.required<Float32Array>();
	colors = input<Float32Array>();
	sizes = input<Float32Array>();
	stride = input<2 | 3>(3);
	options = input({} as Partial<NgtPositionPoint>);

	pointsRef = viewChild.required<ElementRef<Points>>('points');

	constructor() {
		extend({ Points, BufferAttribute, BufferGeometry });

		injectBeforeRender(() => {
			const points = this.pointsRef()?.nativeElement;
			if (!points) return;

			const attributes = points.geometry.attributes;
			checkUpdate(attributes['position']);
			if (this.colors()) checkUpdate(attributes['color']);
			if (this.sizes()) checkUpdate(attributes['size']);
		});
	}

	protected readonly DynamicDrawUsage = DynamicDrawUsage;
}

const parentMatrix = new Matrix4();
const position = new Vector3();

export interface NgtsPointsInstancesOptions extends Partial<NgtPoints> {
	range?: number;
	limit: number;
}

const defaultInstancesOptions: NgtsPointsInstancesOptions = { limit: 1000 };

@Component({
	selector: 'ngts-points-instances',
	standalone: true,
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
	options = input(defaultInstancesOptions, { transform: mergeInputs(defaultInstancesOptions) });
	parameters = omit(this.options, ['limit', 'range']);

	pointsRef = viewChild.required<ElementRef<Points>>('points');

	private limit = pick(this.options, 'limit');

	buffers = computed(() => {
		const limit = this.limit();

		return {
			positions: new Float32Array(limit * 3),
			colors: Float32Array.from({ length: limit * 3 }, () => 1),
			sizes: Float32Array.from({ length: limit }, () => 1),
		};
	});

	positionPoints: Array<ElementRef<PositionPoint> | PositionPoint> = [];

	constructor() {
		extend({ Points, BufferAttribute, BufferGeometry });
		const autoEffect = injectAutoEffect();

		afterNextRender(() => {
			autoEffect(() => {
				const points = this.pointsRef()?.nativeElement;
				if (!points) return;
				checkUpdate(points.geometry.attributes['position']);
			});
		});

		injectBeforeRender(() => {
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

	subscribe(ref: ElementRef<PositionPoint> | PositionPoint) {
		this.positionPoints.push(ref);
		return () => {
			this.positionPoints = this.positionPoints.filter((p) => p !== ref);
		};
	}

	protected readonly DynamicDrawUsage = DynamicDrawUsage;
}
