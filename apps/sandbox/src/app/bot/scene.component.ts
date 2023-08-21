import { CUSTOM_ELEMENTS_SCHEMA, Component, computed, signal } from '@angular/core';
import { NgtArgs } from 'angular-three';
import { NgtpBloom, NgtpEffectComposer } from 'angular-three-postprocessing';
import { NgtsGrid } from 'angular-three-soba/abstractions';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import { injectNgtsGLTFLoader } from 'angular-three-soba/loaders';
import { injectNgtsAnimations } from 'angular-three-soba/misc';

@Component({
	standalone: true,
	template: `
		<ngt-ambient-light />
		<ngt-point-light />
		<ngt-primitive *args="[bot()]" [ref]="animations.ref" [position]="[0, -1, 0]" />
		<ngts-orbit-controls />
		<ngts-grid [position]="[0, -1, 0]" [args]="[10, 10]" />

		<ngtp-effect-composer>
			<ngtp-bloom [intensity]="1.5" />
		</ngtp-effect-composer>
	`,
	imports: [NgtArgs, NgtsOrbitControls, NgtsGrid, NgtpEffectComposer, NgtpBloom],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class BotScene {
	Math = Math;

	active = signal(false);
	hover = signal(false);

	private yBotGltf = injectNgtsGLTFLoader(() => 'assets/ybot.glb');

	animations = injectNgtsAnimations(() => this.yBotGltf()?.animations || []);
	bot = computed(() => {
		const gltf = this.yBotGltf();
		if (gltf) {
			return gltf.scene;
		}
		return null;
	});
}
