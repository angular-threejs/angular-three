import { computed, DestroyRef, Directive, effect, inject, input, model, signal, untracked } from '@angular/core';
import { ListItem } from '@tweakpane/core';
import { ListBladeApi } from 'tweakpane';
import { NgtTweakBlade } from './blade';
import { NgtTweakDebounce } from './debounce';
import { NgtTweakFolder } from './folder';
import { NgtTweakLabel } from './label';

@Directive({
	selector: 'ngt-tweak-list',
	hostDirectives: [
		{ directive: NgtTweakBlade, inputs: ['hidden', 'disabled'] },
		{ directive: NgtTweakDebounce, inputs: ['debounce'] },
		{ directive: NgtTweakLabel, inputs: ['label'] },
	],
})
export class NgtTweakList<TOptionValue> {
	value = model.required<TOptionValue>();
	options = input.required<Record<string, TOptionValue> | TOptionValue[]>();

	private blade = inject(NgtTweakBlade);
	private debounce = inject(NgtTweakDebounce);
	private label = inject(NgtTweakLabel);
	private parent = inject(NgtTweakFolder);

	list = signal<ListBladeApi<TOptionValue> | null>(null);
	private listOptions = computed(() => {
		const options = this.options();
		if (Array.isArray(options)) {
			return options.map((option) => ({ value: option, text: `${option}` }) as ListItem<TOptionValue>);
		}

		return Object.keys(options).map((key) => {
			const value = options[key];
			return { text: key, value } as ListItem<TOptionValue>;
		});
	});

	constructor() {
		this.label.startChangeEffect(this.list);
		this.blade.startChangeEffect(this.list);
		this.debounce.startDebounceEffect(this.list, (ev) => {
			this.value.set(ev.value);
		});

		effect((onCleanup) => {
			const parent = this.parent.folder();
			if (!parent) return;

			const list = parent.addBlade({
				view: 'list',
				options: this.listOptions(),
				value: untracked(this.value),
				label: this.label.snapshot.label,
			}) as ListBladeApi<TOptionValue>;

			this.list.set(list);

			onCleanup(() => {
				list.dispose();
			});
		});

		inject(DestroyRef).onDestroy(() => {
			this.list()?.dispose();
		});
	}
}
