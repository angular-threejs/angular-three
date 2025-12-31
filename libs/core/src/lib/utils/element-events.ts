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
import type { NgtAfterAttach } from '../types';
import { is } from './is';
import { resolveRef } from './resolve-ref';

/**
 * Directive for binding Three.js element lifecycle events to outputs.
 *
 * This directive provides outputs for Angular Three element events and native
 * Three.js events like added, removed, and disposed. It's designed to be used
 * as a host directive.
 *
 * Outputs:
 * - Angular Three: created, attached, updated
 * - Three.js: added, removed, childadded, childremoved, change, disposed
 *
 * Input: `elementEvents` - The element to listen for events on
 *
 * @example
 * ```typescript
 * @Component({
 *   hostDirectives: [{
 *     directive: NgtElementEvents,
 *     inputs: ['elementEvents: events'],
 *     outputs: ['attached', 'updated']
 *   }]
 * })
 * export class MyMesh {
 *   elementEvents = inject(NgtElementEvents, { host: true });
 *
 *   constructor() {
 *     this.elementEvents.events.set(this.meshRef);
 *   }
 * }
 * ```
 */
@Directive({ selector: '[elementEvents]' })
export class NgtElementEvents<TElement extends object> {
	created = output<TElement>();
	attached = output<NgtAfterAttach<TElement>>();
	updated = output<TElement>();

	added = output<any>();
	removed = output<any>();
	childadded = output<any>();
	childremoved = output<any>();
	change = output<any>();
	disposed = output<any>();

	// NOTE: we use model here to allow for the hostDirective host to set this value
	events = model<
		ElementRef<TElement> | TElement | null | undefined | (() => ElementRef<TElement> | TElement | null | undefined)
	>(undefined, { alias: 'elementEvents' });

	constructor() {
		const obj = computed(() => {
			const ngtObject = this.events();
			if (typeof ngtObject === 'function') return ngtObject();
			return ngtObject;
		});

		elementEvents(obj, {
			// @ts-expect-error - different type
			created: this.emitEvent('created'),
			// @ts-expect-error - different type
			updated: this.emitEvent('updated'),
			// @ts-expect-error - different type for attached
			attached: this.emitEvent('attached'),
			added: this.emitEvent('added'),
			removed: this.emitEvent('removed'),
			childadded: this.emitEvent('childadded'),
			childremoved: this.emitEvent('childremoved'),
			change: this.emitEvent('change'),
			disposed: this.emitEvent('disposed'),
		});
	}

	private emitEvent<
		TEvent extends
			| 'created'
			| 'updated'
			| 'attached'
			| 'added'
			| 'removed'
			| 'childadded'
			| 'childremoved'
			| 'change'
			| 'disposed',
	>(eventName: TEvent) {
		return this[eventName].emit.bind(this[eventName]);
	}
}

/**
 * Sets up element lifecycle event listeners on a Three.js element.
 *
 * @typeParam TElement - The type of the element
 * @param target - Signal or function returning the target element
 * @param events - Object mapping event names to handler functions
 * @param options - Optional injector for dependency injection
 * @returns Array of cleanup functions
 *
 * @example
 * ```typescript
 * elementEvents(
 *   () => this.meshRef.nativeElement,
 *   {
 *     created: (mesh) => console.log('Mesh created'),
 *     attached: ({ parent, node }) => console.log('Attached to', parent),
 *   }
 * );
 * ```
 */
export function elementEvents<TElement extends object>(
	target: () => ElementRef<TElement> | TElement | null | undefined,
	events: {
		created?: (element: TElement) => void;
		updated?: (element: TElement) => void;
		attached?: (element: NgtAfterAttach<TElement>) => void;
		added?: (event: any) => void;
		removed?: (event: any) => void;
		childadded?: (event: any) => void;
		childremoved?: (event: any) => void;
		change?: (event: any) => void;
		disposed?: (event: any) => void;
	},
	{ injector }: { injector?: Injector } = {},
) {
	return assertInjector(elementEvents, injector, () => {
		const renderer = inject(Renderer2);

		const cleanUps: Array<() => void> = [];

		effect((onCleanup) => {
			const targetObj = resolveRef(target());

			if (!targetObj || !is.instance(targetObj)) return;

			Object.keys(events).forEach((eventName) => {
				cleanUps.push(renderer.listen(targetObj, eventName, events[eventName as keyof typeof events] as any));
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
