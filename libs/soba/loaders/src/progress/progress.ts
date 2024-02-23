import { ChangeDetectorRef, inject, signal, untracked, type Injector } from '@angular/core';
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

			cdr.detectChanges();
		};

		THREE.DefaultLoadingManager.onLoad = () => {
			untracked(() => {
				progress.update((prev) => ({ ...prev, active: false }));
			});
			cdr.detectChanges();
		};

		THREE.DefaultLoadingManager.onError = (url) => {
			untracked(() => {
				progress.update((prev) => ({ ...prev, errors: [...prev.errors, url] }));
			});
			cdr.detectChanges();
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

			cdr.detectChanges();
		};

		return progress.asReadonly();
	});
}
