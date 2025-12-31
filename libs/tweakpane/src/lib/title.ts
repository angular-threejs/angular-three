import { Directive, effect, inject, Injector, input, untracked } from '@angular/core';

/**
 * Directive that provides title functionality for Tweakpane components.
 *
 * This is a base directive used by other Tweakpane components (like `TweakpaneFolder`,
 * `TweakpanePane`, `TweakpaneButton`) to manage their titles reactively.
 *
 * @example
 * ```html
 * <tweakpane-folder title="Settings">
 *   <!-- folder contents -->
 * </tweakpane-folder>
 * ```
 */
@Directive()
export class TweakpaneTitle {
	/**
	 * The title text to display.
	 * @default 'TweakPane Title'
	 */
	title = input('TweakPane Title');

	private injector = inject(Injector);

	/**
	 * Gets the current title value without tracking signal dependencies.
	 * Useful for initial configuration when creating Tweakpane components.
	 * @returns The current title string value
	 */
	get snapshot() {
		return untracked(this.title);
	}

	/**
	 * Synchronizes the title property with a Tweakpane API object.
	 * Creates a reactive effect that updates the API's title whenever
	 * the input title changes.
	 *
	 * @param api - A function that returns the Tweakpane API object (or null if not ready)
	 * @returns The created effect reference
	 */
	sync(api: () => { title: string | undefined } | null) {
		return effect(
			() => {
				const _api = api();
				if (!_api) return;

				_api.title = this.title();
			},
			{ injector: this.injector },
		);
	}
}
