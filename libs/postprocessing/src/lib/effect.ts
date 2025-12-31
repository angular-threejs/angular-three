import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component, Directive, inject, input } from '@angular/core';
import { injectStore } from 'angular-three';
import { createNoopInjectionToken } from 'ngxtension/create-injection-token';
import { BlendFunction } from 'postprocessing';

/**
 * Injection token for providing default effect options.
 *
 * Use `injectDefaultEffectOptions` to inject default options in effect components.
 * Use `provideDefaultEffectOptions` to provide default options for effects.
 *
 * @example
 * ```typescript
 * @Component({
 *   providers: [provideDefaultEffectOptions({ blendFunction: BlendFunction.ADD, opacity: 0.5 })]
 * })
 * export class MyEffect {}
 * ```
 */
export const [injectDefaultEffectOptions, provideDefaultEffectOptions] = createNoopInjectionToken<{
	blendFunction?: BlendFunction;
	opacity?: number;
}>('Default Effect options');

/**
 * Component that applies blend mode settings to a postprocessing effect.
 *
 * This component is used internally by effect components to apply `blendFunction`
 * and `opacity` values to the effect's blend mode.
 *
 * @example
 * ```html
 * <ngt-bloom-effect *args="[options()]">
 *   <ngtp-effect-blend-mode />
 * </ngt-bloom-effect>
 * ```
 */
@Component({
	selector: 'ngtp-effect-blend-mode',
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
	/** Reference to the parent NgtpEffect directive, if available */
	effect = inject(NgtpEffect, { optional: true });
}

/**
 * Base directive for postprocessing effects that provides common functionality.
 *
 * This directive is used as a host directive by effect components to provide:
 * - `blendFunction`: Controls how the effect blends with the scene
 * - `opacity`: Controls the effect's opacity
 * - Access to the camera and invalidate function from the store
 *
 * @example
 * ```typescript
 * @Component({
 *   hostDirectives: [{ directive: NgtpEffect, inputs: ['blendFunction', 'opacity'] }]
 * })
 * export class NgtpBloom {}
 * ```
 */
@Directive()
export class NgtpEffect {
	/** Default effect options injected from parent providers */
	defaultEffectOptions = injectDefaultEffectOptions({ optional: true });

	/**
	 * The blend function used to combine this effect with the scene.
	 * @see BlendFunction from postprocessing library
	 */
	blendFunction = input(this.defaultEffectOptions?.blendFunction);

	/**
	 * The opacity of the effect.
	 * @default undefined (uses effect's default)
	 */
	opacity = input(this.defaultEffectOptions?.opacity);

	private store = injectStore();

	/** The current camera from the store */
	camera = this.store.camera;

	/** Function to invalidate the render loop, triggering a re-render */
	invalidate = this.store.invalidate;
}
