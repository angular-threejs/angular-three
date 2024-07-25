import { afterNextRender, Directive, input, untracked } from '@angular/core';
import { injectStore } from 'angular-three';
import { injectAutoEffect } from 'ngxtension/auto-effect';

@Directive({ selector: 'ngts-adaptive-dpr', standalone: true })
export class NgtsAdaptiveDpr {
	pixelated = input(false);

	constructor() {
		const store = injectStore();
		const gl = store.select('gl');
		const active = store.select('internal', 'active');
		const current = store.select('performance', 'current');
		const initialDpr = store.select('viewport', 'initialDpr');
		const setDpr = store.select('setDpr');

		const autoEffect = injectAutoEffect();

		afterNextRender(() => {
			autoEffect(() => {
				const domElement = untracked(gl).domElement;
				return () => {
					const [_active, _setDpr, _initialDpr, pixelated] = [
						untracked(active),
						untracked(setDpr),
						untracked(initialDpr),
						untracked(this.pixelated),
					];

					if (_active) _setDpr(_initialDpr);
					if (pixelated && domElement) domElement.style.imageRendering = 'auto';
				};
			});

			autoEffect(() => {
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
		});
	}
}
