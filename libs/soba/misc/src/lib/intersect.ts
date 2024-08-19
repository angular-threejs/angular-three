import {
	afterNextRender,
	Directive,
	effect,
	ElementRef,
	inject,
	Injector,
	model,
	signal,
	WritableSignal,
} from '@angular/core';
import { addAfterEffect, addEffect, resolveRef } from 'angular-three';
import { assertInjector } from 'ngxtension/assert-injector';
import { Object3D } from 'three';

export function injectIntersect<TObject extends Object3D>(
	object: () => ElementRef<TObject> | TObject | undefined | null,
	{ injector, source = signal(false) }: { injector?: Injector; source?: WritableSignal<boolean> } = {},
) {
	return assertInjector(injectIntersect, injector, () => {
		let check = false;
		let temp = false;

		effect((onCleanup) => {
			const obj = resolveRef(object());
			if (!obj) return;

			// Stamp out frustum check pre-emptively
			const unsub1 = addEffect(() => {
				check = false;
				return true;
			});

			// If the object is inside the frustum three will call onRender
			const oldOnRender = obj.onBeforeRender.bind(obj);
			obj.onBeforeRender = () => (check = true);

			// Compare the check value against the temp value, if it differs set state
			const unsub2 = addAfterEffect(() => {
				if (check !== temp) source.set((temp = check));
				return true;
			});

			onCleanup(() => {
				obj.onBeforeRender = oldOnRender;
				unsub1();
				unsub2();
			});
		});

		return source.asReadonly();
	});
}

@Directive({ standalone: true, selector: '[intersect]' })
export class NgtsIntersect {
	intersect = model(false);

	constructor() {
		const host = inject<ElementRef<Object3D>>(ElementRef);
		const injector = inject(Injector);
		afterNextRender(() => {
			injectIntersect(() => host, { source: this.intersect, injector });
		});
	}
}
