import { DestroyRef, Directive, effect, inject, input, untracked } from '@angular/core';
import { injectStore } from 'angular-three';

@Directive({ selector: 'ngts-adaptive-dpr' })
export class NgtsAdaptiveDpr {
	pixelated = input(false);

	constructor() {
		const store = injectStore();
		const gl = store.select('gl');
		const active = store.select('internal', 'active');
		const current = store.select('performance', 'current');
		const initialDpr = store.select('viewport', 'initialDpr');
		const setDpr = store.select('setDpr');

		effect(() => {
			const [_current, pixelated, domElement, _setDpr, _initialDpr] = [
				current(),
				untracked(this.pixelated),
				untracked(gl).domElement,
				untracked(setDpr),
				untracked(initialDpr),
			];

			_setDpr(_current * _initialDpr);
			if (pixelated && domElement) domElement.style.imageRendering = _current === 1 ? 'auto' : 'pixelated';
		});

		inject(DestroyRef).onDestroy(() => {
			const [domElement, _active, _setDpr, _initialDpr, pixelated] = [
				untracked(gl).domElement,
				untracked(active),
				untracked(setDpr),
				untracked(initialDpr),
				untracked(this.pixelated),
			];

			if (_active) _setDpr(_initialDpr);
			if (pixelated && domElement) domElement.style.imageRendering = 'auto';
		});
	}
}
