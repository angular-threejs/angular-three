import { computed, signal } from '@angular/core';

export const isDebugging = (() => {
	const state = signal(false);

	return {
		toggle: () => {
			state.update((prev) => !prev);
		},
		isDebugging: state.asReadonly(),
	};
})();

export const gravity = (() => {
	const state = signal(-20);

	return {
		change: () => {
			state.update((prev) => (prev === -20 ? -10 : -20));
		},
		gravity: state.asReadonly(),
		btnText: computed(() => `Change gravity to ${state() === -20 ? '-10' : '-20'}`),
	};
})();
