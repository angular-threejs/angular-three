import {
	ChangeDetectionStrategy,
	Component,
	computed,
	CUSTOM_ELEMENTS_SCHEMA,
	effect,
	ElementRef,
	inject,
	input,
	untracked,
	viewChild,
} from '@angular/core';
import { extend, NgtArgs, NgtObjectEvents, NgtThreeElements, omit, pick } from 'angular-three';
import { mergeInputs } from 'ngxtension/inject-inputs';
import * as THREE from 'three';
import { ExtrudeGeometry, Mesh } from 'three';
import { toCreasedNormals } from 'three-stdlib';

const eps = 0.00001;

/**
 * Creates a rounded rectangle shape for extrusion.
 *
 * @param width - Width of the rectangle
 * @param height - Height of the rectangle
 * @param radius0 - Corner radius
 * @returns A THREE.Shape representing the rounded rectangle
 */
function createShape(width: number, height: number, radius0: number) {
	const shape = new THREE.Shape();
	const radius = radius0 - eps;
	shape.absarc(eps, eps, eps, -Math.PI / 2, -Math.PI, true);
	shape.absarc(eps, height - radius * 2, eps, Math.PI, Math.PI / 2, true);
	shape.absarc(width - radius * 2, height - radius * 2, eps, Math.PI / 2, 0, true);
	shape.absarc(width - radius * 2, eps, eps, 0, -Math.PI / 2, true);
	return shape;
}

/**
 * Configuration options for the NgtsRoundedBox component.
 */
export interface NgtsRoundedBoxOptions extends Partial<NgtThreeElements['ngt-mesh']> {
	/**
	 * Width of the box (X-axis).
	 * @default 1
	 */
	width: number;
	/**
	 * Height of the box (Y-axis).
	 * @default 1
	 */
	height: number;
	/**
	 * Depth of the box (Z-axis).
	 * @default 1
	 */
	depth: number;
	/**
	 * Radius of the rounded corners.
	 * @default 0.05
	 */
	radius: number;
	/**
	 * Number of curve segments for corner smoothness.
	 * @default 4
	 */
	smoothness: number;
	/**
	 * Number of bevel segments.
	 * @default 4
	 */
	bevelSegments: number;
	/**
	 * Number of extrusion steps.
	 * @default 1
	 */
	steps: number;
	/**
	 * Angle threshold for creased normals calculation (in radians).
	 * @default 0.4
	 */
	creaseAngle: number;
}

const defaultOptions: NgtsRoundedBoxOptions = {
	width: 1,
	height: 1,
	depth: 1,
	radius: 0.05,
	smoothness: 4,
	bevelSegments: 4,
	creaseAngle: 0.4,
	steps: 1,
};

/**
 * A component that renders a box with rounded edges.
 * Creates smooth, beveled corners on all edges of the box.
 *
 * @example
 * ```html
 * <ngts-rounded-box [options]="{ width: 2, height: 1, depth: 1, radius: 0.1 }">
 *   <ngt-mesh-standard-material color="orange" />
 * </ngts-rounded-box>
 * ```
 *
 * @example
 * ```html
 * <!-- With higher smoothness for smoother corners -->
 * <ngts-rounded-box
 *   [options]="{ width: 1, height: 1, depth: 1, radius: 0.2, smoothness: 8 }"
 *   (click)="onClick($event)"
 * >
 *   <ngt-mesh-basic-material color="blue" />
 * </ngts-rounded-box>
 * ```
 */
@Component({
	selector: 'ngts-rounded-box',
	template: `
		<ngt-mesh #mesh [parameters]="parameters()">
			<ngt-extrude-geometry #geometry *args="[shape(), geometryParameters()]" />
			<ng-content />
		</ngt-mesh>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs],
	hostDirectives: [
		{
			directive: NgtObjectEvents,
			outputs: [
				'click',
				'dblclick',
				'contextmenu',
				'pointerup',
				'pointerdown',
				'pointerover',
				'pointerout',
				'pointerenter',
				'pointerleave',
				'pointermove',
				'pointermissed',
				'pointercancel',
				'wheel',
			],
		},
	],
})
export class NgtsRoundedBox {
	/**
	 * Configuration options for the rounded box dimensions and appearance.
	 */
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });

	protected parameters = omit(this.options, [
		'width',
		'height',
		'depth',
		'radius',
		'smoothness',
		'bevelSegments',
		'steps',
		'creaseAngle',
	]);

	private width = pick(this.options, 'width');
	private height = pick(this.options, 'height');
	private depth = pick(this.options, 'depth');
	private radius = pick(this.options, 'radius');
	private smoothness = pick(this.options, 'smoothness');
	private bevelSegments = pick(this.options, 'bevelSegments');
	private steps = pick(this.options, 'steps');
	private creaseAngle = pick(this.options, 'creaseAngle');

	/**
	 * Reference to the underlying Mesh Three.js object.
	 */
	meshRef = viewChild.required<ElementRef<THREE.Mesh>>('mesh');

	/**
	 * Reference to the underlying ExtrudeGeometry Three.js object.
	 */
	geometryRef = viewChild<ElementRef<THREE.ExtrudeGeometry>>('geometry');

	protected shape = computed(() => {
		const [width, height, radius] = [this.width(), this.height(), this.radius()];
		return createShape(width, height, radius);
	});
	protected geometryParameters = computed(() => {
		const [depth, radius, smoothness, bevelSegments, steps] = [
			this.depth(),
			this.radius(),
			this.smoothness(),
			untracked(this.bevelSegments),
			untracked(this.steps),
		];

		return {
			depth: depth - radius * 2,
			bevelEnabled: true,
			bevelSegments: bevelSegments * 2,
			steps,
			bevelSize: radius - eps,
			bevelThickness: radius,
			curveSegments: smoothness,
		};
	});

	constructor() {
		extend({ ExtrudeGeometry, Mesh });

		const objectEvents = inject(NgtObjectEvents, { host: true });
		objectEvents.events.set(this.meshRef);

		effect(() => {
			const geometry = this.geometryRef()?.nativeElement;
			if (!geometry) return;

			geometry.center();
			toCreasedNormals(geometry, untracked(this.creaseAngle));
		});
	}
}
