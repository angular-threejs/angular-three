import { Directive, Input, effect, inject } from '@angular/core';
import { injectNgtStore, signalStore } from 'angular-three-old';
import { NgtsEnvironmentInput, type NgtsEnvironmentInputState } from './environment-input';
import { injectNgtsEnvironment, setEnvProps } from './utils';

@Directive({
	selector: 'ngts-environment-cube',
	standalone: true,
})
export class NgtsEnvironmentCube {
	environmentInput = inject(NgtsEnvironmentInput);

	private inputs = signalStore<Pick<NgtsEnvironmentInputState, 'background'>>({ background: false });

	@Input({ alias: 'background' }) set _background(background: boolean) {
		this.inputs.set({ background });
	}

	private store = injectNgtStore();
	private scene = this.store.select('scene');

	private background = this.inputs.select('background');
	private textureRef = injectNgtsEnvironment(this.environmentInput.params);

	constructor() {
		this.setEnvProps();
	}

	private setEnvProps() {
		effect((onCleanup) => {
			const [defaultScene, scene, background, blur, texture] = [
				this.scene(),
				this.environmentInput.scene(),
				this.background(),
				this.environmentInput.blur(),
				this.textureRef.nativeElement,
			];
			if (!texture) return;
			const cleanUp = setEnvProps(background!, scene, defaultScene, texture, blur);
			onCleanup(cleanUp);
		});
	}
}
