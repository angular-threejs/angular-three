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

export type NgtTweakBindingParams<TParams extends BindingParams> = Omit<
	TParams,
	'tag' | 'label' | 'disabled' | 'hidden'
>;

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
	value = model.required<TValue>();

	private debounce = inject(NgtTweakDebounce);
	private label = inject(NgtTweakLabel);
	private blade = inject(NgtTweakBlade);
	private parent = inject(NgtTweakFolder);
	private injector = inject(Injector);
	private asHostDirective = inject(NGT_TWEAK_BINDING_AS_HOST);

	binding = signal<BindingApi<unknown, TValue> | null>(null);
	private bindingBaseParams = computed(() => ({
		label: this.label.snapshot.label,
		tag: this.label.snapshot.tag,
		disabled: this.blade.disabled(),
		hidden: this.blade.hidden(),
	}));

	private get bindableObject() {
		let value = untracked(this.value);

		if (this.asHostDirective && typeof this.asHostDirective === 'object') {
			value = this.asHostDirective.in(value) as TValue;
		}

		return { value };
	}

	constructor() {
		this.blade.startChangeEffect(this.binding);
		this.label.startChangeEffect(this.binding);
		this.debounce.startDebounceEffect(this.binding, (ev) => {
			if (this.asHostDirective && typeof this.asHostDirective === 'object') {
				this.value.set(this.asHostDirective.out(ev.value) as TValue);
			} else {
				this.value.set(ev.value);
			}
		});

		if (!this.asHostDirective) {
			this.createBindingEffect(this.bindingBaseParams);
		}

		inject(DestroyRef).onDestroy(() => {
			this.binding()?.dispose();
		});
	}

	createBindingEffect(params: () => BindingParams) {
		return effect(
			(onCleanup) => {
				const parent = this.parent.folder();
				if (!parent) return;

				const bindingParams = { ...this.bindingBaseParams(), ...params() };
				const binding = parent.addBinding(this.bindableObject, 'value', bindingParams);

				this.binding.set(binding);

				onCleanup(() => {
					binding.dispose();
					this.binding.set(null);
				});
			},
			{ injector: this.injector },
		);
	}
}
