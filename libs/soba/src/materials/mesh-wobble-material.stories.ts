import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, input } from '@angular/core';
import { Meta } from '@storybook/angular';
import { NgtArgs } from 'angular-three';
import { NgtsMeshWobbleMaterial, NgtsMeshWobbleMaterialOptions } from 'angular-three-soba/materials';
import { color, makeDecorators, makeStoryObject, number } from '../setup-canvas';

@Component({
	standalone: true,
	template: `
		<ngt-mesh>
			<ngt-torus-geometry *args="[1, 0.25, 16, 100]" />
			<ngts-mesh-wobble-material [options]="options()" />
		</ngt-mesh>
	`,
	imports: [NgtsMeshWobbleMaterial, NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class DefaultMeshWobbleMaterialStory {
	options = input({} as NgtsMeshWobbleMaterialOptions);
}

export default {
	title: 'Materials/MeshWobbleMaterial',
	decorators: makeDecorators(),
} as Meta;

export const Default = makeStoryObject(DefaultMeshWobbleMaterialStory, {
	argsOptions: {
		options: {
			color: color('#f25042'),
			speed: number(1, { range: true, min: 0, max: 10, step: 0.1 }),
			factor: number(0.6, { range: true, min: 0, max: 1, step: 0.1 }),
		},
	},
});
