import { booleanAttribute, DestroyRef, Directive, effect, inject, input, untracked } from '@angular/core';
import { injectStore } from 'angular-three';

/**
 * A directive that dynamically adjusts the device pixel ratio (DPR) based on performance metrics.
 *
 * This directive monitors the current performance state and automatically scales the DPR
 * to maintain smooth frame rates. When performance degrades, DPR is reduced; when performance
 * recovers, DPR is restored to the initial value.
 *
 * @example
 * ```html
 * <ngts-adaptive-dpr />
 * <!-- With pixelated rendering during low performance -->
 * <ngts-adaptive-dpr [pixelated]="true" />
 * ```
 */
@Directive({ selector: 'ngts-adaptive-dpr' })
export class NgtsAdaptiveDpr {
	/**
	 * When true, applies pixelated image rendering style during reduced DPR states.
	 * This can provide a retro aesthetic or indicate to users that performance mode is active.
	 * @default false
	 */
	pixelated = input(false, { transform: booleanAttribute });

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
