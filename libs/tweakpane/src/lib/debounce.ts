import { Directive, effect, inject, Injector, input, numberAttribute } from '@angular/core';
import { debounceTime, fromEventPattern } from 'rxjs';
import { TpChangeEvent } from 'tweakpane';

@Directive()
export class NgtTweakDebounce {
	debounce = input(150, { transform: numberAttribute });

	private injector = inject(Injector);

	startDebounceEffect<T>(
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
