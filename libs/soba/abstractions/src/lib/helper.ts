import {
	ChangeDetectionStrategy,
	Component,
	computed,
	CUSTOM_ELEMENTS_SCHEMA,
	effect,
	ElementRef,
	Injector,
	input,
	viewChild,
} from '@angular/core';
import { beforeRender, extend, getInstanceState, injectStore, resolveRef } from 'angular-three';
import { assertInjector } from 'ngxtension/assert-injector';
import * as THREE from 'three';
import { Object3D } from 'three';

/**
 * Extracts helper constructor arguments, excluding the first argument (the object being helped).
 */
type HelperArgs<T> = T extends [infer _, ...infer R] ? R : never;

/**
 * Creates a Three.js helper object for the given object and manages its lifecycle.
 * The helper is automatically added to the scene, updated on each frame, and disposed on cleanup.
 *
 * @param object - Function returning the target object to attach the helper to
 * @param helperConstructor - Function returning the helper class constructor
 * @param options - Optional configuration object
 * @param options.injector - Optional injector for dependency injection context
 * @param options.args - Function returning additional constructor arguments for the helper
 * @returns Signal containing the helper instance or null
 *
 * @example
 * ```typescript
 * // In a component
 * meshRef = viewChild<ElementRef<Mesh>>('mesh');
 *
 * boxHelper = helper(
 *   () => this.meshRef(),
 *   () => BoxHelper,
 *   { args: () => ['red'] }
 * );
 * ```
 */
export function helper<
	TConstructor extends new (...args: any[]) => THREE.Object3D,
	THelperInstance extends InstanceType<TConstructor> & { update: () => void; dispose: () => void },
>(
	object: () => ElementRef<THREE.Object3D> | THREE.Object3D | undefined | null,
	helperConstructor: () => TConstructor,
	{
		injector,
		args = () => [] as unknown as HelperArgs<ConstructorParameters<TConstructor>>,
	}: { injector?: Injector; args?: () => HelperArgs<ConstructorParameters<TConstructor>> } = {},
) {
	return assertInjector(helper, injector, () => {
		const store = injectStore();

		const helper = computed(() => {
			const maybeObject3D = object();
			if (!maybeObject3D) return null;

			const object3D = resolveRef(maybeObject3D);
			if (!object3D) return null;

			const currentHelper: THelperInstance = new (helperConstructor() as any)(object3D, ...args());
			currentHelper.traverse((child) => (child.raycast = () => null));
			return currentHelper;
		});

		effect((onCleanup) => {
			const currentHelper = helper();
			if (!currentHelper) return;

			const scene = store.scene();

			scene.add(currentHelper);

			onCleanup(() => {
				scene.remove(currentHelper);
				currentHelper.dispose?.();
			});
		});

		beforeRender(() => {
			const currentHelper = helper();
			if (currentHelper) currentHelper.update();
		});

		return helper;
	});
}

/**
 * @deprecated Use `helper` function instead. Will be removed in v5.0.0.
 * @since v4.0.0
 */
export const injectHelper = helper;

/**
 * A component wrapper for attaching Three.js helper objects to their parent mesh.
 * Automatically detects the parent object and creates the specified helper type.
 *
 * @example
 * ```html
 * <ngt-mesh>
 *   <ngt-box-geometry />
 *   <ngt-mesh-basic-material />
 *   <ngts-helper [type]="BoxHelper" [options]="['royalblue']" />
 * </ngt-mesh>
 * ```
 */
@Component({
	selector: 'ngts-helper',
	template: `
		<ngt-object3D #helper />
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtsHelper<TConstructor extends new (...args: any[]) => THREE.Object3D> {
	type = input.required<TConstructor>();
	options = input<HelperArgs<ConstructorParameters<TConstructor>>>(
		[] as unknown as HelperArgs<ConstructorParameters<TConstructor>>,
	);

	helperRef = viewChild.required<ElementRef<THREE.Object3D>>('helper');

	private parent = computed(() => {
		const helper = this.helperRef().nativeElement;
		if (!helper) return;
		const instanceState = getInstanceState(helper);
		if (!instanceState) return;
		return instanceState.parent() as unknown as THREE.Object3D;
	});

	helper = helper(this.parent, this.type, { args: this.options });

	constructor() {
		extend({ Object3D });
	}
}
