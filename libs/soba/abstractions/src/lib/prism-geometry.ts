import {
	ChangeDetectionStrategy,
	Component,
	computed,
	CUSTOM_ELEMENTS_SCHEMA,
	ElementRef,
	input,
	viewChild,
} from '@angular/core';
import { extend, NgtArgs } from 'angular-three';
import { mergeInputs } from 'ngxtension/inject-inputs';
import { ExtrudeGeometry, ExtrudeGeometryOptions, Shape, Vector2 } from 'three';

export interface NgtsPrismGeometryOptions extends Omit<ExtrudeGeometryOptions, 'depth'> {
	/** Height */
	height: number;
}

const defaultOptions: NgtsPrismGeometryOptions = {
	height: 1,
	bevelEnabled: false,
};

@Component({
	selector: 'ngts-prism-geometry',
	standalone: true,
	template: `
		<ngt-extrude-geometry #geometry *args="[shape(), parameters()]">
			<ng-content />
		</ngt-extrude-geometry>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs],
})
export class NgtsPrismGeometry {
	vertices = input.required<Array<Vector2 | [number, number]>>();
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });

	parameters = computed(() => ({ ...this.options(), depth: this.options().height }));
	shape = computed(() => {
		const vertices = this.vertices();
		const interpolatedVertices = vertices.map((v) => (v instanceof Vector2 ? v : new Vector2(...v)));
		return new Shape(interpolatedVertices);
	});

	geometryRef = viewChild<ElementRef<ExtrudeGeometry>>('geometry');

	constructor() {
		extend({ ExtrudeGeometry });
	}
}
