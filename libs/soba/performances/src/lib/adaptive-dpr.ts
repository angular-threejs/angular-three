import { DestroyRef, Directive, effect, inject, input, untracked } from '@angular/core';
import { injectStore } from 'angular-three';

@Directive({ selector: 'ngts-adaptive-dpr' })
export class NgtsAdaptiveDpr {
	pixelated = input(false);

	constructor() {
		const store = injectStore();

		effect(() => {
			const [current, pixelated, domElement, setDpr, initialDpr] = [
				store.performance.current(),
				untracked(this.pixelated),
				store.snapshot.gl.domElement,
				store.snapshot.setDpr,
				store.snapshot.viewport.initialDpr,
			];

			setDpr(current * initialDpr);
			if (pixelated && domElement) domElement.style.imageRendering = current === 1 ? 'auto' : 'pixelated';
		});

		inject(DestroyRef).onDestroy(() => {
			const [domElement, active, setDpr, initialDpr, pixelated] = [
				store.snapshot.gl.domElement,
				store.snapshot.internal.active,
				store.snapshot.setDpr,
				store.snapshot.viewport.initialDpr,
				untracked(this.pixelated),
			];

			if (active) setDpr(initialDpr);
			if (pixelated && domElement) domElement.style.imageRendering = 'auto';
		});
	}
}
