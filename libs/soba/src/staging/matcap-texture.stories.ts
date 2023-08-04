import { NgIf } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, Component, Input, Signal, signal } from '@angular/core';
import { NgtsGLTF, injectNgtsGLTFLoader } from 'angular-three-soba/loaders';
import { injectNgtsMatcapTexture } from 'angular-three-soba/staging';
import { makeDecorators, makeStoryObject, number } from '../setup-canvas';

const textureIndex = signal(111);

type SuzanneGLTF = NgtsGLTF<{ nodes: { Suzanne: THREE.Mesh } }>;

@Component({
	standalone: true,
	template: `
		<ngt-mesh *ngIf="suzanneGltf() as suzanneGltf" [geometry]="suzanneGltf.nodes.Suzanne.geometry">
			<ngt-mesh-matcap-material [matcap]="matcap.texture()" />
		</ngt-mesh>
	`,
	imports: [NgIf],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class DefaultMatcapTextureStory {
	suzanneGltf = injectNgtsGLTFLoader(() => 'soba/suzanne.glb', { useDraco: true }) as Signal<SuzanneGLTF>;
	matcap = injectNgtsMatcapTexture(() => ({ id: textureIndex(), format: 1024 }));

	@Input() set textureIndex(index: number) {
		textureIndex.set(index);
	}
}

export default {
	title: 'Staging/injectNgtsMatcapTexture',
	decorators: makeDecorators(),
};

export const Default = makeStoryObject(DefaultMatcapTextureStory, {
	canvasOptions: { camera: { position: [0, 0, 3] } },
	argsOptions: {
		textureIndex: number(textureIndex()),
	},
});
