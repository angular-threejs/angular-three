import {
	afterNextRender,
	ChangeDetectionStrategy,
	Component,
	computed,
	CUSTOM_ELEMENTS_SCHEMA,
	ElementRef,
	Injector,
	input,
	signal,
	untracked,
	viewChild,
} from '@angular/core';
import { extend, getLocalState, injectBeforeRender, injectStore, resolveRef } from 'angular-three';
import { assertInjector } from 'ngxtension/assert-injector';
import { injectAutoEffect } from 'ngxtension/auto-effect';
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
		const autoEffect = injectAutoEffect();
		const store = injectStore();
		const scene = store.select('scene');

		const helper = signal<THelperInstance | null>(null);

		afterNextRender(() => {
			autoEffect(() => {
				let currentHelper: THelperInstance | undefined = undefined;
				const maybeObject3D = object();
				if (!maybeObject3D) return;

				const object3D = resolveRef(maybeObject3D);
				if (!object3D) return;

				currentHelper = new (helperConstructor() as any)(object3D, ...args());
				if (!currentHelper) return;

				untracked(() => {
					helper.set(currentHelper);
				});

				// Prevent the helpers from blocking rays
				currentHelper.traverse((child) => (child.raycast = () => null));
				scene().add(currentHelper);

				return () => {
					helper.set(null);
					scene().remove(currentHelper);
					currentHelper.dispose?.();
				};
			});
		});

		injectBeforeRender(() => {
			const currentHelper = helper();
			if (currentHelper) currentHelper.update();
		});

		return helper.asReadonly();
	});
}

@Component({
	standalone: true,
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
