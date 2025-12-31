import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component, computed, effect, input } from '@angular/core';
import { NgtArgs, injectStore, pick } from 'angular-three';
import { BlendFunction, LUT3DEffect } from 'postprocessing';
import * as THREE from 'three';

/**
 * Configuration options for the LUT (Look-Up Table) effect.
 */
export interface LUTOptions {
	/**
	 * The 3D LUT texture to apply for color grading.
	 * Can be loaded using LUTCubeLoader or LUT3dlLoader.
	 */
	lut: THREE.Texture;

	/**
	 * The blend function for combining with the scene.
	 * @default BlendFunction.SRC
	 */
	blendFunction?: BlendFunction;

	/**
	 * Whether to use tetrahedral interpolation for smoother color transitions.
	 * @default false
	 */
	tetrahedralInterpolation?: boolean;
}

/**
 * Angular component that applies a LUT (Look-Up Table) color grading effect.
 *
 * LUTs are used for color grading in film and photography. This effect applies
 * a 3D LUT texture to transform the colors of the rendered scene.
 *
 * @example
 * ```typescript
 * // In component
 * lutTexture = injectLoader(() => LUTCubeLoader, () => 'path/to/lut.cube');
 * ```
 *
 * ```html
 * <ngtp-effect-composer>
 *   <ngtp-lut [options]="{ lut: lutTexture() }" />
 * </ngtp-effect-composer>
 * ```
 */
@Component({
	selector: 'ngtp-lut',
	template: `
		<ngt-primitive *args="[effect()]" [dispose]="null" />
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtpLUT {
	/**
	 * Configuration options for the LUT effect.
	 * Must include a `lut` texture.
	 * @see LUTOptions
	 */
	options = input({} as LUTOptions);

	private lut = pick(this.options, 'lut');
	private tetrahedralInterpolation = pick(this.options, 'tetrahedralInterpolation');

	private store = injectStore();

	/** The underlying LUT3DEffect instance */
	protected effect = computed(() => {
		const { lut, ...options } = this.options();
		return new LUT3DEffect(lut, options);
	});

	constructor() {
		effect(() => {
			const [effect, lut, tetrahedralInterpolation, invalidate] = [
				this.effect(),
				this.lut(),
				this.tetrahedralInterpolation(),
				this.store.invalidate(),
			];

			if (tetrahedralInterpolation) effect.tetrahedralInterpolation = tetrahedralInterpolation;
			if (lut) effect.lut = lut;
			invalidate();
		});

		effect((onCleanup) => {
			const effect = this.effect();
			onCleanup(() => effect.dispose());
		});
	}
}
