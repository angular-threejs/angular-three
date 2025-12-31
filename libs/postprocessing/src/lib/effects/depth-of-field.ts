import {
	CUSTOM_ELEMENTS_SCHEMA,
	ChangeDetectionStrategy,
	Component,
	computed,
	effect,
	inject,
	input,
} from '@angular/core';
import { NgtAnyRecord, NgtArgs, NgtVector3 } from 'angular-three';
import { DepthOfFieldEffect, MaskFunction } from 'postprocessing';
import * as THREE from 'three';
import { NgtpEffectComposer } from '../effect-composer';

/**
 * Configuration options for the depth of field effect.
 * Extends DepthOfFieldEffect options with additional target and depth texture support.
 */
type DOFOptions = NonNullable<ConstructorParameters<typeof DepthOfFieldEffect>[1]> &
	Partial<{ target: NgtVector3; depthTexture: { texture: THREE.Texture; packing: THREE.DepthPackingStrategies } }>;

/**
 * Angular component that applies a depth of field effect to the scene.
 *
 * This effect simulates the focus behavior of real camera lenses, blurring
 * objects that are outside the focal range. Can be configured for autofocus
 * by providing a target position.
 *
 * @example
 * ```html
 * <ngtp-effect-composer>
 *   <ngtp-depth-of-field [options]="{ focusDistance: 0, focalLength: 0.02, bokehScale: 2 }" />
 * </ngtp-effect-composer>
 * ```
 *
 * @example
 * ```html
 * <!-- With autofocus target -->
 * <ngtp-effect-composer>
 *   <ngtp-depth-of-field [options]="{ target: [0, 0, 5], bokehScale: 3 }" />
 * </ngtp-effect-composer>
 * ```
 */
@Component({
	selector: 'ngtp-depth-of-field',
	template: `
		<ngt-primitive *args="[effect()]" />
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtpDepthOfField {
	/**
	 * Configuration options for the depth of field effect.
	 * @see DOFOptions
	 */
	options = input({} as DOFOptions);

	private effectComposer = inject(NgtpEffectComposer);

	/**
	 * Creates the DepthOfFieldEffect instance with the configured options.
	 * Enables autofocus if a target is provided and applies depth texture settings.
	 */
	protected effect = computed(() => {
		const [camera, options] = [this.effectComposer.camera(), this.options()];

		const autoFocus = options.target != null;

		const effect = new DepthOfFieldEffect(camera, options);

		// Creating a target enables autofocus, NGT will set via props
		if (autoFocus) effect.target = new THREE.Vector3();
		// Depth texture for depth picking with optional packing strategy
		if (options.depthTexture) {
			effect.setDepthTexture(
				options.depthTexture.texture,
				options.depthTexture.packing as THREE.DepthPackingStrategies,
			);
		}
		// Temporary fix that restores DOF 6.21.3 behavior, everything since then lets shapes leak through the blur
		const maskPass = (effect as NgtAnyRecord)['maskPass'];
		maskPass.maskFunction = MaskFunction.MULTIPLY_RGB_SET_ALPHA;

		return effect;
	});

	constructor() {
		effect((onCleanup) => {
			const depthOfFieldEffect = this.effect();
			onCleanup(() => depthOfFieldEffect.dispose());
		});
	}
}
