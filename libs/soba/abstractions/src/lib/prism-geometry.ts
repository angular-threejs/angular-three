import {
	ChangeDetectionStrategy,
	Component,
	computed,
	CUSTOM_ELEMENTS_SCHEMA,
	ElementRef,
	input,
	viewChild,
} from '@angular/core';
import { extend, is, NgtArgs, NgtAttachable } from 'angular-three';
import { mergeInputs } from 'ngxtension/inject-inputs';
import * as THREE from 'three';
import { ExtrudeGeometry } from 'three';

export interface NgtsPrismGeometryOptions extends Omit<THREE.ExtrudeGeometryOptions, 'depth'> {
	/** Height */
	height: number;
}

const defaultOptions: NgtsPrismGeometryOptions = {
	height: 1,
	bevelEnabled: false,
};

@Component({
	selector: 'ngts-prism-geometry',
	template: `
		<ngt-extrude-geometry #geometry *args="[shape(), parameters()]" [attach]="attach()">
			<ng-content />
		</ngt-extrude-geometry>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs],
})
export class NgtsPrismGeometry {
	attach = input<NgtAttachable>('geometry');
	vertices = input.required<Array<THREE.Vector2 | [number, number]>>();
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });

	parameters = computed(() => ({ ...this.options(), depth: this.options().height }));
	shape = computed(() => {
		const vertices = this.vertices();
		const interpolatedVertices = vertices.map((v) =>
			is.three<THREE.Vector2>(v, 'isVector2') ? v : new THREE.Vector2(...v),
		);
		return new THREE.Shape(interpolatedVertices);
	});

	geometryRef = viewChild<ElementRef<THREE.ExtrudeGeometry>>('geometry');

	constructor() {
		extend({ ExtrudeGeometry });
	}
}
