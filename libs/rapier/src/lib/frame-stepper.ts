import { Directive, effect, input } from '@angular/core';
import { injectStore } from 'angular-three';
import { NgtrPhysicsOptions } from './types';

@Directive({ standalone: true, selector: 'ngtr-frame-stepper' })
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

			const [type, updatePriority, stepFn] = [this.type(), this.updatePriority(), this.stepFn()];
			if (type === 'follow') {
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

			let lastFrame = 0;
			let raf: ReturnType<typeof requestAnimationFrame> = 0;
			const loop = () => {
				const now = performance.now();
				const delta = now - lastFrame;
				raf = requestAnimationFrame(loop);
				stepFn(delta);
				lastFrame = now;
			};

			raf = requestAnimationFrame(loop);
			onCleanup(() => cancelAnimationFrame(raf));
		});
	}
}
