import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component, computed, effect, input } from '@angular/core';
import { NgtArgs, NgtVector2, injectStore, pick, vector2 } from 'angular-three';
import { mergeInputs } from 'ngxtension/inject-inputs';
import { GlitchEffect, GlitchMode } from 'postprocessing';

export type GlitchOptions = NonNullable<ConstructorParameters<typeof GlitchEffect>[0]> &
	Partial<{
		mode: GlitchMode;
		active: boolean;
		delay: NgtVector2;
		duration: NgtVector2;
		chromaticAberrationOffset: NgtVector2;
		strength: NgtVector2;
	}>;

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
	options = input({ active: true } as GlitchOptions, { transform: mergeInputs({ active: true }) });

	private active = pick(this.options, 'active');
	private mode = pick(this.options, 'mode');

	private delay = vector2(this.options, 'delay');
	private duration = vector2(this.options, 'duration');
	private chromaticAberrationOffset = vector2(this.options, 'chromaticAberrationOffset');
	private strength = vector2(this.options, 'strength');

	private store = injectStore();
	private invalidate = this.store.select('invalidate');

	effect = computed(() => {
		const [
			{ ratio, dtSize, columns, blendFunction, perturbationMap },
			delay,
			duration,
			chromaticAberrationOffset,
			strength,
		] = [this.options(), this.delay(), this.duration(), this.chromaticAberrationOffset(), this.strength()];
		return new GlitchEffect({
			ratio,
			dtSize,
			columns,
			blendFunction,
			perturbationMap,
			delay,
			duration,
			chromaticAberrationOffset,
			strength,
		});
	});

	constructor() {
		effect(() => {
			const [glitchEffect, invalidate, mode, active] = [this.effect(), this.invalidate(), this.mode(), this.active()];
			glitchEffect.mode = active ? mode || GlitchMode.SPORADIC : GlitchMode.DISABLED;
			invalidate();
		});

		effect((onCleanup) => {
			const effect = this.effect();
			onCleanup(() => effect.dispose());
		});
	}
}
