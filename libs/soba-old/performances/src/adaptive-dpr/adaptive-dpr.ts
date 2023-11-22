import { Directive, Input, effect, signal, untracked } from '@angular/core';
import { injectNgtStore } from 'angular-three-old';

@Directive({ selector: 'ngts-adaptive-dpr', standalone: true })
export class NgtsAdaptiveDpr {
	private pixelated = signal(false);
	@Input({ alias: 'pixelated' }) set _pixelated(pixelated: boolean) {
		this.pixelated.set(pixelated);
	}

	private store = injectNgtStore();
	private current = this.store.select('performance', 'current');
	private active = this.store.get('internal', 'active');
	private setDpr = this.store.get('setDpr');
	private initialDpr = this.store.get('viewport', 'initialDpr');
	private domElement = this.store.get('gl', 'domElement');

	constructor() {
		effect((onCleanup) => {
			onCleanup(() => {
				if (this.active) {
					this.setDpr(this.initialDpr);
				}
				if (this.pixelated() && this.domElement) {
					this.domElement.style.imageRendering = 'auto';
				}
			});
		});

		effect(() => {
			const current = this.current();
			this.setDpr(current * this.initialDpr);
			if (untracked(this.pixelated) && this.domElement) {
				this.domElement.style.imageRendering = current === 1 ? 'auto' : 'pixelated';
			}
		});
	}
}
