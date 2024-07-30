import {
	afterNextRender,
	ChangeDetectionStrategy,
	Component,
	computed,
	CUSTOM_ELEMENTS_SCHEMA,
	ElementRef,
	input,
	viewChild,
} from '@angular/core';
import { checkNeedsUpdate, injectStore, NgtAfterAttach, NgtArgs, NgtObject3DNode, omit, pick } from 'angular-three';
import { injectAutoEffect } from 'ngxtension/auto-effect';
import { mergeInputs } from 'ngxtension/inject-inputs';
import { Color, ColorRepresentation, Vector2, Vector3, Vector4 } from 'three';
import {
	Line2,
	LineGeometry,
	LineMaterial,
	LineMaterialParameters,
	LineSegments2,
	LineSegmentsGeometry,
} from 'three-stdlib';

export type NgtLine2 = NgtObject3DNode<Line2, typeof Line2>;
export type NgtLineMaterial = NgtObject3DNode<LineMaterial, [LineMaterialParameters]>;

export type NgtsLineOptions = Omit<LineMaterialParameters, 'vertexColors' | 'color'> &
	Omit<Partial<NgtLine2>, '__ngt_args__'> &
	Omit<Partial<NgtLineMaterial>, 'color' | 'vertexColors' | '__ngt_args__'> & {
		/** Array of colors, [0, 0, 0] */
		vertexColors?: Array<ColorRepresentation | [number, number, number] | [number, number, number, number]>;
		/** Line width, 1 */
		lineWidth: number;
		/** Segments, false */
		segments: boolean;
		/** Color */
		color?: ColorRepresentation;
	};

const defaultOptions: NgtsLineOptions = {
	lineWidth: 1,
	segments: false,
	color: 0xffffff,
};

@Component({
	selector: 'ngts-line',
	standalone: true,
	template: `
		<ngt-primitive *args="[line2()]" #line [parameters]="parameters()">
			<ngt-primitive *args="[lineGeometry()]" attach="geometry" (attached)="onGeometryAttached($any($event))" />
			<ngt-primitive
				*args="[lineMaterial]"
				attach="material"
				[color]="color()"
				[vertexColors]="vertex()"
				[resolution]="resolution()"
				[linewidth]="linewidth() ?? lineWidth() ?? 1"
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
	points = input.required<Array<Vector3 | Vector2 | [number, number, number] | [number, number] | number>>();
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });
	parameters = omit(this.options, ['color', 'vertexColors', 'lineWidth', 'segments', 'linewidth', 'dashed']);

	lineRef = viewChild<ElementRef<Line2 | LineSegments2>>('line');

	private store = injectStore();
	private size = this.store.select('size');

	private segments = pick(this.options, 'segments');
	private vertexColors = pick(this.options, 'vertexColors');

	dashed = pick(this.options, 'dashed');
	color = pick(this.options, 'color');
	lineWidth = pick(this.options, 'lineWidth');
	linewidth = pick(this.options, 'linewidth');
	vertex = computed(() => Boolean(this.vertexColors()));
	resolution = computed(() => [this.size().width, this.size().height]);

	line2 = computed(() => (this.segments() ? new LineSegments2() : new Line2()));
	lineMaterial = new LineMaterial();

	itemSize = computed(() => ((this.vertexColors()?.[0] as number[] | undefined)?.length === 4 ? 4 : 3));

	lineGeometry = computed(() => {
		const geom = this.segments() ? new LineSegmentsGeometry() : new LineGeometry();
		const pValues = this.points().map((p) => {
			const isArray = Array.isArray(p);
			return p instanceof Vector3 || p instanceof Vector4
				? [p.x, p.y, p.z]
				: p instanceof Vector2
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
			const cValues = vertexColors.map((c) => (c instanceof Color ? c.toArray() : c));
			// @ts-expect-error - flat() isn't defined
			geom.setColors(cValues.flat(), this.itemSize());
		}

		return geom;
	});

	// NOTE: use attached event to call computeLineDistances to ensure the geometry has been attached
	onGeometryAttached({ parent }: NgtAfterAttach<LineGeometry, Line2 | LineSegments2>) {
		parent.computeLineDistances();
	}

	constructor() {
		const autoEffect = injectAutoEffect();

		afterNextRender(() => {
			autoEffect(() => {
				const [lineMaterial, dashed] = [this.lineMaterial, this.dashed()];
				if (dashed) {
					lineMaterial.defines['USE_DASH'] = '';
				} else {
					delete lineMaterial.defines['USE_DASH'];
				}
				checkNeedsUpdate(lineMaterial);
			});

			autoEffect(() => {
				const [lineGeometry, lineMaterial] = [this.lineGeometry(), this.lineMaterial];
				return () => {
					lineGeometry.dispose();
					lineMaterial.dispose();
				};
			});
		});
	}
}
