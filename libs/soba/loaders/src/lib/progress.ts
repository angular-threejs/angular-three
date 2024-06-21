import { ChangeDetectorRef, Injector, inject, signal, untracked } from '@angular/core';
import { assertInjector } from 'ngxtension/assert-injector';
import { DefaultLoadingManager } from 'three';

export function injectProgress(injector?: Injector) {
	return assertInjector(injectProgress, injector, () => {
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

		DefaultLoadingManager.onStart = (item, loaded, total) => {
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

		DefaultLoadingManager.onLoad = () => {
			untracked(() => {
				progress.update((prev) => ({ ...prev, active: false }));
			});
			cdr.detectChanges();
		};

		DefaultLoadingManager.onError = (url) => {
			untracked(() => {
				progress.update((prev) => ({ ...prev, errors: [...prev.errors, url] }));
			});
			cdr.detectChanges();
		};

		DefaultLoadingManager.onProgress = (item, loaded, total) => {
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
