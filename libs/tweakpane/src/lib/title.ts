import { Directive, effect, inject, Injector, input, untracked } from '@angular/core';

@Directive()
export class NgtTweakTitle {
	title = input('TweakPane Title');

	private injector = inject(Injector);

	get snapshot() {
		return untracked(this.title);
	}

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
