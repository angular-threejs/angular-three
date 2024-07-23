import { afterNextRender, DestroyRef, ElementRef, inject, Injector, Renderer2 } from '@angular/core';
import { assertInjector } from 'ngxtension/assert-injector';
import { injectAutoEffect } from 'ngxtension/auto-effect';
import { Object3D } from 'three';
import { supportedEvents } from '../dom/events';
import { NgtDomEvent, NgtThreeEvent } from '../events';
import { resolveRef } from './resolve-ref';

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
