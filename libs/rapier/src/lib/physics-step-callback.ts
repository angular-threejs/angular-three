import { DestroyRef, inject, Injector } from '@angular/core';
import { assertInjector } from 'ngxtension/assert-injector';
import { NgtrPhysics } from './physics';
import type { NgtrWorldStepCallback } from './types';

export function injectBeforePhysicsStep(callback: NgtrWorldStepCallback, injector?: Injector) {
	return assertInjector(injectBeforePhysicsStep, injector, () => {
		const physics = inject(NgtrPhysics);

		physics.beforeStepCallbacks.add(callback);

		inject(DestroyRef).onDestroy(() => {
			physics.beforeStepCallbacks.delete(callback);
		});
	});
}

export function injectAfterPhysicsStep(callback: NgtrWorldStepCallback, injector?: Injector) {
	return assertInjector(injectAfterPhysicsStep, injector, () => {
		const physics = inject(NgtrPhysics);

		physics.afterStepCallbacks.add(callback);

		inject(DestroyRef).onDestroy(() => {
			physics.afterStepCallbacks.delete(callback);
		});
	});
}
