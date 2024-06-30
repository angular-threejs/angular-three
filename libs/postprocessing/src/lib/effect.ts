import {
	CUSTOM_ELEMENTS_SCHEMA,
	ChangeDetectionStrategy,
	Component,
	Directive,
	InjectionToken,
	inject,
	input,
} from '@angular/core';
import { injectStore } from 'angular-three-core-new';
import { BlendFunction } from 'postprocessing';

export const NGTP_DEFAULT_EFFECT_OPTIONS = new InjectionToken<{ blendFunction?: BlendFunction; opacity?: number }>(
	'NGTP_DEFAULT_EFFECT_OPTIONS',
);
export function provideDefaultEffectOptions(options: { blendFunction?: BlendFunction; opacity?: number }) {
	return { provide: NGTP_DEFAULT_EFFECT_OPTIONS, useFactory: () => options };
}

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
	defaultEffectOptions = inject(NGTP_DEFAULT_EFFECT_OPTIONS, { optional: true });

	blendFunction = input(this.defaultEffectOptions?.blendFunction);
	opacity = input(this.defaultEffectOptions?.opacity);

	store = injectStore();
	camera = this.store.select('camera');
	invalidate = this.store.select('invalidate');
}

export const NgtpEffectHostDirective = { directive: NgtpEffect, inputs: ['blendFunction', 'opacity'] };
