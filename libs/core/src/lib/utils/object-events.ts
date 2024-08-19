import {
	afterNextRender,
	DestroyRef,
	Directive,
	effect,
	ElementRef,
	inject,
	Injector,
	model,
	output,
	Renderer2,
} from '@angular/core';
import { assertInjector } from 'ngxtension/assert-injector';
import { Object3D } from 'three';
import { NgtEventHandlers, NgtThreeEvent } from '../types';
import { resolveRef } from './resolve-ref';

@Directive({ standalone: true, selector: '[ngtObjectEvents]' })
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
	ngtObjectEvents = model<ElementRef<Object3D> | Object3D | null | undefined>();

	constructor() {
		const injector = inject(Injector);

		afterNextRender(() => {
			injectObjectEvents(
				this.ngtObjectEvents,
				{
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
				},
				{ injector },
			);
		});
	}

	private emitEvent<TEvent extends keyof NgtEventHandlers>(eventName: TEvent) {
		return this[eventName].emit.bind(this[eventName]) as NgtEventHandlers[TEvent];
	}
}

export const NgtObjectEventsHostDirective = {
	directive: NgtObjectEvents,
	inputs: ['ngtObjectEvents'],
	outputs: [
		'click',
		'dblclick',
		'contextmenu',
		'pointerup',
		'pointerdown',
		'pointerover',
		'pointerout',
		'pointerenter',
		'pointerleave',
		'pointermove',
		'pointermissed',
		'pointercancel',
		'wheel',
	],
};

export function injectObjectEvents(
	target: () => ElementRef<Object3D> | Object3D | null | undefined,
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
