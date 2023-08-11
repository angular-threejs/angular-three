import { CUSTOM_ELEMENTS_SCHEMA, Component, computed } from '@angular/core';
import { NgtArgs } from 'angular-three';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import { injectNgtsGLTFLoader } from 'angular-three-soba/loaders';
import { injectNgtsAnimations } from 'angular-three-soba/misc';
import { NgtsBackdrop, NgtsEnvironment } from 'angular-three-soba/staging';
import { makeCanvasOptions, makeDecorators, makeStoryFunction } from '../setup-canvas';

@Component({
	selector: 'backdrop-robot',
	standalone: true,
	template: `<ngt-primitive ngtCompound *args="[robot()]" [ref]="animations.ref" />`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class Robot {
	private robotGltf = injectNgtsGLTFLoader(() => 'soba/assets/RobotExpressive.glb');
	robot = computed(() => {
		const robotGltf = this.robotGltf();
		if (!robotGltf) return null;

		robotGltf.scene.traverse((child) => {
			if (child.type === 'Mesh') {
				child.receiveShadow = child.castShadow = true;
			}
		});

		return robotGltf.scene;
	});

	animations = injectNgtsAnimations(() => this.robotGltf()?.animations || []);
}

@Component({
	standalone: true,
	template: `
		<ngt-group [position]="[0, -0.25, 0]">
			<backdrop-robot [scale]="0.2" [position]="[0, -0.5, 0]" />
			<ngts-backdrop [receiveShadow]="true" [scale]="[20, 5, 5]" [floor]="1.5" [position]="[0, -0.5, -2]">
				<ngt-mesh-physical-material [roughness]="1" color="#efefef" />
			</ngts-backdrop>
		</ngt-group>
		<ngts-orbit-controls [makeDefault]="true" [dampingFactor]="0.2" />
		<ngts-environment preset="warehouse" [background]="true" />
	`,
	imports: [NgtsBackdrop, Robot, NgtsOrbitControls, NgtsEnvironment, NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class DefaultBackdropStory {}

export default {
	title: 'Staging/Backdrop',
	decorators: makeDecorators(),
};

const canvasOptions = makeCanvasOptions({
	camera: { position: [-1, 2, 4], fov: 35 },
	controls: false,
	compoundPrefixes: ['backdrop-robot'],
	useLegacyLights: true,
});

export const Default = makeStoryFunction(DefaultBackdropStory, canvasOptions);
