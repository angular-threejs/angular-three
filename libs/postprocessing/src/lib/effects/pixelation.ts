import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component, computed, effect, input } from '@angular/core';
import { NgtArgs, pick } from 'angular-three';
import { mergeInputs } from 'ngxtension/inject-inputs';
import { PixelationEffect } from 'postprocessing';

export interface PixelationOptions {
	granularity: number;
}
@Component({
    selector: 'ngtp-pixelation',
    template: `
		<ngt-primitive *args="[effect()]" />
	`,
    changeDetection: ChangeDetectionStrategy.OnPush,
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    imports: [NgtArgs]
})
export class NgtpPixelation {
	options = input({ granularity: 5 } as PixelationOptions, { transform: mergeInputs({ granularity: 5 }) });
	private granularity = pick(this.options, 'granularity');

	effect = computed(() => new PixelationEffect(this.granularity()));

	constructor() {
		effect((onCleanup) => {
			const effect = this.effect();
			onCleanup(() => effect.dispose());
		});
	}
}
