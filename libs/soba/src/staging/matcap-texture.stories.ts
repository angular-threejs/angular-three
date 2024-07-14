import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component, Signal, input } from '@angular/core';
import { Meta } from '@storybook/angular';
import { NgtArgs } from 'angular-three';
import { injectGLTF } from 'angular-three-soba/loaders';
import { NgtsMatcapTexture, NgtsMatcapTextureOptions } from 'angular-three-soba/staging';
import { Mesh } from 'three';
import { GLTF } from 'three-stdlib';
import { makeDecorators, makeStoryObject, number } from '../setup-canvas';

interface SuzyGLTF extends GLTF {
	nodes: { Suzanne: Mesh };
	materials: {};
}

@Component({
	standalone: true,
	template: `
		<ngt-color attach="background" *args="['#291203']" />

		@if (gltf(); as gltf) {
			<ngt-mesh [geometry]="gltf.nodes.Suzanne.geometry">
				<ngt-mesh-matcap-material *matcapTexture="options(); let texture" [matcap]="texture()" />
			</ngt-mesh>
		}
	`,
	imports: [NgtsMatcapTexture, NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class DefaultMatcapTextureStory {
	options = input<NgtsMatcapTextureOptions>();
	gltf = injectGLTF(() => './suzanne.glb', { useDraco: true }) as Signal<SuzyGLTF | null>;
}

export default {
	title: 'Staging/Matcap Texture',
	decorators: makeDecorators(),
} as Meta;

export const Default = makeStoryObject(DefaultMatcapTextureStory, {
	canvasOptions: { camera: { position: [0, 0, 3] } },
	argsOptions: {
		options: {
			id: number(121, { min: 0, max: 640, step: 1 }),
			format: 1024,
		},
	},
});
