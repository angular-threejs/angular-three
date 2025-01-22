import { DestroyRef, inject, Injector, signal } from '@angular/core';
import { assertInjector } from 'ngxtension/assert-injector';
import * as THREE from 'three';

export function injectProgress(injector?: Injector) {
	return assertInjector(injectProgress, injector, () => {
		const progress = signal<{
			errors: string[];
			active: boolean;
			progress: number;
			item: string;
			loaded: number;
			total: number;
		}>({ errors: [], active: false, progress: 0, item: '', loaded: 0, total: 0 });

		const defaultOnStart = THREE.DefaultLoadingManager.onStart?.bind(THREE.DefaultLoadingManager);
		const defaultOnLoad = THREE.DefaultLoadingManager.onLoad.bind(THREE.DefaultLoadingManager);
		const defaultOnError = THREE.DefaultLoadingManager.onError.bind(THREE.DefaultLoadingManager);
		const defaultOnProgress = THREE.DefaultLoadingManager.onProgress.bind(THREE.DefaultLoadingManager);

		let saveLastTotalLoaded = 0;

		THREE.DefaultLoadingManager.onStart = (item, loaded, total) => {
			progress.update((prev) => ({
				...prev,
				active: true,
				item,
				loaded,
				total,
				progress: ((loaded - saveLastTotalLoaded) / (total - saveLastTotalLoaded)) * 100,
			}));
		};

		THREE.DefaultLoadingManager.onLoad = () => {
			progress.update((prev) => ({ ...prev, active: false }));
		};

		THREE.DefaultLoadingManager.onError = (url) => {
			progress.update((prev) => ({ ...prev, errors: [...prev.errors, url] }));
		};

		THREE.DefaultLoadingManager.onProgress = (item, loaded, total) => {
			if (loaded === total) saveLastTotalLoaded = total;

			progress.update((prev) => ({
				...prev,
				item,
				loaded,
				total,
				progress: ((loaded - saveLastTotalLoaded) / (total - saveLastTotalLoaded)) * 100 || 100,
			}));
		};

		inject(DestroyRef).onDestroy(() => {
			THREE.DefaultLoadingManager.onStart = defaultOnStart;
			THREE.DefaultLoadingManager.onLoad = defaultOnLoad;
			THREE.DefaultLoadingManager.onError = defaultOnError;
			THREE.DefaultLoadingManager.onProgress = defaultOnProgress;
		});

		return progress.asReadonly();
	});
}
