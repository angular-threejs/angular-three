import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { NgtArgs, extend } from 'angular-three';
import { ShockWaveEffect } from 'postprocessing';
import { NgtpEffect, NgtpEffectBlendMode } from '../effect';

/**
 * Configuration options for the shock wave effect.
 * Derived from ShockWaveEffect constructor parameters.
 */
export type ShockWaveEffectOptions = Partial<NonNullable<ConstructorParameters<typeof ShockWaveEffect>[0]>>;

/**
 * Angular component that applies a shock wave distortion effect.
 *
 * This effect creates an expanding ring distortion that simulates a
 * shock wave or explosion ripple emanating from a point in the scene.
 *
 * @example
 * ```html
 * <ngtp-effect-composer>
 *   <ngtp-shock-wave
 *     [options]="{ speed: 2, maxRadius: 1, waveSize: 0.2, amplitude: 0.05 }"
 *   />
 * </ngtp-effect-composer>
 * ```
 */
@Component({
	selector: 'ngtp-shock-wave',
	template: `
		<ngt-shock-wave-effect *args="[options()]" [camera]="effect.camera()">
			<ngtp-effect-blend-mode />
			<ng-content />
		</ngt-shock-wave-effect>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs, NgtpEffectBlendMode],
	hostDirectives: [{ directive: NgtpEffect, inputs: ['blendFunction', 'opacity'] }],
})
export class NgtpShockWave {
	/**
	 * Configuration options for the shock wave effect.
	 * @see ShockWaveEffectOptions
	 */
	options = input({} as Omit<ShockWaveEffectOptions, 'blendFunction'>);

	/** Reference to the host NgtpEffect directive */
	protected effect = inject(NgtpEffect, { host: true });

	constructor() {
		extend({ ShockWaveEffect });
	}
}
