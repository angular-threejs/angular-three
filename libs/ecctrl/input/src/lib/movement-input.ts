import { Directive, effect, inject, input } from '@angular/core';
import { NgteEcctrl, type NgteEcctrlMovementInput } from 'angular-three-ecctrl';

type MovementKey = keyof NgteEcctrlMovementInput;

/** Declaratively binds a partial movement object to a mounted `ngte-ecctrl`. */
@Directive({
	selector: 'ngte-ecctrl[movementInput]',
})
export class NgteEcctrlMovementBinding {
	input = input.required<Partial<NgteEcctrlMovementInput>>({ alias: 'movementInput' });

	private readonly ecctrl = inject(NgteEcctrl, { host: true });

	constructor() {
		let ownedKeys = new Set<MovementKey>();
		effect(() => {
			const value = this.input();
			const nextKeys = new Set(Object.keys(value) as MovementKey[]);
			const cleared = clearOwnedMovement(ownedKeys, nextKeys);
			this.ecctrl.setMovement({ ...cleared, ...value });
			ownedKeys = nextKeys;
		});
	}
}

function clearOwnedMovement(current: Set<MovementKey>, next: Set<MovementKey>) {
	const cleared: Partial<NgteEcctrlMovementInput> = {};
	for (const key of current) {
		if (next.has(key)) continue;
		if (key === 'joystick') cleared.joystick = undefined;
		else cleared[key] = false;
	}
	return cleared;
}
