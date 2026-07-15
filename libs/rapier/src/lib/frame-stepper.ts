import { Directive, effect, input } from '@angular/core';
import { injectStore } from 'angular-three';
import { NgtrPhysicsOptions } from './types';

/**
 * Internal directive that manages the physics simulation loop.
 * Handles both "follow" mode (tied to render loop) and "independent" mode (separate loop).
 *
 * This directive is used internally by NgtrPhysics and should not be used directly.
 */
@Directive({ selector: 'ngtr-frame-stepper' })
export class NgtrFrameStepper {
	ready = input(false);
	updatePriority = input<number | undefined>(0);
	stepFn = input.required<(delta: number) => void>();
	type = input.required<NgtrPhysicsOptions['updateLoop']>();

	constructor() {
		const store = injectStore();

		effect((onCleanup) => {
			const ready = this.ready();
			if (!ready) return;

			const [type, stepFn] = [this.type(), this.stepFn()];

			if (type === 'follow') {
				const updatePriority = this.updatePriority();
				const cleanup = store.snapshot.internal.subscribe(
					({ delta }) => {
						stepFn(delta);
					},
					updatePriority,
					store,
				);
				onCleanup(() => cleanup());
				return;
			}

			onCleanup(startIndependentFrameLoop(stepFn));
		});
	}
}

/** @internal Starts an RAF loop whose deltas are expressed in seconds. */
export function startIndependentFrameLoop(
	step: (delta: number) => void,
	requestFrame: typeof requestAnimationFrame = requestAnimationFrame,
	cancelFrame: typeof cancelAnimationFrame = cancelAnimationFrame,
) {
	let lastFrame: number | null = null;
	let raf = 0;
	const loop: FrameRequestCallback = (now) => {
		raf = requestFrame(loop);
		if (lastFrame !== null) {
			const delta = (now - lastFrame) / 1000;
			if (Number.isFinite(delta) && delta > 0) step(delta);
		}
		lastFrame = now;
	};

	raf = requestFrame(loop);
	return () => cancelFrame(raf);
}
