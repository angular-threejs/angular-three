import { CUSTOM_ELEMENTS_SCHEMA, Component } from '@angular/core';
import { NgtsStatsGL } from 'angular-three-soba/misc';
import { makeDecorators, makeStoryFunction } from '../setup-canvas';

@Component({
	standalone: true,
	template: `
		<ngt-axes-helper />
		<ngts-stats-gl />
	`,
	imports: [NgtsStatsGL],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class DefaultStatsGLStory {}

export default {
	title: 'Misc/StatsGL',
	decorators: makeDecorators(),
};

export const Default = makeStoryFunction(DefaultStatsGLStory);
