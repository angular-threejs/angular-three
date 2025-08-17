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

@Directive({ selector: '[ngtElementEvents]' })
/**
 * As host directive:
 * - outputs: [
 *   'created',
 *   'attached',
 *   'updated',
 * 'added', 'removed', 'childadded', 'childremoved', 'change', 'disposed'
 * ]
 * - inputs: [
 *   'ngtElementEvents'
 *   ]
 */
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
	ngtElementEvents = model<
		ElementRef<TElement> | TElement | null | undefined | (() => ElementRef<TElement> | TElement | null | undefined)
	>();

	constructor() {
		const obj = computed(() => {
			const ngtObject = this.ngtElementEvents();
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
