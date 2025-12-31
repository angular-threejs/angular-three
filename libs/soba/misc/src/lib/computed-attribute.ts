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

/**
 * Computes and attaches a custom BufferAttribute to a parent BufferGeometry.
 *
 * This component must be used as a child of a BufferGeometry. It calls the provided
 * `compute` function with the parent geometry and attaches the resulting attribute
 * under the specified name.
 *
 * @example
 * ```html
 * <ngt-mesh>
 *   <ngt-box-geometry>
 *     <ngts-computed-attribute
 *       name="customAttribute"
 *       [compute]="computeCustomAttr"
 *     />
 *   </ngt-box-geometry>
 *   <ngt-mesh-basic-material />
 * </ngt-mesh>
 * ```
 *
 * ```typescript
 * computeCustomAttr = (geometry: THREE.BufferGeometry) => {
 *   const count = geometry.attributes['position'].count;
 *   const data = new Float32Array(count);
 *   // ... fill data
 *   return new THREE.BufferAttribute(data, 1);
 * };
 * ```
 */
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
export class NgtsComputedAttribute {
	/**
	 * Function that computes the BufferAttribute from the parent geometry.
	 * Called whenever the geometry or compute function changes.
	 */
	compute = input.required<(geometry: THREE.BufferGeometry) => THREE.BufferAttribute>();

	/**
	 * The attribute name to attach to the geometry (e.g., 'uv2', 'customData').
	 */
	name = input.required<string>();

	/**
	 * Additional options to pass to the underlying buffer attribute.
	 */
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
