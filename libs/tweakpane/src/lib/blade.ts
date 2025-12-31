import { booleanAttribute, Directive, effect, inject, Injector, input, untracked } from '@angular/core';
import { BladeApi } from 'tweakpane';

/**
 * Directive that provides hidden and disabled state management for Tweakpane blades.
 *
 * This is a base directive used by other Tweakpane components to control
 * visibility and interactivity of controls.
 *
 * @example
 * ```html
 * <tweakpane-number [hidden]="isHidden" [disabled]="isDisabled" [(value)]="speed" />
 * ```
 */
@Directive({ selector: 'tweakpane-blade' })
export class TweakpaneBlade {
	/**
	 * Whether the blade is hidden.
	 * @default false
	 */
	hidden = input(false, { transform: booleanAttribute });

	/**
	 * Whether the blade is disabled (non-interactive).
	 * @default false
	 */
	disabled = input(false, { transform: booleanAttribute });

	private injector = inject(Injector);

	/**
	 * Gets the current hidden and disabled values without tracking signal dependencies.
	 * Useful for initial configuration when creating Tweakpane components.
	 * @returns An object containing the current hidden and disabled states
	 */
	get snapshot() {
		return {
			hidden: untracked(this.hidden),
			disabled: untracked(this.disabled),
		};
	}

	/**
	 * Synchronizes the hidden and disabled properties with a Tweakpane BladeApi.
	 * Creates a reactive effect that updates the API's state whenever
	 * the input values change.
	 *
	 * @param api - A function that returns the Tweakpane BladeApi (or null if not ready)
	 * @returns The created effect reference
	 */
	sync(api: () => BladeApi | null) {
		return effect(
			() => {
				const _api = api();
				if (!_api) return;

				_api.hidden = this.hidden();
				_api.disabled = this.disabled();
			},
			{ injector: this.injector },
		);
	}
}
