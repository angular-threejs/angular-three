import { Directive, effect, inject, Injector, input, untracked } from '@angular/core';

@Directive()
export class NgtTweakLabel {
	label = input('');
	tag = input('');

	private injector = inject(Injector);

	get snapshot() {
		return { label: untracked(this.label), tag: untracked(this.tag) };
	}

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
