import {
	CUSTOM_ELEMENTS_SCHEMA,
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	effect,
	input,
	viewChild,
} from '@angular/core';
import { NgtArgs, NgtThreeElements, getInstanceState } from 'angular-three';
import * as THREE from 'three';

@Component({
	selector: 'ngts-computed-attribute',
	template: `
		<ngt-primitive #attribute *args="[bufferAttribute]" [attach]="['attributes', name()]" [parameters]="options()">
			<ng-content />
		</ngt-primitive>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs],
})
/**
 * Used exclusively as a child of a BufferGeometry.
 * Computes the BufferAttribute by calling the `compute` function
 * and attaches the attribute to the geometry.
 */
export class NgtsComputedAttribute {
	compute = input.required<(geometry: THREE.BufferGeometry) => THREE.BufferAttribute>();
	name = input.required<string>();
	options = input({} as Partial<NgtThreeElements['ngt-buffer-geometry']>);

	protected bufferAttribute = new THREE.BufferAttribute(new Float32Array(0), 1);
	attributeRef = viewChild<ElementRef<THREE.BufferAttribute>>('attribute');

	constructor() {
		effect(() => {
			const bufferAttribute = this.attributeRef()?.nativeElement;
			if (!bufferAttribute) return;

			const instanceState = getInstanceState(bufferAttribute);
			if (!instanceState) return;

			const geometry = ((bufferAttribute as any).parent as THREE.BufferGeometry) ?? instanceState.parent();

			const attribute = this.compute()(geometry);
			bufferAttribute.copy(attribute);
		});
	}
}
