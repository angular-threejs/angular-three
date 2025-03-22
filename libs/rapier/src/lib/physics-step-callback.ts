import { DestroyRef, inject, Injector } from '@angular/core';
import { assertInjector } from 'ngxtension/assert-injector';
import { NgtrPhysics } from './physics';
import type { NgtrWorldStepCallback } from './types';

export function beforePhysicsStep(callback: NgtrWorldStepCallback, injector?: Injector) {
	return assertInjector(beforePhysicsStep, injector, () => {
		const physics = inject(NgtrPhysics);

		physics.beforeStepCallbacks.add(callback);

		inject(DestroyRef).onDestroy(() => {
			physics.beforeStepCallbacks.delete(callback);
		});
	});
}

export function afterPhysicsStep(callback: NgtrWorldStepCallback, injector?: Injector) {
	return assertInjector(afterPhysicsStep, injector, () => {
		const physics = inject(NgtrPhysics);

		physics.afterStepCallbacks.add(callback);

		inject(DestroyRef).onDestroy(() => {
			physics.afterStepCallbacks.delete(callback);
		});
	});
}
