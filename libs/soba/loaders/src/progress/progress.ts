import { ChangeDetectorRef, inject, runInInjectionContext, signal, type Injector } from '@angular/core';
import { assertInjectionContext, safeDetectChanges } from 'angular-three';
import * as THREE from 'three';

export function injectNgtsProgress(injector?: Injector) {
	injector = assertInjectionContext(injectNgtsProgress, injector);
	return runInInjectionContext(injector, () => {
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
			progress.update((prev) => ({
				...prev,
				active: true,
				item,
				loaded,
				total,
				progress: ((loaded - saveLastTotalLoaded) / (total - saveLastTotalLoaded)) * 100,
			}));
			safeDetectChanges(cdr);
		};

		THREE.DefaultLoadingManager.onLoad = () => {
			progress.update((prev) => ({ ...prev, active: false }));
			safeDetectChanges(cdr);
			cdr.detectChanges();
		};

		THREE.DefaultLoadingManager.onError = (url) => {
			progress.update((prev) => ({ ...prev, errors: [...prev.errors, url] }));
			safeDetectChanges(cdr);
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
			safeDetectChanges(cdr);
		};

		return progress.asReadonly();
	});
}
