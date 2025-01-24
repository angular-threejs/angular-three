import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Meta } from '@storybook/angular';
import { injectGLTF } from 'angular-three-soba/loaders';
import { NgtsNormalTexture, NgtsNormalTextureOptions } from 'angular-three-soba/staging';
import { Mesh, SRGBColorSpace, Texture, Vector2 } from 'three';
import { GLTF } from 'three-stdlib';
import { storyDecorators, storyObject } from '../setup-canvas';

interface SuzyGLTF extends GLTF {
	nodes: { Suzanne: Mesh };
	materials: {};
}

@Component({
	template: `
		@if (gltf(); as gltf) {
			<ngt-mesh [geometry]="gltf.nodes.Suzanne.geometry">
				<ng-template [normalTexture]="options()" (normalTextureLoaded)="onLoaded($event[0])" let-texture>
					<ngt-mesh-standard-material
						color="darkmagenta"
						[normalMap]="texture()"
						[normalScale]="normalScale()"
						[roughness]="0.9"
						[metalness]="0.1"
					/>
				</ng-template>
			</ngt-mesh>
		}
	`,
	imports: [NgtsNormalTexture],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class DefaultNormalTextureStory {
	options = input<NgtsNormalTextureOptions>();
	gltf = injectGLTF<SuzyGLTF>(() => './suzanne.glb', { useDraco: true });

	normalScale = computed(() => {
		const repeat = this.options()?.repeat;
		if (!repeat) return undefined;
		return new Vector2().fromArray(repeat);
	});

	onLoaded(texture: Texture) {
		texture.colorSpace = SRGBColorSpace;
	}
}

export default {
	title: 'Staging/Normal Texture',
	decorators: storyDecorators(),
} as Meta;

export const Default = storyObject(DefaultNormalTextureStory, {
	camera: { position: [0, 0, 3] },
	argsOptions: {
		options: {
			id: 3,
			repeat: [4, 4],
			anisotropy: 8,
		},
	},
});
