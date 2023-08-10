import { Component, CUSTOM_ELEMENTS_SCHEMA, Input } from '@angular/core';
import { Meta } from '@storybook/angular';
import { injectBeforeRender, injectNgtRef, NgtArgs } from 'angular-three';
import { NgtsMeshWobbleMaterial } from 'angular-three-soba/materials';
import { MeshWobbleMaterial } from 'angular-three-soba/shaders';
import { makeDecorators, makeStoryFunction, makeStoryObject, number } from '../setup-canvas';

@Component({
	standalone: true,
	template: `
		<ngt-mesh>
			<ngts-mesh-wobble-material color="#f25042" [materialRef]="ref" />
			<ngt-torus-geometry *args="[1, 0.25, 16, 100]" />
		</ngt-mesh>
	`,
	imports: [NgtsMeshWobbleMaterial, NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class RefMeshWobbleMaterialStory {
	ref = injectNgtRef<MeshWobbleMaterial>();

	constructor() {
		injectBeforeRender(({ clock }) => {
			const material = this.ref.nativeElement;
			if (material) {
				material.factor = Math.abs(Math.sin(clock.getElapsedTime())) * 2;
				material.speed = Math.abs(Math.sin(clock.getElapsedTime())) * 10;
			}
		});
	}
}

@Component({
	standalone: true,
	template: `
		<ngt-mesh>
			<ngts-mesh-wobble-material color="#f25042" [speed]="speed" [factor]="factor" />
			<ngt-torus-geometry *args="[1, 0.25, 16, 100]" />
		</ngt-mesh>
	`,
	imports: [NgtsMeshWobbleMaterial, NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class DefaultMeshWobbleMaterialStory {
	@Input() speed = 1;
	@Input() factor = 0.6;
}

export default {
	title: 'Shaders/MeshWobbleMaterial',
	decorators: makeDecorators(),
} as Meta;

export const Default = makeStoryObject(DefaultMeshWobbleMaterialStory, {
	argsOptions: {
		speed: number(1, { range: true, max: 10, step: 0.1 }),
		factor: number(0.6, { range: true, max: 1, step: 0.1 }),
	},
});

export const Ref = makeStoryFunction(RefMeshWobbleMaterialStory);
