import { Directive, Input, computed, effect, inject } from '@angular/core';
import { injectNgtStore, signalStore } from 'angular-three';
import { NgtsEnvironmentInput, NgtsEnvironmentInputState } from './environment-input';
import { injectNgtsEnvironment, setEnvProps } from './utils';

@Directive({
	selector: 'ngts-environment-cube',
	standalone: true,
})
export class NgtsEnvironmentCube {
	environmentInput = inject(NgtsEnvironmentInput);
	private store = injectNgtStore();
	private textureRef = injectNgtsEnvironment(this.environmentInput.params);

	private inputs = signalStore<Pick<NgtsEnvironmentInputState, 'background'>>({ background: false });

	@Input() set background(background: boolean) {
		this.inputs.set({ background });
	}

	constructor() {
		this.setEnvProps();
	}

	private setEnvProps() {
		const scene = this.store.select('scene');
		const background = this.inputs.select('background');
		const trigger = computed(() => ({
			defaultScene: scene(),
			scene: this.environmentInput.scene(),
			background: background(),
			blur: this.environmentInput.blur(),
			texture: this.textureRef.nativeElement,
		}));

		effect((onCleanup) => {
			const { background, defaultScene, scene, blur, texture } = trigger();
			if (!texture) return;
			const cleanUp = setEnvProps(background!, scene, defaultScene, texture, blur);
			onCleanup(cleanUp);
		});
	}
}
