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
import { NgtTweakBlade } from './blade';
import { NgtTweakDebounce } from './debounce';
import { NgtTweakFolder } from './folder';
import { NgtTweakLabel } from './label';

export const NGT_TWEAK_BINDING_AS_HOST = new InjectionToken<
	true | { in: (value: unknown) => unknown; out: (value: unknown) => unknown } | null
>('hostDirective NgtTweakBinding', { factory: () => null });

export function provideTweakBindingAsHost<TIn, TOut>(inOut?: { in: (value: TIn) => TOut; out: (value: TOut) => TIn }) {
	return { provide: NGT_TWEAK_BINDING_AS_HOST, useValue: inOut ?? true };
}

@Directive({
	selector: 'ngt-tweak-binding',
	hostDirectives: [
		{ directive: NgtTweakBlade, inputs: ['disabled', 'hidden'] },
		{ directive: NgtTweakDebounce, inputs: ['debounce'] },
		{ directive: NgtTweakLabel, inputs: ['label', 'tag'] },
	],
})
export class NgtTweakBinding<TValue> {
	value = model.required<any>();

	private debounce = inject(NgtTweakDebounce);
	private label = inject(NgtTweakLabel);
	private blade = inject(NgtTweakBlade);
	private parent = inject(NgtTweakFolder);
	private injector = inject(Injector);
	private asHostDirective = inject(NGT_TWEAK_BINDING_AS_HOST);

	private bindingBaseParams = computed(() => ({
		label: this.label.snapshot.label,
		tag: this.label.snapshot.tag,
		disabled: this.blade.disabled(),
		hidden: this.blade.hidden(),
	}));
	private bindingParams = signal<Record<string, unknown>>({});

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
