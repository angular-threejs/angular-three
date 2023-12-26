import { CUSTOM_ELEMENTS_SCHEMA, Component, Input, computed } from '@angular/core';
import {
	NgtArgs,
	NgtKey,
	NgtPortal,
	NgtPortalContent,
	injectBeforeRender,
	injectNgtRef,
	signalStore,
} from 'angular-three-old';
import { NgtsPerspectiveCamera } from 'angular-three-soba-old/cameras';
import { injectNgtsFBO, type NgtsFBOParams } from 'angular-three-soba-old/misc';
import * as THREE from 'three';
import { Mesh } from 'three';
import { color, makeDecorators, makeStoryFunction, makeStoryObject } from '../setup-canvas';

@Component({
	selector: 'fbo-spinning-thing',
	standalone: true,
	template: `
		<ngt-mesh (beforeRender)="onBeforeRender($event.object)">
			<ngt-torus-knot-geometry *args="[1, 0.4, 100, 64]" />
			<ngt-mesh-normal-material />
		</ngt-mesh>
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class SpinningThing {
	onBeforeRender(thing: Mesh) {
		thing.rotation.x = thing.rotation.y = thing.rotation.z += 0.01;
	}
}

@Component({
	standalone: true,
	template: `
		<ngts-perspective-camera [position]="[0, 0, 3]" [cameraRef]="cameraRef" />

		<ngt-portal *key="scene()" [container]="scene()" [autoRender]="false">
			<fbo-spinning-thing *ngtPortalContent />
		</ngt-portal>

		<ngt-mesh>
			<ngt-box-geometry *args="[3, 3, 3]" />
			<ngt-mesh-standard-material [map]="texture()" />
		</ngt-mesh>
	`,
	imports: [SpinningThing, NgtsPerspectiveCamera, NgtPortal, NgtPortalContent, NgtArgs, NgtKey],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class DefaultFBOStory {
	cameraRef = injectNgtRef<THREE.PerspectiveCamera>();

	private inputs = signalStore<{ color: THREE.ColorRepresentation; fboParams: Partial<NgtsFBOParams['settings']> }>({
		color: 'orange' as THREE.ColorRepresentation,
	});
	@Input() set color(color: THREE.ColorRepresentation) {
		this.inputs.set({ color });
	}

	@Input() set fboParams(fboParams: Partial<NgtsFBOParams['settings']>) {
		this.inputs.set({ fboParams });
	}

	private _color = this.inputs.select('color');
	private _params = this.inputs.select('fboParams');

	scene = computed(() => {
		const scene = new THREE.Scene();
		scene.background = new THREE.Color(this._color());
		return scene;
	});

	private target = injectNgtsFBO(() => ({ width: this._params() }));
	texture = computed(() => this.target()?.texture);

	constructor() {
		injectBeforeRender((state) => {
			const [camera, target, scene] = [this.cameraRef.nativeElement, this.target(), this.scene()];
			if (!target) return;
			camera.position.z = 5 + Math.sin(state.clock.getElapsedTime() * 1.5) * 2;
			state.gl.setRenderTarget(target);
			state.gl.render(scene, camera);
			state.gl.setRenderTarget(null);
		});
	}
}

export default {
	title: 'Misc/injectNgtsFBO',
	decorators: makeDecorators(),
};

export const Default = makeStoryFunction(DefaultFBOStory);
export const WithSettings = makeStoryObject(DefaultFBOStory, {
	argsOptions: {
		color: color('blue'),
		fboParams: {
			multisample: true,
			samples: 8,
			stencilBuffer: false,
			format: THREE.RGBAFormat,
		},
	},
});
