import {
	CUSTOM_ELEMENTS_SCHEMA,
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	computed,
	input,
	viewChild,
} from '@angular/core';
import { NgtArgs, NgtPortal, NgtPortalContent, injectBeforeRender } from 'angular-three';
import { NgtsPerspectiveCamera } from 'angular-three-soba/cameras';
import { NgtsFBO } from 'angular-three-soba/misc';
import { Color, Mesh, Scene, WebGLRenderTarget } from 'three';
import { makeDecorators, makeStoryFunction, makeStoryObject, number } from '../setup-canvas';

@Component({
	selector: 'fbo-spinning-thing',
	standalone: true,
	template: `
		<ngt-mesh #mesh>
			<ngt-torus-knot-geometry *args="[1, 0.4, 100, 64]" />
			<ngt-mesh-normal-material />
		</ngt-mesh>
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class SpinningThing {
	mesh = viewChild.required<ElementRef<Mesh>>('mesh');

	constructor() {
		injectBeforeRender(() => {
			const { nativeElement } = this.mesh();
			nativeElement.rotation.x = nativeElement.rotation.y = nativeElement.rotation.z += 0.01;
		});
	}
}

@Component({
	selector: 'fbo-target-wrapper',
	template: `
		<ngts-perspective-camera [options]="{ position: [0, 0, 3] }" />

		<ngt-portal [container]="scene()">
			<fbo-spinning-thing *portalContent />
		</ngt-portal>

		<ngt-mesh>
			<ngt-box-geometry *args="[3, 3, 3]" />
			<ngt-mesh-standard-material [map]="target().texture" />
		</ngt-mesh>
	`,
	standalone: true,
	imports: [NgtsPerspectiveCamera, SpinningThing, NgtPortal, NgtPortalContent, NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class TargetWrapper {
	target = input.required<WebGLRenderTarget>();

	camera = viewChild.required(NgtsPerspectiveCamera);
	scene = computed(() => {
		const scene = new Scene();
		scene.background = new Color('orange');
		return scene;
	});

	constructor() {
		injectBeforeRender(({ gl }) => {
			const [camera, scene, target] = [this.camera().cameraRef().nativeElement, this.scene(), this.target()];
			if (!target) return;
			camera.position.z = 5 + Math.sin(Date.now() * 0.001) * 2;
			gl.setRenderTarget(target);
			gl.render(scene, camera);
			gl.setRenderTarget(null);
		});
	}
}

@Component({
	standalone: true,
	template: `
		<fbo-target-wrapper *fbo="options(); let target" [target]="target()" />
	`,
	imports: [NgtsFBO, TargetWrapper],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class DefaultFBOStory {
	width = input(512);
	height = input(512);
	samples = input(8);
	stencilBuffer = input(false);

	options = computed(() => ({
		width: this.width(),
		height: this.height(),
		samples: this.samples(),
		stencilBuffer: this.stencilBuffer(),
	}));
}

export default {
	title: 'Misc/FBO',
	decorators: makeDecorators(),
};

export const Default = makeStoryFunction(DefaultFBOStory);
export const WithSettings = makeStoryObject(DefaultFBOStory, {
	argsOptions: {
		width: number(512, { range: true, min: 1, max: 2048, step: 32 }),
		height: number(512, { range: true, min: 1, max: 2048, step: 32 }),
		samples: number(8, { range: true, min: 1, max: 64, step: 1 }),
		stencilBuffer: false,
	},
});
