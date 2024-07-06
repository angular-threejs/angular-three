import {
	CUSTOM_ELEMENTS_SCHEMA,
	ChangeDetectionStrategy,
	Component,
	afterNextRender,
	computed,
	input,
} from '@angular/core';
import { NgtArgs, NgtVector2, injectNgtRef, injectNgtStore, pick, vector2 } from 'angular-three';
import { injectAutoEffect } from 'ngxtension/auto-effect';
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
	standalone: true,
	template: `
		<ngt-primitive *args="[effect()]" [ref]="effectRef()" />
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtpGlitch {
	autoEffect = injectAutoEffect();
	store = injectNgtStore();
	invalidate = this.store.select('invalidate');

	effectRef = input(injectNgtRef<GlitchEffect>());
	options = input({ active: true } as GlitchOptions, { transform: mergeInputs({ active: true }) });

	active = pick(this.options, 'active');
	mode = pick(this.options, 'mode');

	delay = vector2(this.options, 'delay');
	duration = vector2(this.options, 'duration');
	chromaticAberrationOffset = vector2(this.options, 'chromaticAberrationOffset');
	strength = vector2(this.options, 'strength');

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
		afterNextRender(() => {
			this.autoEffect(() => {
				const effect = this.effect();
				return () => effect.dispose();
			});

			this.autoEffect(() => {
				const [effect, invalidate, mode, active] = [this.effect(), this.invalidate(), this.mode(), this.active()];
				effect.mode = active ? mode || GlitchMode.SPORADIC : GlitchMode.DISABLED;
				invalidate();
			});
		});
	}
}
