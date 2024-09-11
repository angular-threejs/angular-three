import { afterNextRender, Directive, input } from '@angular/core';
import { injectBeforeRender } from 'angular-three';
import { injectAutoEffect } from 'ngxtension/auto-effect';
import { NgtrPhysicsOptions } from './types';

@Directive({ standalone: true, selector: 'ngtr-frame-stepper' })
export class NgtrFrameStepper {
	ready = input(false);
	updatePriority = input<number | undefined>(0);
	stepFn = input.required<(delta: number) => void>();
	type = input.required<NgtrPhysicsOptions['updateLoop']>();

	constructor() {
		const autoEffect = injectAutoEffect();

		afterNextRender(() => {
			autoEffect((injector) => {
				const ready = this.ready();
				if (!ready) return;

				const [type, updatePriority, stepFn] = [this.type(), this.updatePriority(), this.stepFn()];
				if (type === 'follow') {
					return injectBeforeRender(
						({ delta }) => {
							stepFn(delta);
						},
						{ priority: updatePriority, injector },
					);
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

				return () => {
					cancelAnimationFrame(raf);
				};
			});
		});
	}
}
