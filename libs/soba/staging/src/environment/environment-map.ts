import { Directive, Input, computed, effect, inject } from '@angular/core';
import { injectNgtStore, signalStore } from 'angular-three';
import { NgtsEnvironmentInput, NgtsEnvironmentInputState } from './environment-input';
import { setEnvProps } from './utils';

@Directive({
	selector: 'ngts-environment-map',
	standalone: true,
})
export class NgtsEnvironmentMap {
	environmentInput = inject(NgtsEnvironmentInput);
	private store = injectNgtStore();

	private inputs = signalStore<Pick<NgtsEnvironmentInputState, 'map' | 'background'>>({ background: false });

	@Input() set map(map: THREE.Texture) {
		this.inputs.set({ map });
	}

	@Input() set background(background: boolean) {
		this.inputs.set({ background });
	}

	constructor() {
		this.setEnvProps();
	}

	private setEnvProps() {
		const scene = this.store.select('scene');
		const background = this.inputs.select('background');
		const map = this.inputs.select('map');
		const trigger = computed(() => ({
			defaultScene: scene(),
			scene: this.environmentInput.scene(),
			background: background(),
			blur: this.environmentInput.blur(),
			texture: map(),
		}));

		effect((onCleanup) => {
			const { background, defaultScene, scene, blur, texture } = trigger();
			if (!texture) return;
			const cleanUp = setEnvProps(background!, scene, defaultScene, texture, blur);
			onCleanup(cleanUp);
		});
	}
}
