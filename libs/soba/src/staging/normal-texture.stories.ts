import { NgIf } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, Component, Input, signal, type Signal } from '@angular/core';
import { injectNgtsGLTFLoader, type NgtsGLTF } from 'angular-three-soba/loaders';
import { injectNgtsNormalTexture } from 'angular-three-soba/staging';
import * as THREE from 'three';
import { makeDecorators, makeStoryObject, number } from '../setup-canvas';

const textureIndex = signal(3);

type SuzanneGLTF = NgtsGLTF<{ nodes: { Suzanne: THREE.Mesh } }>;

@Component({
	standalone: true,
	template: `
		<ngt-mesh *ngIf="suzanneGltf() as suzanneGltf" [geometry]="suzanneGltf.nodes.Suzanne.geometry">
			<ngt-mesh-standard-material
				color="darkmagenta"
				[roughness]="0.9"
				[metalness]="0.1"
				[normalScale]="normalScale()"
				[normalMap]="normal.texture()"
			/>
		</ngt-mesh>
	`,
	imports: [NgIf],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class DefaultNormalTextureStory {
	suzanneGltf = injectNgtsGLTFLoader(() => 'soba/suzanne.glb', { useDraco: true }) as Signal<SuzanneGLTF>;

	private _repeat = signal(8);
	@Input() set repeat(repeat: number) {
		this._repeat.set(repeat);
	}

	private _scale = signal(4);
	@Input() set scale(scale: number) {
		this._scale.set(scale);
	}

	@Input() set textureIndex(index: number) {
		textureIndex.set(index);
	}

	normal = injectNgtsNormalTexture(() => ({
		id: textureIndex(),
		repeat: [this._repeat(), this._repeat()],
		anisotropy: 8,
	}));
	normalScale = () => new THREE.Vector2(this._scale(), this._scale());
}

export default {
	title: 'Staging/injectNgtsNormalTexture',
	decorators: makeDecorators(),
};

export const Default = makeStoryObject(DefaultNormalTextureStory, {
	canvasOptions: { camera: { position: [0, 0, 3] }, useLegacyLights: true },
	argsOptions: {
		textureIndex: number(textureIndex()),
		repeat: number(8),
		scale: number(4),
	},
});
