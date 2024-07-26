import {
	afterNextRender,
	ChangeDetectionStrategy,
	Component,
	computed,
	CUSTOM_ELEMENTS_SCHEMA,
	ElementRef,
	input,
	untracked,
	viewChild,
} from '@angular/core';
import { extend, NgtArgs, NgtMesh, omit, pick } from 'angular-three';
import { injectAutoEffect } from 'ngxtension/auto-effect';
import { mergeInputs } from 'ngxtension/inject-inputs';
import { ExtrudeGeometry, Mesh, Shape } from 'three';
import { toCreasedNormals } from 'three-stdlib';

const eps = 0.00001;

function createShape(width: number, height: number, radius0: number) {
	const shape = new Shape();
	const radius = radius0 - eps;
	shape.absarc(eps, eps, eps, -Math.PI / 2, -Math.PI, true);
	shape.absarc(eps, height - radius * 2, eps, Math.PI, Math.PI / 2, true);
	shape.absarc(width - radius * 2, height - radius * 2, eps, Math.PI / 2, 0, true);
	shape.absarc(width - radius * 2, eps, eps, 0, -Math.PI / 2, true);
	return shape;
}

export interface NgtsRoundedBoxOptions extends Partial<NgtMesh> {
	width: number;
	height: number;
	depth: number;
	radius: number;
	smoothness: number;
	bevelSegments: number;
	steps: number;
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

@Component({
	selector: 'ngts-rounded-box',
	standalone: true,
	template: `
		<ngt-mesh #mesh [parameters]="parameters()">
			<ngt-extrude-geometry #geometry *args="[shape(), params()]" />
			<ng-content />
		</ngt-mesh>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs],
})
export class NgtsRoundedBox {
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });
	parameters = omit(this.options, [
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

	meshRef = viewChild.required<ElementRef<Mesh>>('mesh');
	geometryRef = viewChild<ElementRef<ExtrudeGeometry>>('geometry');

	shape = computed(() => {
		const [width, height, radius] = [this.width(), this.height(), this.radius()];
		return createShape(width, height, radius);
	});
	params = computed(() => {
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

		const autoEffect = injectAutoEffect();
		afterNextRender(() => {
			autoEffect(() => {
				const geometry = this.geometryRef()?.nativeElement;
				if (!geometry) return;

				this.shape();
				this.params();

				geometry.center();
				toCreasedNormals(geometry, untracked(this.creaseAngle));
			});
		});
	}
}
