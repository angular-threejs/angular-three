import {
	afterNextRender,
	DestroyRef,
	Directive,
	ElementRef,
	inject,
	Injector,
	model,
	output,
	Renderer2,
} from '@angular/core';
import { assertInjector } from 'ngxtension/assert-injector';
import { injectAutoEffect } from 'ngxtension/auto-effect';
import { Object3D } from 'three';
import { supportedEvents } from '../dom/events';
import { NgtDomEvent, NgtThreeEvent } from '../types';
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
					click: (event) => this.click.emit(event),
					dblclick: (event) => this.dblclick.emit(event),
					contextmenu: (event) => this.contextmenu.emit(event),
					pointerup: (event) => this.pointerup.emit(event as NgtThreeEvent<PointerEvent>),
					pointerdown: (event) => this.pointerdown.emit(event as NgtThreeEvent<PointerEvent>),
					pointerover: (event) => this.pointerover.emit(event as NgtThreeEvent<PointerEvent>),
					pointerout: (event) => this.pointerout.emit(event as NgtThreeEvent<PointerEvent>),
					pointerenter: (event) => this.pointerenter.emit(event as NgtThreeEvent<PointerEvent>),
					pointerleave: (event) => this.pointerleave.emit(event as NgtThreeEvent<PointerEvent>),
					pointermove: (event) => this.pointermove.emit(event as NgtThreeEvent<PointerEvent>),
					pointermissed: (event) => this.pointermissed.emit(event),
					pointercancel: (event) => this.pointercancel.emit(event as NgtThreeEvent<PointerEvent>),
					wheel: (event) => this.wheel.emit(event as NgtThreeEvent<WheelEvent>),
				},
				{ injector },
			);
		});
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
	events: {
		[K in (typeof supportedEvents)[number]]?: (event: NgtThreeEvent<NgtDomEvent>) => void;
	},
	{ injector }: { injector?: Injector } = {},
) {
	return assertInjector(injectObjectEvents, injector, () => {
		const autoEffect = injectAutoEffect();
		const renderer = inject(Renderer2);

		const cleanUps: Array<() => void> = [];

		afterNextRender(() => {
			autoEffect(() => {
				const targetRef = resolveRef(target());
				if (!targetRef) return;

				Object.entries(events).forEach(([eventName, eventHandler]) => {
					cleanUps.push(renderer.listen(targetRef, eventName, eventHandler));
				});

				return () => {
					cleanUps.forEach((cleanUp) => cleanUp());
				};
			});
		});

		inject(DestroyRef).onDestroy(() => {
			cleanUps.forEach((cleanUp) => cleanUp());
		});

		return cleanUps;
	});
}
