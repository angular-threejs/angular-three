import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component, Signal, computed, input } from '@angular/core';
import { Meta } from '@storybook/angular';
import { injectGLTF } from 'angular-three-soba/loaders';
import { NgtsNormalTexture, NgtsNormalTextureOptions } from 'angular-three-soba/staging';
import { Mesh, Vector2 } from 'three';
import { GLTF } from 'three-stdlib';
import { makeDecorators, makeStoryObject } from '../setup-canvas';

interface SuzyGLTF extends GLTF {
	nodes: { Suzanne: Mesh };
	materials: {};
}

@Component({
	standalone: true,
	template: `
		@if (gltf(); as gltf) {
			<ngt-mesh [geometry]="gltf.nodes.Suzanne.geometry">
				<ngt-mesh-standard-material
					*normalTexture="options(); let texture"
					color="darkmagenta"
					[normalMap]="texture()"
					[normalScale]="normalScale()"
					[roughness]="0.9"
					[metalness]="0.1"
				/>
			</ngt-mesh>
		}
	`,
	imports: [NgtsNormalTexture],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class DefaultNormalTextureStory {
	options = input<NgtsNormalTextureOptions>();
	gltf = injectGLTF(() => './suzanne.glb', { useDraco: true }) as Signal<SuzyGLTF | null>;

	normalScale = computed(() => {
		const repeat = this.options()?.repeat;
		if (!repeat) return undefined;
		return new Vector2().fromArray(repeat);
	});
}

export default {
	title: 'Staging/Normal Texture',
	decorators: makeDecorators(),
} as Meta;

export const Default = makeStoryObject(DefaultNormalTextureStory, {
	canvasOptions: { camera: { position: [0, 0, 3] } },
	argsOptions: {
		options: {
			id: 3,
			repeat: [4, 4],
			anisotropy: 8,
		},
	},
});
