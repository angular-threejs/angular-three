import {
	computed,
	DestroyRef,
	Directive,
	effect,
	inject,
	InjectionToken,
	Injector,
	model,
	signal,
	untracked,
} from '@angular/core';
import { BindingApi, BindingParams } from '@tweakpane/core';
import { TweakpaneBlade } from './blade';
import { TweakpaneDebounce } from './debounce';
import { TweakpaneFolder } from './folder';
import { TweakpaneLabel } from './label';

/**
 * Injection token used to configure value transformation when TweakpaneBinding
 * is used as a host directive.
 *
 * When set to `true`, values pass through unchanged.
 * When set to an object with `in` and `out` functions, values are transformed:
 * - `in`: Transforms the input value before binding to Tweakpane
 * - `out`: Transforms the Tweakpane value before emitting to the model
 *
 * @internal
 */
export const NGT_TWEAK_BINDING_AS_HOST = new InjectionToken<
	true | { in: (value: unknown) => unknown; out: (value: unknown) => unknown } | null
>('hostDirective NgtTweakBinding', { factory: () => null });

/**
 * Provides configuration for TweakpaneBinding when used as a host directive.
 *
 * @typeParam TIn - The input value type (from the component)
 * @typeParam TOut - The output value type (for Tweakpane)
 * @param inOut - Optional object containing `in` and `out` transformation functions
 * @returns A provider configuration object
 *
 * @example
 * ```typescript
 * // Simple passthrough (no transformation)
 * providers: [provideTweakBindingAsHost()]
 *
 * // With value transformation (e.g., array to object)
 * providers: [provideTweakBindingAsHost({
 *   in: (value) => ({ x: value[0], y: value[1] }),
 *   out: (value) => [value.x, value.y]
 * })]
 * ```
 */
export function provideTweakBindingAsHost<TIn, TOut>(inOut?: { in: (value: TIn) => TOut; out: (value: TOut) => TIn }) {
	return { provide: NGT_TWEAK_BINDING_AS_HOST, useValue: inOut ?? true };
}

/**
 * Base directive for creating Tweakpane bindings (two-way data binding controls).
 *
 * This directive provides the core functionality for binding Angular values to
 * Tweakpane controls. It handles:
 * - Creating the binding on the parent folder
 * - Syncing label, blade, and debounce settings
 * - Value transformation when used as a host directive
 * - Automatic cleanup on destroy
 *
 * Most commonly used as a host directive by specific control types like
 * `TweakpaneNumber`, `TweakpaneText`, `TweakpaneCheckbox`, etc.
 *
 * @typeParam TValue - The type of value being bound
 *
 * @example
 * ```html
 * <!-- Direct usage (rarely needed) -->
 * <tweakpane-binding [(value)]="myValue" label="My Value" />
 *
 * <!-- More commonly used via specific controls -->
 * <tweakpane-number [(value)]="speed" label="Speed" />
 * ```
 */
@Directive({
	selector: 'tweakpane-binding',
	hostDirectives: [
		{ directive: TweakpaneBlade, inputs: ['disabled', 'hidden'] },
		{ directive: TweakpaneDebounce, inputs: ['debounce'] },
		{ directive: TweakpaneLabel, inputs: ['label', 'tag'] },
	],
})
export class TweakpaneBinding<TValue> {
	/**
	 * The bound value. Supports two-way binding with `[(value)]`.
	 */
	value = model.required<any>();

	private debounce = inject(TweakpaneDebounce);
	private label = inject(TweakpaneLabel);
	private blade = inject(TweakpaneBlade);
	private parent = inject(TweakpaneFolder);
	private injector = inject(Injector);
	private asHostDirective = inject(NGT_TWEAK_BINDING_AS_HOST);

	private bindingBaseParams = computed(() => ({
		label: this.label.snapshot.label,
		tag: this.label.snapshot.tag,
		disabled: this.blade.disabled(),
		hidden: this.blade.hidden(),
	}));
	private bindingParams = signal<Record<string, unknown>>({});

	/**
	 * Gets the bindable object with optional value transformation.
	 * @returns An object with a `value` property suitable for Tweakpane binding
	 */
	private get bindableObject() {
		let value = untracked(this.value);

		if (this.asHostDirective && typeof this.asHostDirective === 'object') {
			value = this.asHostDirective.in(value) as TValue;
		}

		return { value };
	}

	private bindingApi = computed(() => {
		const parent = this.parent.folder();
		if (!parent) return null;

		const bindingParams = { ...this.bindingBaseParams(), ...this.bindingParams() };
		return parent.addBinding(this.bindableObject, 'value', bindingParams) as BindingApi<unknown, TValue>;
	});

	constructor() {
		this.blade.sync(this.bindingApi);
		this.label.sync(this.bindingApi);
		this.debounce.sync(this.bindingApi, (ev) => {
			if (this.asHostDirective && typeof this.asHostDirective === 'object') {
				this.value.set(this.asHostDirective.out(ev.value) as TValue);
			} else {
				this.value.set(ev.value);
			}
		});

		effect((onCleanup) => {
			const bindingApi = this.bindingApi();
			if (!bindingApi) return;
			onCleanup(() => {
				bindingApi.dispose();
			});
		});

		inject(DestroyRef).onDestroy(() => {
			this.bindingApi()?.dispose();
		});
	}

	/**
	 * Synchronizes additional binding parameters with the Tweakpane binding.
	 * Called by specific control directives to add control-specific parameters
	 * (e.g., min/max for numbers, options for lists).
	 *
	 * @param params - A function that returns the binding parameters
	 * @returns The created effect reference
	 */
	syncBindingParams(params: () => BindingParams) {
		return effect(
			() => {
				this.bindingParams.set(params());
			},
			{ injector: this.injector },
		);
	}

	// createBindingEffect(params: () => BindingParams) {
	// 	return effect(
	// 		(onCleanup) => {
	// 			const parent = this.parent.folder();
	// 			if (!parent) return;
	//
	// 			const bindingParams = { ...this.bindingBaseParams(), ...params() };
	// 			const binding = parent.addBinding(this.bindableObject, 'value', bindingParams);
	//
	// 			this.bindingApi.set(binding);
	//
	// 			onCleanup(() => {
	// 				binding.dispose();
	// 				this.bindingApi.set(null);
	// 			});
	// 		},
	// 		{ injector: this.injector },
	// 	);
	// }
}
