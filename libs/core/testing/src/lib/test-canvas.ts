import {
	afterNextRender,
	ChangeDetectionStrategy,
	Component,
	ComponentRef,
	createEnvironmentInjector,
	DestroyRef,
	effect,
	EnvironmentInjector,
	inject,
	Injector,
	input,
	Type,
	ViewContainerRef,
} from '@angular/core';
import { extend, injectStore, provideNgtRenderer } from 'angular-three';
import * as THREE from 'three';

@Component({
	selector: 'ngt-test-canvas',
	template: '',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtTestCanvas {
	sceneGraph = input.required<Type<any>>();

	private ref?: ComponentRef<any>;
	private environmentInjector?: EnvironmentInjector;

	constructor() {
		extend(THREE);

		const vcr = inject(ViewContainerRef);
		const parentEnvironmentInjector = inject(EnvironmentInjector);
		const parentInjector = inject(Injector);
		const store = injectStore();

		afterNextRender(() => {
			effect(
				() => {
					const sceneGraph = this.sceneGraph();

					this.environmentInjector = createEnvironmentInjector([provideNgtRenderer(store)], parentEnvironmentInjector);

					this.ref = vcr.createComponent(sceneGraph, {
						environmentInjector: this.environmentInjector,
						injector: parentInjector,
					});
					this.ref.changeDetectorRef.detectChanges();
				},
				{ injector: parentInjector },
			);
		});

		inject(DestroyRef).onDestroy(() => {
			this.environmentInjector?.destroy();
			this.ref?.destroy();
		});
	}

	destroy() {
		this.environmentInjector?.destroy();
		this.ref?.destroy();
	}
}
