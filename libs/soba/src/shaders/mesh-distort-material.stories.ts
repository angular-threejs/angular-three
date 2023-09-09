///<reference path="../types.d.ts"/>

import { Component, CUSTOM_ELEMENTS_SCHEMA, Input } from '@angular/core';
import { injectBeforeRender, injectNgtRef, NgtArgs } from 'angular-three';
import distortShader from 'angular-three-soba/assets/distort.vert.glsl';
import { NgtsMeshDistortMaterial } from 'angular-three-soba/materials';
import { provideNgtsMeshDistortMaterialShader, type MeshDistortMaterial } from 'angular-three-soba/shaders';
import { makeCanvasOptions, makeDecorators, makeStoryFunction, makeStoryObject, number } from '../setup-canvas';

@Component({
	standalone: true,
	template: `
		<ngt-mesh>
			<ngts-mesh-distort-material color="#f25042" [materialRef]="ref" />
			<ngt-icosahedron-geometry *args="[1, 4]" />
		</ngt-mesh>
	`,
	imports: [NgtsMeshDistortMaterial, NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class RefMeshDistortMaterialStory {
	ref = injectNgtRef<InstanceType<MeshDistortMaterial>>();

	constructor() {
		injectBeforeRender(({ clock }) => {
			if (this.ref.nativeElement) {
				this.ref.nativeElement.distort = Math.sin(clock.getElapsedTime());
			}
		});
	}
}

@Component({
	standalone: true,
	template: `
		<ngt-mesh>
			<ngts-mesh-distort-material color="#f25042" [speed]="speed" [distort]="distort" [radius]="radius" />
			<ngt-icosahedron-geometry *args="[1, 4]" />
		</ngt-mesh>
	`,
	imports: [NgtsMeshDistortMaterial, NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class DefaultMeshDistortMaterialStory {
	@Input() speed = 1;
	@Input() distort = 0.6;
	@Input() radius = 1;
}

export default {
	title: 'Shaders/MeshDistortMaterial',
	decorators: makeDecorators([provideNgtsMeshDistortMaterialShader(distortShader)]),
};

const canvasOptions = makeCanvasOptions({ useLegacyLights: true });

export const Default = makeStoryObject(DefaultMeshDistortMaterialStory, {
	canvasOptions,
	argsOptions: {
		speed: number(1, { range: true, max: 10, step: 0.1 }),
		distort: number(0.6, { range: true, max: 1, step: 0.1 }),
		radius: number(1, { range: true, max: 1, step: 0.1 }),
	},
});

export const Ref = makeStoryFunction(RefMeshDistortMaterialStory, canvasOptions);
