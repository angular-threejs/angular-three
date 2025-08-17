import { ChangeDetectionStrategy, Component, computed, CUSTOM_ELEMENTS_SCHEMA, input } from '@angular/core';
import { beforeRender, injectStore, NgtArgs, NgtThreeElements, omit, pick } from 'angular-three';
import { Sparkles, type SparklesProps } from 'angular-three-soba/vanilla-exports';
import { mergeInputs } from 'ngxtension/inject-inputs';

export type NgtsSparklesOptions = Partial<NgtThreeElements['ngt-points']> & SparklesProps;

const defaultSparklesOptions: NgtsSparklesOptions = {
	count: 100,
	speed: 1,
	opacity: 1,
	scale: 1,
	noise: 1,
};

@Component({
	selector: 'ngts-sparkles',
	template: `
		<ngt-primitive *args="[sparkles()]" [parameters]="parameters()">
			<ng-content />
		</ngt-primitive>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	imports: [NgtArgs],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtsSparkles {
	options = input(defaultSparklesOptions, { transform: mergeInputs(defaultSparklesOptions) });
	protected parameters = omit(this.options, ['noise', 'count', 'speed', 'opacity', 'scale', 'size', 'color']);
	private sparklesOptions = pick(this.options, ['noise', 'count', 'speed', 'opacity', 'scale', 'size', 'color']);

	private store = injectStore();

	sparkles = computed(() => {
		const s = new Sparkles(this.sparklesOptions());
		s.setPixelRatio(this.store.snapshot.viewport.dpr);
		return s;
	});

	constructor() {
		beforeRender(({ clock }) => {
			this.sparkles().update(clock.elapsedTime);
		});
	}
}
