import { CUSTOM_ELEMENTS_SCHEMA, Component, Input, computed } from '@angular/core';
import { NgtArgs, injectNgtRef, signalStore } from 'angular-three-old';
import { PixelationEffect } from 'postprocessing';
import type { NgtpEffectState } from '../../effect';

export type NgtpPixelationState = {
	granularity: number;
};

declare global {
	interface HTMLElementTagNameMap {
		'ngtp-pixelation': NgtpPixelationState & NgtpEffectState;
	}
}

@Component({
	selector: 'ngtp-pixelation',
	standalone: true,
	template: `
		<ngt-primitive *args="[effect()]" [ref]="effectRef" />
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtpPixelation {
	private inputs = signalStore<NgtpPixelationState>({ granularity: 30 });

	@Input() effectRef = injectNgtRef<PixelationEffect>();

	@Input({ alias: 'granularity' }) set _granularity(granularity: number) {
		this.inputs.set({ granularity });
	}

	private granularity = this.inputs.select('granularity');

	effect = computed(() => new PixelationEffect(this.granularity()));
}
