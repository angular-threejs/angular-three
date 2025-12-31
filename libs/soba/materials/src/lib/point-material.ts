import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, DestroyRef, inject, input } from '@angular/core';
import { NgtArgs, NgtAttachable } from 'angular-three';
import { PointMaterial } from 'angular-three-soba/shaders';
import * as THREE from 'three';

/**
 * A material for rendering point clouds with consistent size regardless of distance.
 * Extends THREE.PointsMaterial with additional shader modifications for improved
 * point rendering with size attenuation control.
 *
 * @example
 * ```html
 * <ngt-points>
 *   <ngt-buffer-geometry>
 *     <ngt-buffer-attribute attach="attributes.position" [args]="[positions, 3]" />
 *   </ngt-buffer-geometry>
 *   <ngts-point-material [options]="{ size: 0.1, color: 'orange', sizeAttenuation: true }" />
 * </ngt-points>
 * ```
 */
@Component({
	selector: 'ngts-point-material',
	template: `
		<ngt-primitive *args="[material]" [attach]="attach()" [parameters]="options()">
			<ng-content />
		</ngt-primitive>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs],
})
export class NgtsPointMaterial {
	/**
	 * How to attach the material to its parent object.
	 * @default 'material'
	 */
	attach = input<NgtAttachable>('material');

	/**
	 * Configuration options for the point material following THREE.PointsMaterialParameters.
	 */
	options = input({} as THREE.PointsMaterialParameters);

	/** The underlying PointMaterial instance. */
	protected material = new PointMaterial(this.options());

	constructor() {
		inject(DestroyRef).onDestroy(() => this.material.dispose());
	}
}
