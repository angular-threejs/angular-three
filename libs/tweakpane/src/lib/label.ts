import { Directive, effect, inject, Injector, input, untracked } from '@angular/core';

/**
 * Directive that provides label and tag functionality for Tweakpane controls.
 *
 * This is a base directive used by binding-based controls (like `TweakpaneNumber`,
 * `TweakpaneText`, `TweakpaneCheckbox`) to manage their labels and optional tags.
 *
 * @example
 * ```html
 * <tweakpane-number label="Speed" tag="m/s" [(value)]="speed" />
 * ```
 */
@Directive()
export class TweakpaneLabel {
	/**
	 * The label text displayed next to the control.
	 * @default ''
	 */
	label = input('');

	/**
	 * An optional tag displayed alongside the label (e.g., units like "px", "m/s").
	 * @default ''
	 */
	tag = input('');

	private injector = inject(Injector);

	/**
	 * Gets the current label and tag values without tracking signal dependencies.
	 * Useful for initial configuration when creating Tweakpane controls.
	 * @returns An object containing the current label and tag values
	 */
	get snapshot() {
		return { label: untracked(this.label), tag: untracked(this.tag) };
	}

	/**
	 * Synchronizes the label and tag properties with a Tweakpane API object.
	 * Creates a reactive effect that updates the API's label and tag
	 * whenever the input values change.
	 *
	 * @param api - A function that returns the Tweakpane API object (or null if not ready)
	 * @returns The created effect reference
	 */
	sync(api: () => { label?: string | null; tag?: string | null } | null) {
		return effect(
			() => {
				const _api = api();
				if (!_api) return;

				_api.label = this.label();
				if ('tag' in _api) {
					_api.tag = this.tag();
				}
			},
			{ injector: this.injector },
		);
	}
}
