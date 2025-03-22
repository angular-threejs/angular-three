import { DestroyRef, inject, Injector } from '@angular/core';
import { signalState } from 'angular-three';
import { assertInjector } from 'ngxtension/assert-injector';
import * as THREE from 'three';

export function progress(injector?: Injector) {
	return assertInjector(progress, injector, () => {
		const progressState = signalState<{
			errors: string[];
			active: boolean;
			progress: number;
			item: string;
			loaded: number;
			total: number;
		}>({ errors: [], active: false, progress: 0, item: '', loaded: 0, total: 0 });

		const defaultOnStart = THREE.DefaultLoadingManager.onStart?.bind(THREE.DefaultLoadingManager);
		const defaultOnLoad = THREE.DefaultLoadingManager.onLoad?.bind(THREE.DefaultLoadingManager);
		const defaultOnError = THREE.DefaultLoadingManager.onError?.bind(THREE.DefaultLoadingManager);
		const defaultOnProgress = THREE.DefaultLoadingManager.onProgress?.bind(THREE.DefaultLoadingManager);

		let saveLastTotalLoaded = 0;

		THREE.DefaultLoadingManager.onStart = (item, loaded, total) => {
			progressState.update({
				active: true,
				item,
				loaded,
				total,
				progress: ((loaded - saveLastTotalLoaded) / (total - saveLastTotalLoaded)) * 100,
			});
		};

		THREE.DefaultLoadingManager.onLoad = () => {
			progressState.update({ active: false });
		};

		THREE.DefaultLoadingManager.onError = (url) => {
			progressState.update((prev) => ({ errors: [...prev.errors, url] }));
		};

		THREE.DefaultLoadingManager.onProgress = (item, loaded, total) => {
			if (loaded === total) saveLastTotalLoaded = total;

			progressState.update({
				item,
				loaded,
				total,
				progress: ((loaded - saveLastTotalLoaded) / (total - saveLastTotalLoaded)) * 100 || 100,
			});
		};

		inject(DestroyRef).onDestroy(() => {
			THREE.DefaultLoadingManager.onStart = defaultOnStart;
			THREE.DefaultLoadingManager.onLoad = defaultOnLoad;
			THREE.DefaultLoadingManager.onError = defaultOnError;
			THREE.DefaultLoadingManager.onProgress = defaultOnProgress;
		});

		return progressState;
	});
}

/**
 * @deprecated Use `progress` instead. Will be removed in v5.0.0
 * @since v4.0.0
 */
export const injectProgress = progress;
