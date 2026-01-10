import { DestroyRef, inject, Injector } from '@angular/core';
import { signalState } from 'angular-three';
import { assertInjector } from 'ngxtension/assert-injector';
import * as THREE from 'three';

/**
 * Creates a reactive state object that tracks Three.js asset loading progress.
 *
 * This function hooks into THREE.DefaultLoadingManager to monitor all asset
 * loading operations and provides reactive signals for progress tracking.
 * The state includes progress percentage, active status, error tracking, and
 * details about the currently loading item.
 *
 * The loading manager hooks are automatically cleaned up when the injection
 * context is destroyed.
 *
 * @param injector - Optional injector for dependency injection context
 * @returns A signal state object with the following properties:
 *   - `errors`: Array of URLs that failed to load
 *   - `active`: Whether loading is currently in progress
 *   - `progress`: Loading progress percentage (0-100)
 *   - `item`: URL of the currently loading item
 *   - `loaded`: Number of items loaded
 *   - `total`: Total number of items to load
 *
 * @example
 * ```typescript
 * // In a component or service
 * const loadingState = progress();
 *
 * effect(() => {
 *   if (loadingState.active()) {
 *     console.log(`Loading: ${loadingState.progress()}%`);
 *   }
 * });
 *
 * // Check for errors
 * effect(() => {
 *   const errors = loadingState.errors();
 *   if (errors.length > 0) {
 *     console.error('Failed to load:', errors);
 *   }
 * });
 * ```
 */
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
				active: true,
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
 * Alias for the `progress` function.
 *
 * @deprecated Use `progress` instead. Will be removed in v5.0.0
 * @since v4.0.0
 *
 * @see {@link progress}
 */
export const injectProgress = progress;
