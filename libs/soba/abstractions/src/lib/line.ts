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
import { checkNeedsUpdate, injectStore, is, NgtAfterAttach, NgtArgs, NgtThreeElement, omit, pick } from 'angular-three';
import { mergeInputs } from 'ngxtension/inject-inputs';
import * as THREE from 'three';
import {
	Line2,
	LineGeometry,
	LineMaterial,
	LineMaterialParameters,
	LineSegments2,
	LineSegmentsGeometry,
} from 'three-stdlib';

/**
 * Type definition for the Line2 Three.js element.
 */
export type NgtLine2 = NgtThreeElement<typeof Line2>;

/**
 * Type definition for the LineMaterial Three.js element.
 */
export type NgtLineMaterial = NgtThreeElement<typeof LineMaterial>;

/**
 * Configuration options for the NgtsLine component.
 */
export type NgtsLineOptions = Omit<LineMaterialParameters, 'vertexColors' | 'color'> &
	Omit<Partial<NgtLine2>, '__ngt_args__'> &
	Omit<Partial<NgtLineMaterial>, 'color' | 'vertexColors' | '__ngt_args__'> & {
		/**
		 * Array of colors for vertex coloring. Each color can be a ColorRepresentation,
		 * RGB tuple, or RGBA tuple (for transparency support).
		 * @default undefined
		 */
		vertexColors?: Array<THREE.ColorRepresentation | [number, number, number] | [number, number, number, number]>;
		/**
		 * Width of the line in pixels.
		 * @default 1
		 */
		lineWidth: number;
		/**
		 * Whether to render as line segments instead of a continuous line.
		 * @default false
		 */
		segments: boolean;
		/**
		 * Color of the line.
		 * @default 0xffffff
		 */
		color?: THREE.ColorRepresentation;
	};

const defaultOptions: NgtsLineOptions = {
	lineWidth: 1,
	segments: false,
	color: 0xffffff,
};

/**
 * A component for rendering lines with configurable width and styling using Line2 from three-stdlib.
 * Supports both continuous lines and line segments, with optional vertex coloring.
 *
 * @example
 * ```html
 * <ngts-line
 *   [points]="[[0, 0, 0], [1, 1, 1], [2, 0, 0]]"
 *   [options]="{ color: 'red', lineWidth: 2 }"
 * />
 * ```
 *
 * @example
 * ```html
 * <!-- With vertex colors -->
 * <ngts-line
 *   [points]="points"
 *   [options]="{ vertexColors: ['red', 'green', 'blue'], lineWidth: 3 }"
 * />
 * ```
 */
@Component({
	selector: 'ngts-line',
	template: `
		<ngt-primitive *args="[line2()]" #line [parameters]="parameters()">
			<ngt-primitive *args="[lineGeometry()]" attach="geometry" (attached)="onGeometryAttached($any($event))" />
			<ngt-primitive
				*args="[lineMaterial]"
				attach="material"
				[color]="color()"
				[vertexColors]="vertex()"
				[resolution]="resolution()"
				[linewidth]="actualLineWidth()"
				[dashed]="dashed()"
				[transparent]="itemSize() === 4"
				[parameters]="parameters()"
			/>
			<ng-content />
		</ngt-primitive>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs],
})
export class NgtsLine {
	/**
	 * Array of points defining the line path. Accepts Vector3, Vector2, coordinate tuples, or flat numbers.
	 */
	points =
		input.required<Array<THREE.Vector3 | THREE.Vector2 | [number, number, number] | [number, number] | number>>();

	/**
	 * Configuration options for the line appearance and behavior.
	 */
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });

	protected parameters = omit(this.options, [
		'color',
		'vertexColors',
		'lineWidth',
		'segments',
		'linewidth',
		'dashed',
	]);

	/**
	 * Reference to the underlying Line2 or LineSegments2 Three.js object.
	 */
	lineRef = viewChild<ElementRef<Line2 | LineSegments2>>('line');

	private store = injectStore();

	private segments = pick(this.options, 'segments');
	private vertexColors = pick(this.options, 'vertexColors');

	protected dashed = pick(this.options, 'dashed');
	protected color = pick(this.options, 'color');
	protected vertex = computed(() => Boolean(this.vertexColors()));
	protected resolution = computed(() => [this.store.size.width(), this.store.size.height()]);

	private lineWidth = pick(this.options, 'lineWidth');
	private linewidth = pick(this.options, 'linewidth');

	protected line2 = computed(() => (this.segments() ? new LineSegments2() : new Line2()));
	protected lineMaterial = new LineMaterial();

	protected actualLineWidth = computed(() => this.linewidth() ?? this.lineWidth() ?? 1);
	protected itemSize = computed(() => ((this.vertexColors()?.[0] as number[] | undefined)?.length === 4 ? 4 : 3));

	/**
	 * Computed LineGeometry or LineSegmentsGeometry based on the points and vertex colors.
	 * Other line components (like NgtsQuadraticBezierLine) access this to update positions.
	 */
	lineGeometry = computed(() => {
		const geom = this.segments() ? new LineSegmentsGeometry() : new LineGeometry();
		const pValues = this.points().map((p) => {
			const isArray = Array.isArray(p);

			if (is.three<THREE.Vector3>(p, 'isVector3')) {
				return [p.x, p.y, p.z];
			}

			return is.three<THREE.Vector3>(p, 'isVector3') || is.three<THREE.Vector4>(p, 'isVector4')
				? [p.x, p.y, p.z]
				: is.three<THREE.Vector2>(p, 'isVector2')
					? [p.x, p.y, 0]
					: isArray && p.length === 3
						? [p[0], p[1], p[2]]
						: isArray && p.length === 2
							? [p[0], p[1], 0]
							: p;
		});

		geom.setPositions(pValues.flat());

		const vertexColors = this.vertexColors();

		if (vertexColors) {
			const cValues = vertexColors.map((c) => (is.three<THREE.Color>(c, 'isColor') ? c.toArray() : c));
			// @ts-expect-error - flat() isn't defined
			geom.setColors(cValues.flat(), this.itemSize());
		}

		return geom;
	});

	/**
	 * Callback invoked when geometry is attached to the line.
	 * Computes line distances required for dashed lines to render correctly.
	 *
	 * @param event - The attach event containing the parent Line2 or LineSegments2
	 */
	onGeometryAttached({ parent }: NgtAfterAttach<LineGeometry, Line2 | LineSegments2>) {
		parent.computeLineDistances();
	}

	constructor() {
		effect(() => {
			const [lineMaterial, dashed] = [this.lineMaterial, this.dashed()];
			if (dashed) {
				lineMaterial.defines['USE_DASH'] = '';
			} else {
				delete lineMaterial.defines['USE_DASH'];
			}
			checkNeedsUpdate(lineMaterial);
		});

		effect((onCleanup) => {
			const [lineGeometry, lineMaterial] = [this.lineGeometry(), this.lineMaterial];
			onCleanup(() => {
				lineGeometry.dispose();
				lineMaterial.dispose();
			});
		});
	}
}
