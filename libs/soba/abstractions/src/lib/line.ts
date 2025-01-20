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

export type NgtLine2 = NgtThreeElement<typeof Line2>;
export type NgtLineMaterial = NgtThreeElement<typeof LineMaterial>;

export type NgtsLineOptions = Omit<LineMaterialParameters, 'vertexColors' | 'color'> &
	Omit<Partial<NgtLine2>, '__ngt_args__'> &
	Omit<Partial<NgtLineMaterial>, 'color' | 'vertexColors' | '__ngt_args__'> & {
		/** Array of colors, [0, 0, 0] */
		vertexColors?: Array<THREE.ColorRepresentation | [number, number, number] | [number, number, number, number]>;
		/** Line width, 1 */
		lineWidth: number;
		/** Segments, false */
		segments: boolean;
		/** Color */
		color?: THREE.ColorRepresentation;
	};

const defaultOptions: NgtsLineOptions = {
	lineWidth: 1,
	segments: false,
	color: 0xffffff,
};

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
	points =
		input.required<Array<THREE.Vector3 | THREE.Vector2 | [number, number, number] | [number, number] | number>>();
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });
	parameters = omit(this.options, ['color', 'vertexColors', 'lineWidth', 'segments', 'linewidth', 'dashed']);

	lineRef = viewChild<ElementRef<Line2 | LineSegments2>>('line');

	private store = injectStore();
	private size = this.store.size;

	private segments = pick(this.options, 'segments');
	private vertexColors = pick(this.options, 'vertexColors');

	protected dashed = pick(this.options, 'dashed');
	protected color = pick(this.options, 'color');
	protected vertex = computed(() => Boolean(this.vertexColors()));
	protected resolution = computed(() => [this.size().width, this.size().height]);

	private lineWidth = pick(this.options, 'lineWidth');
	private linewidth = pick(this.options, 'linewidth');

	line2 = computed(() => (this.segments() ? new LineSegments2() : new Line2()));
	lineMaterial = new LineMaterial();

	protected actualLineWidth = computed(() => this.linewidth() ?? this.lineWidth() ?? 1);
	protected itemSize = computed(() => ((this.vertexColors()?.[0] as number[] | undefined)?.length === 4 ? 4 : 3));

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

	// NOTE: use attached event to call computeLineDistances to ensure the geometry has been attached
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
