import { CUSTOM_ELEMENTS_SCHEMA, Component, Input } from '@angular/core';
import { signalStore } from 'angular-three-old';
import { injectNgtsTrailTexture } from 'angular-three-soba-old/misc';
import { makeDecorators, makeStoryObject, number } from '../setup-canvas';

@Component({
	standalone: true,
	template: `
		<ngt-mesh [scale]="7" (pointermove)="trailTexture.onMove($event)">
			<ngt-plane-geometry />
			<ngt-mesh-basic-material [map]="trailTexture.texture()" />
		</ngt-mesh>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class DefaultTrailTextureStory {
	private inputs = signalStore({ size: 256, radius: 0.3, maxAge: 750 });

	trailTexture = injectNgtsTrailTexture(this.inputs.state);

	@Input() set size(size: number) {
		this.inputs.set({ size });
	}

	@Input() set radius(radius: number) {
		this.inputs.set({ radius });
	}

	@Input() set maxAge(maxAge: number) {
		this.inputs.set({ maxAge });
	}
}

export default {
	title: 'Misc/injectNgtsTrailTexture',
	decorators: makeDecorators(),
};

export const Default = makeStoryObject(DefaultTrailTextureStory, {
	argsOptions: {
		size: number(256, { min: 64, step: 8 }),
		radius: number(0.3, { range: true, min: 0.1, max: 1, step: 0.1 }),
		maxAge: number(750, { range: true, min: 300, max: 1000, step: 100 }),
	},
});
