import { Directive, Input, effect, inject } from '@angular/core';
import { injectNgtStore, signalStore } from 'angular-three';
import { NgtsEnvironmentInput, type NgtsEnvironmentInputState } from './environment-input';
import { setEnvProps } from './utils';

@Directive({
	selector: 'ngts-environment-map',
	standalone: true,
})
export class NgtsEnvironmentMap {
	environmentInput = inject(NgtsEnvironmentInput);
	private store = injectNgtStore();

	private inputs = signalStore<Pick<NgtsEnvironmentInputState, 'map' | 'background'>>({ background: false });

	@Input({ alias: 'map' }) set _map(map: THREE.Texture) {
		this.inputs.set({ map });
	}

	@Input({ alias: 'background' }) set _background(background: boolean) {
		this.inputs.set({ background });
	}

	constructor() {
		this.setEnvProps();
	}

	private scene = this.store.select('scene');
	private background = this.inputs.select('background');
	private map = this.inputs.select('map');

	private setEnvProps() {
		effect((onCleanup) => {
			const [defaultScene, scene, background, blur, texture] = [
				this.scene(),
				this.environmentInput.scene(),
				this.background(),
				this.environmentInput.blur(),
				this.map(),
			];
			if (!texture) return;
			const cleanUp = setEnvProps(background!, scene, defaultScene, texture, blur);
			onCleanup(cleanUp);
		});
	}
}
