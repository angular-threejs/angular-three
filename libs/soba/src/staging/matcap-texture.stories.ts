import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Meta } from '@storybook/angular';
import { NgtArgs } from 'angular-three';
import { gltfResource } from 'angular-three-soba/loaders';
import { NgtsMatcapTexture, NgtsMatcapTextureOptions } from 'angular-three-soba/staging';
import { Mesh, SRGBColorSpace, Texture } from 'three';
import { GLTF } from 'three-stdlib';
import { number, storyDecorators, storyObject } from '../setup-canvas';

interface SuzyGLTF extends GLTF {
	nodes: { Suzanne: Mesh };
	materials: {};
}

@Component({
	template: `
		<ngt-color attach="background" *args="['#291203']" />

		@if (gltf.value(); as gltf) {
			<ngt-mesh [geometry]="gltf.nodes.Suzanne.geometry">
				<ngt-mesh-matcap-material
					*matcapTexture="options(); loaded: onLoaded; let texture"
					[matcap]="texture.value()"
				/>
			</ngt-mesh>
		}
	`,
	imports: [NgtsMatcapTexture, NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class DefaultMatcapTextureStory {
	options = input<NgtsMatcapTextureOptions>();

	protected gltf = gltfResource<SuzyGLTF>(() => './suzanne.glb', { useDraco: true });
	protected onLoaded = (texture: Texture) => (texture.colorSpace = SRGBColorSpace);
}

export default {
	title: 'Staging/Matcap Texture',
	decorators: storyDecorators(),
} as Meta;

export const Default = storyObject(DefaultMatcapTextureStory, {
	camera: { position: [0, 0, 3] },
	argsOptions: {
		options: {
			id: number(121, { min: 0, max: 640, step: 1 }),
			format: 1024,
		},
	},
});
