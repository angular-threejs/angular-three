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
import { extend, getLocalState, injectBeforeRender, injectStore, resolveRef } from 'angular-three';
import { assertInjector } from 'ngxtension/assert-injector';
import { Object3D } from 'three';

type HelperArgs<T> = T extends [infer _, ...infer R] ? R : never;

export function injectHelper<
	TConstructor extends new (...args: any[]) => Object3D,
	THelperInstance extends InstanceType<TConstructor> & { update: () => void; dispose: () => void },
>(
	object: () => ElementRef<Object3D> | Object3D | undefined | null,
	helperConstructor: () => TConstructor,
	{
		injector,
		args = () => [] as unknown as HelperArgs<ConstructorParameters<TConstructor>>,
	}: { injector?: Injector; args?: () => HelperArgs<ConstructorParameters<TConstructor>> } = {},
) {
	return assertInjector(injectHelper, injector, () => {
		const store = injectStore();
		const scene = store.select('scene');

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

			const _scene = scene();

			_scene.add(currentHelper);

			onCleanup(() => {
				_scene.remove(currentHelper);
				currentHelper.dispose?.();
			});
		});

		injectBeforeRender(() => {
			const currentHelper = helper();
			if (currentHelper) currentHelper.update();
		});

		return helper;
	});
}

@Component({
	selector: 'ngts-helper',
	template: `
		<ngt-object3D #helper />
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtsHelper<TConstructor extends new (...args: any[]) => Object3D> {
	type = input.required<TConstructor>();
	options = input<HelperArgs<ConstructorParameters<TConstructor>>>(
		[] as unknown as HelperArgs<ConstructorParameters<TConstructor>>,
	);

	helperRef = viewChild.required<ElementRef<Object3D>>('helper');

	private parent = computed(() => {
		const helper = this.helperRef().nativeElement;
		if (!helper) return;
		const localState = getLocalState(helper);
		if (!localState) return;
		return localState.parent();
	});

	helper = injectHelper(this.parent, this.type, { args: this.options });

	constructor() {
		extend({ Object3D });
	}
}
