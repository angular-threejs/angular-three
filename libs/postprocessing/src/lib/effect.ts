import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component, Directive, inject, input } from '@angular/core';
import { injectNgtRef, injectNgtStore } from 'angular-three';
import { injectAutoEffect } from 'ngxtension/auto-effect';
import { createNoopInjectionToken } from 'ngxtension/create-injection-token';
import { BlendFunction, Effect } from 'postprocessing';

export const [injectDefaultEffectOptions, provideDefaultEffectOptions] = createNoopInjectionToken<{
	blendFunction?: BlendFunction;
	opacity?: number;
}>('Default Effect options');

@Component({
	selector: 'ngtp-effect-blend-mode',
	standalone: true,
	template: `
		@if (effect) {
			<ngt-value [rawValue]="effect.blendFunction()" attach="blendMode.blendFunction" />
			<ngt-value [rawValue]="effect.opacity()" attach="blendMode.opacity.value" />
		}
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtpEffectBlendMode {
	effect = inject(NgtpEffect, { optional: true });
}

@Directive({ standalone: true })
export class NgtpEffect {
	defaultEffectOptions = injectDefaultEffectOptions({ optional: true });

	effectRef = input(injectNgtRef<Effect>());
	blendFunction = input(this.defaultEffectOptions?.blendFunction);
	opacity = input(this.defaultEffectOptions?.opacity);

	autoEffect = injectAutoEffect();
	store = injectNgtStore();
	camera = this.store.select('camera');
	invalidate = this.store.select('invalidate');

	// constructor() {
	// 	afterNextRender(() => {
	// 		this.setBlendMode();
	// 	});
	// }
	//
	// private setBlendMode() {
	// 	this.autoEffect(() => {
	// 		const [effect, blendFunction, opacity, invalidate] = [
	// 			this.effectRef().nativeElement,
	// 			this.blendFunction(),
	// 			this.opacity(),
	// 			this.invalidate(),
	// 		];
	// 		if (!effect) return;
	//
	// 		if (blendFunction !== undefined) {
	// 			effect.blendMode.blendFunction = blendFunction;
	// 		}
	//
	// 		if (opacity !== undefined) {
	// 			effect.blendMode.opacity.value = opacity;
	// 		}
	//
	// 		invalidate();
	// 	});
	// }
}

export const NgtpEffectHostDirective = { directive: NgtpEffect, inputs: ['blendFunction', 'opacity', 'effectRef'] };
