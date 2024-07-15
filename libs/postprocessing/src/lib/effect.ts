import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component, Directive, inject, input } from '@angular/core';
import { injectStore } from 'angular-three';
import { createNoopInjectionToken } from 'ngxtension/create-injection-token';
import { BlendFunction } from 'postprocessing';

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

	blendFunction = input(this.defaultEffectOptions?.blendFunction);
	opacity = input(this.defaultEffectOptions?.opacity);

	private store = injectStore();
	camera = this.store.select('camera');
	invalidate = this.store.select('invalidate');
}

export const NgtpEffectHostDirective = { directive: NgtpEffect, inputs: ['blendFunction', 'opacity'] };
