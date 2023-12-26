import { CUSTOM_ELEMENTS_SCHEMA, Component } from '@angular/core';
import { NgtArgs } from 'angular-three-old';
import { NgtsSampler } from 'angular-three-soba-old/misc';
import { makeDecorators, makeStoryFunction } from '../setup-canvas';

@Component({
	standalone: true,
	template: `
		<ngts-sampler [count]="500">
			<ngt-mesh>
				<ngt-torus-knot-geometry />
				<ngt-mesh-normal-material />
			</ngt-mesh>
			<ngt-instanced-mesh *args="[undefined, undefined, 1_000]">
				<ngt-sphere-geometry *args="[0.1, 32, 32]" />
				<ngt-mesh-normal-material />
			</ngt-instanced-mesh>
		</ngts-sampler>
	`,
	imports: [NgtsSampler, NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class DefaultSamplerStory {}

export default {
	title: 'Misc/Sampler',
	decorators: makeDecorators(),
};

export const Default = makeStoryFunction(DefaultSamplerStory, {
	camera: { position: [0, 0, 5] },
});
