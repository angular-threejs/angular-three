import { Directive, effect, ElementRef, inject, Injector, model, signal, WritableSignal } from '@angular/core';
import { addAfterEffect, addEffect, resolveRef } from 'angular-three';
import { assertInjector } from 'ngxtension/assert-injector';
import * as THREE from 'three';

/**
 * Tracks whether an object is within the camera's view frustum.
 *
 * Uses THREE.js's built-in frustum culling by monitoring `onBeforeRender` calls.
 * When an object is visible to the camera, THREE calls `onBeforeRender`, which
 * this function uses to detect visibility state changes.
 *
 * @typeParam TObject - Type of THREE.Object3D being tracked
 * @param object - Factory function returning the object to track
 * @param options - Optional configuration
 * @param options.injector - Custom injector for dependency injection context
 * @param options.source - Writable signal to update (default: creates new signal)
 * @returns Read-only signal that emits `true` when object is in frustum
 *
 * @example
 * ```typescript
 * const meshRef = viewChild<ElementRef<THREE.Mesh>>('mesh');
 * const isVisible = intersect(() => meshRef());
 *
 * effect(() => {
 *   if (isVisible()) {
 *     // Object is in view - start expensive animations
 *   }
 * });
 * ```
 */
export function intersect<TObject extends THREE.Object3D>(
	object: () => ElementRef<TObject> | TObject | undefined | null,
	{ injector, source = signal(false) }: { injector?: Injector; source?: WritableSignal<boolean> } = {},
) {
	return assertInjector(intersect, injector, () => {
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
			const oldOnRender = obj.onBeforeRender?.bind(obj);
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

/**
 * @deprecated Use `intersect` instead. Will be removed in v5.0.0.
 * @since v4.0.0
 * @see intersect
 */
export const injectIntersect = intersect;

/**
 * Directive that tracks whether the host Object3D is in the camera frustum.
 *
 * Apply to any THREE.js element to get a two-way bound signal indicating
 * whether the object is currently visible to the camera.
 *
 * @example
 * ```html
 * <ngt-mesh [(intersect)]="isInView">
 *   <ngt-box-geometry />
 *   <ngt-mesh-basic-material />
 * </ngt-mesh>
 * ```
 *
 * ```typescript
 * isInView = signal(false);
 *
 * effect(() => {
 *   console.log('Mesh visible:', this.isInView());
 * });
 * ```
 */
@Directive({ selector: '[intersect]' })
export class NgtsIntersect {
	/**
	 * Two-way bound signal indicating frustum intersection state.
	 * `true` when object is visible, `false` when outside frustum.
	 */
	intersect = model(false);

	constructor() {
		const host = inject<ElementRef<THREE.Object3D>>(ElementRef);
		intersect(() => host, { source: this.intersect });
	}
}
