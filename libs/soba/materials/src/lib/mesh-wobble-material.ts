import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, DestroyRef, inject, input } from '@angular/core';
import { beforeRender, NgtArgs, NgtAttachable, NgtThreeElements, omit } from 'angular-three';
import { MeshWobbleMaterial, MeshWobbleMaterialParameters } from 'angular-three-soba/vanilla-exports';
import { mergeInputs } from 'ngxtension/inject-inputs';

/**
 * Configuration options for the NgtsMeshWobbleMaterial component.
 */
export interface NgtsMeshWobbleMaterialOptions
	extends MeshWobbleMaterialParameters, Partial<NgtThreeElements['ngt-mesh-standard-material']> {
	/**
	 * Animation speed multiplier for the wobble effect.
	 * @default 1
	 */
	speed: number;
}

const defaultOptions: NgtsMeshWobbleMaterialOptions = {
	speed: 1,
};

/**
 * A material that applies animated sine-wave wobble distortion to mesh surfaces.
 * Extends MeshStandardMaterial with vertex displacement for organic, jelly-like motion.
 *
 * @example
 * ```html
 * <ngt-mesh>
 *   <ngt-torus-geometry />
 *   <ngts-mesh-wobble-material [options]="{ speed: 2, factor: 0.6, color: 'cyan' }" />
 * </ngt-mesh>
 * ```
 */
@Component({
	selector: 'ngts-mesh-wobble-material',
	template: `
		<ngt-primitive *args="[material]" [parameters]="parameters()" [attach]="attach()">
			<ng-content />
		</ngt-primitive>
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtsMeshWobbleMaterial {
	/**
	 * How to attach the material to its parent object.
	 * @default 'material'
	 */
	attach = input<NgtAttachable>('material');

	/**
	 * Configuration options for the wobble material.
	 */
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });

	/** Parameters excluding animation speed. */
	protected parameters = omit(this.options, ['speed']);

	/** The underlying MeshWobbleMaterial instance. */
	protected material = new MeshWobbleMaterial();

	constructor() {
		inject(DestroyRef).onDestroy(() => this.material.dispose());

		beforeRender(({ clock }) => {
			const material = this.material;
			material.time = clock.elapsedTime * this.options().speed;
		});
	}
}
