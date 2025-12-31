import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, DestroyRef, inject, input } from '@angular/core';
import { beforeRender, NgtArgs, NgtAttachable, NgtThreeElements, omit, pick } from 'angular-three';
import { MeshDistortMaterial, MeshDistortMaterialParameters } from 'angular-three-soba/vanilla-exports';
import { mergeInputs } from 'ngxtension/inject-inputs';

/**
 * Configuration options for the NgtsMeshDistortMaterial component.
 */
export interface NgtsMeshDistortMaterialOptions
	extends Partial<MeshDistortMaterialParameters>, Partial<NgtThreeElements['ngt-mesh-physical-material']> {
	/**
	 * Animation speed multiplier for the distortion effect.
	 * @default 1
	 */
	speed: number;

	/**
	 * Distortion intensity factor.
	 */
	factor?: number;
}

const defaultOptions: NgtsMeshDistortMaterialOptions = {
	speed: 1,
};

/**
 * A material that applies animated noise-based distortion to mesh surfaces.
 * Extends MeshPhysicalMaterial with vertex displacement using simplex noise.
 *
 * @example
 * ```html
 * <ngt-mesh>
 *   <ngt-sphere-geometry />
 *   <ngts-mesh-distort-material [options]="{ speed: 2, factor: 0.5, color: 'hotpink' }" />
 * </ngt-mesh>
 * ```
 */
@Component({
	selector: 'ngts-mesh-distort-material',
	template: `
		<ngt-primitive *args="[material]" [attach]="attach()" [parameters]="parameters()">
			<ng-content />
		</ngt-primitive>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs],
})
export class NgtsMeshDistortMaterial {
	/**
	 * How to attach the material to its parent object.
	 * @default 'material'
	 */
	attach = input<NgtAttachable>('material');

	/**
	 * Configuration options for the distort material.
	 */
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });

	/** Parameters excluding animation speed. */
	protected parameters = omit(this.options, ['speed']);

	/** The underlying MeshDistortMaterial instance. */
	material = new MeshDistortMaterial();

	private speed = pick(this.options, 'speed');

	constructor() {
		inject(DestroyRef).onDestroy(() => this.material.dispose());

		beforeRender(({ clock }) => {
			this.material.time = clock.elapsedTime * this.speed();
		});
	}
}
