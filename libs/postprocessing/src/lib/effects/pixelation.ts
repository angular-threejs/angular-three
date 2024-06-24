import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NgtArgs, injectNgtRef, pick } from 'angular-three';
import { mergeInputs } from 'ngxtension/inject-inputs';
import { PixelationEffect } from 'postprocessing';

export interface PixelationOptions {
	granularity: number;
}
@Component({
	selector: 'ngtp-pixelation',
	template: `
		<ngt-primitive *args="[effect()]" [ref]="effectRef()" ngtCompound />
	`,
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	imports: [NgtArgs],
})
export class NgtpPixelation {
	effectRef = input(injectNgtRef<PixelationEffect>());
	options = input({ granularity: 5 } as PixelationOptions, { transform: mergeInputs({ granularity: 5 }) });
	granularity = pick(this.options, 'granularity');

	effect = computed(() => new PixelationEffect(this.granularity()));
}
