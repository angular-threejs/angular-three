import { ChangeDetectorRef, inject, signal, untracked, type Injector } from '@angular/core';
import { safeDetectChanges } from 'angular-three-old';
import { assertInjector } from 'ngxtension/assert-injector';
import * as THREE from 'three';

export function injectNgtsProgress(injector?: Injector) {
	return assertInjector(injectNgtsProgress, injector, () => {
		const cdr = inject(ChangeDetectorRef);

		const progress = signal<{
			errors: string[];
			active: boolean;
			progress: number;
			item: string;
			loaded: number;
			total: number;
		}>({ errors: [], active: false, progress: 0, item: '', loaded: 0, total: 0 });

		let saveLastTotalLoaded = 0;

		THREE.DefaultLoadingManager.onStart = (item, loaded, total) => {
			untracked(() => {
				progress.update((prev) => ({
					...prev,
					active: true,
					item,
					loaded,
					total,
					progress: ((loaded - saveLastTotalLoaded) / (total - saveLastTotalLoaded)) * 100,
				}));
			});

			safeDetectChanges(cdr);
		};

		THREE.DefaultLoadingManager.onLoad = () => {
			untracked(() => {
				progress.update((prev) => ({ ...prev, active: false }));
			});
			safeDetectChanges(cdr);
		};

		THREE.DefaultLoadingManager.onError = (url) => {
			untracked(() => {
				progress.update((prev) => ({ ...prev, errors: [...prev.errors, url] }));
			});
			safeDetectChanges(cdr);
		};

		THREE.DefaultLoadingManager.onProgress = (item, loaded, total) => {
			if (loaded === total) saveLastTotalLoaded = total;
			untracked(() => {
				progress.update((prev) => ({
					...prev,
					item,
					loaded,
					total,
					progress: ((loaded - saveLastTotalLoaded) / (total - saveLastTotalLoaded)) * 100 || 100,
				}));
			});

			safeDetectChanges(cdr);
		};

		return progress.asReadonly();
	});
}
