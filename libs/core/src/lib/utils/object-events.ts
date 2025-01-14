import { DestroyRef, Directive, effect, ElementRef, inject, Injector, model, output, Renderer2 } from '@angular/core';
import { assertInjector } from 'ngxtension/assert-injector';
import type * as THREE from 'three';
import type { NgtEventHandlers, NgtThreeEvent } from '../types';
import { resolveRef } from './resolve-ref';

@Directive({ selector: '[ngtObjectEvents]' })
/**
 * As host directive:
 * - outputs: [
 * 'click',
 * 'dblclick',
 * 'contextmenu',
 * 'pointerup',
 * 'pointerdown',
 * 'pointerover',
 * 'pointerout',
 * 'pointerenter',
 * 'pointerleave',
 * 'pointermove',
 * 'pointermissed',
 * 'pointercancel',
 * 'wheel',
 * ]
 * - inputs: [
 *   'ngtObjectEvents'
 *   ]
 */
export class NgtObjectEvents {
	click = output<NgtThreeEvent<MouseEvent>>();
	dblclick = output<NgtThreeEvent<MouseEvent>>();
	contextmenu = output<NgtThreeEvent<MouseEvent>>();
	pointerup = output<NgtThreeEvent<PointerEvent>>();
	pointerdown = output<NgtThreeEvent<PointerEvent>>();
	pointerover = output<NgtThreeEvent<PointerEvent>>();
	pointerout = output<NgtThreeEvent<PointerEvent>>();
	pointerenter = output<NgtThreeEvent<PointerEvent>>();
	pointerleave = output<NgtThreeEvent<PointerEvent>>();
	pointermove = output<NgtThreeEvent<PointerEvent>>();
	pointermissed = output<NgtThreeEvent<MouseEvent>>();
	pointercancel = output<NgtThreeEvent<PointerEvent>>();
	wheel = output<NgtThreeEvent<WheelEvent>>();

	// NOTE: we use model here to allow for the hostDirective host to set this value
	ngtObjectEvents = model<ElementRef<THREE.Object3D> | THREE.Object3D | null | undefined>();

	constructor() {
		injectObjectEvents(this.ngtObjectEvents, {
			click: this.emitEvent('click'),
			dblclick: this.emitEvent('dblclick'),
			contextmenu: this.emitEvent('contextmenu'),
			pointerup: this.emitEvent('pointerup'),
			pointerdown: this.emitEvent('pointerdown'),
			pointerover: this.emitEvent('pointerover'),
			pointerout: this.emitEvent('pointerout'),
			pointerenter: this.emitEvent('pointerenter'),
			pointerleave: this.emitEvent('pointerleave'),
			pointermove: this.emitEvent('pointermove'),
			pointermissed: this.emitEvent('pointermissed'),
			pointercancel: this.emitEvent('pointercancel'),
			wheel: this.emitEvent('wheel'),
		});
	}

	private emitEvent<TEvent extends keyof NgtEventHandlers>(eventName: TEvent) {
		return this[eventName].emit.bind(this[eventName]) as NgtEventHandlers[TEvent];
	}
}

export function injectObjectEvents(
	target: () => ElementRef<THREE.Object3D> | THREE.Object3D | null | undefined,
	events: NgtEventHandlers,
	{ injector }: { injector?: Injector } = {},
) {
	return assertInjector(injectObjectEvents, injector, () => {
		const renderer = inject(Renderer2);

		const cleanUps: Array<() => void> = [];

		effect((onCleanup) => {
			const targetRef = resolveRef(target());

			if (!targetRef) return;

			Object.entries(events).forEach(([eventName, eventHandler]) => {
				cleanUps.push(renderer.listen(targetRef, eventName, eventHandler));
			});

			onCleanup(() => {
				cleanUps.forEach((cleanUp) => cleanUp());
			});
		});

		inject(DestroyRef).onDestroy(() => {
			cleanUps.forEach((cleanUp) => cleanUp());
		});

		return cleanUps;
	});
}
