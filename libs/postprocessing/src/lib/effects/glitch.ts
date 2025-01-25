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
