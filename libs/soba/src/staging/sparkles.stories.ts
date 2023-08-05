import { CUSTOM_ELEMENTS_SCHEMA, Component, Input, computed, signal } from '@angular/core';
import { NgtsPerspectiveCamera } from 'angular-three-soba/cameras';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import { NgtsSparkles } from 'angular-three-soba/staging';
import { makeDecorators, makeStoryObject, number } from '../setup-canvas';

@Component({
	standalone: true,
	template: `
		<ngts-sparkles
			color="orange"
			[size]="sizes()"
			[count]="_amount()"
			[opacity]="opacity"
			[speed]="speed"
			[noise]="noise"
		/>
		<ngts-orbit-controls />
		<ngt-axes-helper />
		<ngts-perspective-camera [position]="[2, 2, 2]" [makeDefault]="true" />
	`,
	imports: [NgtsSparkles, NgtsOrbitControls, NgtsPerspectiveCamera],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class DefaultSparklesStory {
	@Input() opacity = 1;
	@Input() speed = 0.3;
	@Input() noise = 1;

	private _random = signal(true);
	@Input() set random(random: boolean) {
		this._random.set(random);
	}

	private _size = signal(5);
	@Input() set size(size: number) {
		this._size.set(size);
	}

	_amount = signal(100);
	@Input() set amount(amount: number) {
		this._amount.set(amount);
	}

	sizes = computed(() => {
		if (this._random())
			return new Float32Array(Array.from({ length: this._amount() }, () => Math.random() * this._size()));
		return this._size();
	});
}

export default {
	title: 'Staging/Sparkles',
	decorators: makeDecorators(),
};
export const Default = makeStoryObject(DefaultSparklesStory, {
	canvasOptions: { camera: { position: [1, 1, 1] }, controls: false },
	argsOptions: {
		random: true,
		amount: number(100, { range: true, max: 500, step: 1 }),
		size: number(5, { range: true, min: 0, max: 10, step: 1 }),
		noise: number(1, { range: true, min: 0, max: 1, step: 0.01 }),
		speed: number(0.3, { range: true, min: 0, max: 20, step: 0.1 }),
		opacity: number(1, { range: true, min: 0, max: 1, step: 0.01 }),
	},
});
