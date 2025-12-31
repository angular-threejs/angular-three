import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component, computed, effect, input } from '@angular/core';
import { NgtArgs, NgtVector2, injectStore, pick, vector2 } from 'angular-three';
import { mergeInputs } from 'ngxtension/inject-inputs';
import { GlitchEffect, GlitchMode } from 'postprocessing';

/**
 * Configuration options for the glitch effect.
 * Extends GlitchEffect options with additional control properties.
 */
export type GlitchOptions = NonNullable<ConstructorParameters<typeof GlitchEffect>[0]> &
	Partial<{
		/** The glitch mode (SPORADIC, CONSTANT_MILD, CONSTANT_WILD, DISABLED) */
		mode: GlitchMode;
		/** Whether the glitch effect is active */
		active: boolean;
		/** Delay range between glitches [min, max] in seconds */
		delay: NgtVector2;
		/** Duration range of glitches [min, max] in seconds */
		duration: NgtVector2;
		/** Chromatic aberration offset */
		chromaticAberrationOffset: NgtVector2;
		/** Strength of the glitch effect [x, y] */
		strength: NgtVector2;
	}>;

/**
 * Angular component that applies a glitch effect to the scene.
 *
 * This effect simulates digital glitches with customizable timing, strength,
 * and chromatic aberration. Can be toggled on/off and configured for different
 * glitch modes.
 *
 * @example
 * ```html
 * <ngtp-effect-composer>
 *   <ngtp-glitch [options]="{ delay: [1.5, 3.5], duration: [0.6, 1.0] }" />
 * </ngtp-effect-composer>
 * ```
 *
 * @example
 * ```html
 * <!-- Constant glitch mode -->
 * <ngtp-effect-composer>
 *   <ngtp-glitch [options]="{ mode: GlitchMode.CONSTANT_MILD, active: true }" />
 * </ngtp-effect-composer>
 * ```
 */
@Component({
	selector: 'ngtp-glitch',
	template: `
		<ngt-primitive *args="[effect()]" />
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtpGlitch {
	/**
	 * Configuration options for the glitch effect.
	 * @default { active: true }
	 * @see GlitchOptions
	 */
	options = input({ active: true } as GlitchOptions, { transform: mergeInputs({ active: true }) });

	private active = pick(this.options, 'active');
	private mode = pick(this.options, 'mode');
	private ratio = pick(this.options, 'ratio');
	private dtSize = pick(this.options, 'dtSize');
	private columns = pick(this.options, 'columns');
	private blendFunction = pick(this.options, 'blendFunction');
	private perturbationMap = pick(this.options, 'perturbationMap');

	private delay = vector2(this.options, 'delay');
	private duration = vector2(this.options, 'duration');
	private chromaticAberrationOffset = vector2(this.options, 'chromaticAberrationOffset');
	private strength = vector2(this.options, 'strength');

	private store = injectStore();

	/**
	 * The underlying GlitchEffect instance.
	 * Created with the configured options and vector2 parameters.
	 */
	effect = computed(
		() =>
			new GlitchEffect({
				ratio: this.ratio(),
				dtSize: this.dtSize(),
				columns: this.columns(),
				blendFunction: this.blendFunction(),
				perturbationMap: this.perturbationMap(),
				delay: this.delay(),
				duration: this.duration(),
				chromaticAberrationOffset: this.chromaticAberrationOffset(),
				strength: this.strength(),
			}),
	);

	constructor() {
		effect(() => {
			const [glitchEffect, invalidate, mode, active] = [
				this.effect(),
				this.store.invalidate(),
				this.mode(),
				this.active(),
			];
			glitchEffect.mode = active ? mode || GlitchMode.SPORADIC : GlitchMode.DISABLED;
			invalidate();
		});

		effect((onCleanup) => {
			const effect = this.effect();
			onCleanup(() => effect.dispose());
		});
	}
}
