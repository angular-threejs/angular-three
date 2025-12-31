import { computed, DestroyRef, Directive, effect, inject, input, model, untracked } from '@angular/core';
import { ListItem } from '@tweakpane/core';
import { ListBladeApi } from 'tweakpane';
import { TweakpaneBlade } from './blade';
import { TweakpaneDebounce } from './debounce';
import { TweakpaneFolder } from './folder';
import { TweakpaneLabel } from './label';

/**
 * Directive for creating a dropdown list/select control in Tweakpane.
 *
 * Provides two-way binding for selecting from a list of options.
 * Options can be provided as an array or as a key-value object.
 *
 * @typeParam TOptionValue - The type of values in the list
 *
 * @example
 * ```html
 * <tweakpane-pane>
 *   <!-- Options as array -->
 *   <tweakpane-list
 *     label="Mode"
 *     [(value)]="mode"
 *     [options]="['normal', 'debug', 'performance']"
 *   />
 *
 *   <!-- Options as object (label: value mapping) -->
 *   <tweakpane-list
 *     label="Quality"
 *     [(value)]="quality"
 *     [options]="{ 'Low': 1, 'Medium': 2, 'High': 3, 'Ultra': 4 }"
 *   />
 * </tweakpane-pane>
 * ```
 */
@Directive({
	selector: 'tweakpane-list',
	hostDirectives: [
		{ directive: TweakpaneBlade, inputs: ['hidden', 'disabled'] },
		{ directive: TweakpaneDebounce, inputs: ['debounce'] },
		{ directive: TweakpaneLabel, inputs: ['label'] },
	],
})
export class TweakpaneList<TOptionValue> {
	/**
	 * The currently selected value. Supports two-way binding with `[(value)]`.
	 */
	value = model.required<TOptionValue>();

	/**
	 * The list options. Can be:
	 * - An array of values (labels will be stringified values)
	 * - An object mapping display labels to values
	 */
	options = input.required<Record<string, TOptionValue> | TOptionValue[]>();

	private blade = inject(TweakpaneBlade);
	private debounce = inject(TweakpaneDebounce);
	private label = inject(TweakpaneLabel);
	private parent = inject(TweakpaneFolder);

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
	private listApi = computed(() => {
		const parent = this.parent.folder();
		if (!parent) return null;

		return parent.addBlade({
			view: 'list',
			options: this.listOptions(),
			value: untracked(this.value),
			label: this.label.snapshot.label,
		}) as ListBladeApi<TOptionValue>;
	});

	constructor() {
		this.label.sync(this.listApi);
		this.blade.sync(this.listApi);
		this.debounce.sync(this.listApi, (ev) => {
			this.value.set(ev.value);
		});

		effect((onCleanup) => {
			const listApi = this.listApi();
			onCleanup(() => {
				listApi?.dispose();
			});
		});

		inject(DestroyRef).onDestroy(() => {
			this.listApi()?.dispose();
		});
	}
}
