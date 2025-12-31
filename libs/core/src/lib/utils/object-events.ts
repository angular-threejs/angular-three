import {
	computed,
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
import type * as THREE from 'three';
import type { NgtEventHandlers, NgtThreeEvent } from '../types';
import { is } from './is';
import { resolveRef } from './resolve-ref';

/**
 * Directive for binding Three.js pointer events to outputs.
 *
 * This directive provides outputs for all Three.js pointer events that can be used
 * with standard Angular event binding syntax. It's designed to be used as a host directive.
 *
 * Outputs: click, dblclick, contextmenu, pointerup, pointerdown, pointerover,
 * pointerout, pointerenter, pointerleave, pointermove, pointermissed, pointercancel, wheel
 *
 * Input: `objectEvents` - The Three.js object to listen for events on
 *
 * @example
 * ```typescript
 * @Component({
 *   hostDirectives: [{
 *     directive: NgtObjectEvents,
 *     inputs: ['objectEvents: events'],
 *     outputs: ['click', 'pointerover', 'pointerout']
 *   }]
 * })
 * export class MyMesh {
 *   objectEvents = inject(NgtObjectEvents, { host: true });
 *
 *   constructor() {
 *     this.objectEvents.events.set(this.meshRef);
 *   }
 * }
 * ```
 */
@Directive({ selector: '[objectEvents]' })
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
	events = model<
		| ElementRef<THREE.Object3D>
		| THREE.Object3D
		| null
		| undefined
		| (() => ElementRef<THREE.Object3D> | THREE.Object3D | null | undefined)
	>(undefined, { alias: 'objectEvents' });

	constructor() {
		const obj = computed(() => {
			const ngtObject = this.events();
			if (typeof ngtObject === 'function') return ngtObject();
			return ngtObject;
		});

		objectEvents(obj, {
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

/**
 * @deprecated Use objectEvents instead. Will be removed in v5.0.0
 * @since v4.0.0
 */
export const injectObjectEvents = objectEvents;

/**
 * Sets up event listeners on a Three.js object.
 *
 * This function creates reactive event bindings that automatically clean up
 * when the target changes or the component is destroyed.
 *
 * @param target - Signal or function returning the target Object3D
 * @param events - Object mapping event names to handler functions
 * @param options - Optional injector for dependency injection
 * @returns Array of cleanup functions
 *
 * @example
 * ```typescript
 * objectEvents(
 *   () => this.meshRef.nativeElement,
 *   {
 *     click: (event) => console.log('Clicked!', event),
 *     pointerover: (event) => console.log('Hover start'),
 *   }
 * );
 * ```
 */
export function objectEvents(
	target: () => ElementRef<THREE.Object3D> | THREE.Object3D | null | undefined,
	events: NgtEventHandlers,
	{ injector }: { injector?: Injector } = {},
) {
	return assertInjector(objectEvents, injector, () => {
		const renderer = inject(Renderer2);

		const cleanUps: Array<() => void> = [];

		effect((onCleanup) => {
			const targetObj = resolveRef(target());

			if (!targetObj || !is.instance(targetObj)) return;

			Object.entries(events).forEach(([eventName, eventHandler]) => {
				cleanUps.push(renderer.listen(targetObj, eventName, eventHandler));
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
