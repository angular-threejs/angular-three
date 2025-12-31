import { Directive, effect, inject, Injector, input, numberAttribute } from '@angular/core';
import { debounceTime, fromEventPattern } from 'rxjs';
import { TpChangeEvent } from 'tweakpane';

/**
 * Directive that provides debounced change event handling for Tweakpane controls.
 *
 * This is a base directive used by binding-based controls to prevent
 * excessive updates when values change rapidly (e.g., during slider dragging).
 *
 * @example
 * ```html
 * <!-- Debounce value updates by 300ms -->
 * <tweakpane-number [debounce]="300" [(value)]="speed" />
 * ```
 */
@Directive()
export class TweakpaneDebounce {
	/**
	 * The debounce delay in milliseconds before emitting value changes.
	 * @default 150
	 */
	debounce = input(150, { transform: numberAttribute });

	private injector = inject(Injector);

	/**
	 * Synchronizes debounced change events from a Tweakpane API with a callback.
	 * Creates a reactive effect that subscribes to change events and debounces them.
	 *
	 * @typeParam T - The type of value being tracked
	 * @param api - A function that returns the Tweakpane API object with on/off methods (or null if not ready)
	 * @param cb - Callback function invoked with the change event after debounce delay
	 * @returns The created effect reference
	 */
	sync<T>(
		api: () => {
			on: (evName: 'change', cb: (ev: TpChangeEvent<T>) => void) => void;
			off: (evName: 'change', cb: (ev: TpChangeEvent<T>) => void) => void;
		} | null,
		cb: (ev: TpChangeEvent<T>) => void,
	) {
		return effect(
			(onCleanup) => {
				const _api = api();
				if (!_api) return;

				const sub = fromEventPattern<TpChangeEvent<T>>(
					(handler) => _api.on('change', handler),
					(handler) => _api.off('change', handler),
				)
					.pipe(debounceTime(this.debounce()))
					.subscribe((ev) => {
						cb(ev);
					});

				onCleanup(() => {
					sub.unsubscribe();
				});
			},
			{ injector: this.injector },
		);
	}
}
