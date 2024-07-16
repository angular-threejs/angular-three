import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, input } from '@angular/core';
import { Meta } from '@storybook/angular';
import { NgtArgs } from 'angular-three';
import { NgtsMeshDistortMaterial, NgtsMeshDistortMaterialOptions } from 'angular-three-soba/materials';
import { color, makeDecorators, makeStoryObject, number } from '../setup-canvas';

@Component({
	standalone: true,
	template: `
		<ngt-mesh>
			<ngt-icosahedron-geometry *args="[1, 4]" />
			<ngts-mesh-distort-material [options]="options()" />
		</ngt-mesh>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs, NgtsMeshDistortMaterial],
})
class DefaultMeshDistortMaterialStory {
	options = input({} as NgtsMeshDistortMaterialOptions);
}

export default {
	title: 'Materials/MeshDistortMaterial',
	decorators: makeDecorators(),
} as Meta;

export const Default = makeStoryObject(DefaultMeshDistortMaterialStory, {
	argsOptions: {
		options: {
			speed: number(1, { range: true, min: 0, max: 10, step: 0.1 }),
			color: color('#f25042'),
			distort: number(0.6, { range: true, min: 0, max: 1, step: 0.01 }),
			radius: number(1, { range: true, min: 0, max: 1, step: 0.01 }),
		},
	},
});
