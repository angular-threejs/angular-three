import { booleanAttribute, Directive, effect, inject, Injector, input, untracked } from '@angular/core';
import { BladeApi } from 'tweakpane';

@Directive({ selector: 'tweakpane-blade' })
export class TweakpaneBlade {
	hidden = input(false, { transform: booleanAttribute });
	disabled = input(false, { transform: booleanAttribute });

	private injector = inject(Injector);

	get snapshot() {
		return {
			hidden: untracked(this.hidden),
			disabled: untracked(this.disabled),
		};
	}

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
