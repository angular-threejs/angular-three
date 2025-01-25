import { signal } from '@angular/core';
import { createInjectable } from 'ngxtension/create-injectable';

export const State = createInjectable(
	() => {
		const isDebugging = signal(false);
		const gravity = signal(-20);

		return {
			gravity: gravity.asReadonly(),
			isDebugging: isDebugging.asReadonly(),
			changeGravity: () => gravity.update((prev) => (prev === -20 ? -10 : -20)),
			toggleDebugging: () => isDebugging.update((prev) => !prev),
		};
	},
	{ providedIn: 'scoped' },
);
