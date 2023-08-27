import { CUSTOM_ELEMENTS_SCHEMA, Component, Input, computed, effect } from '@angular/core';
import { NgtArgs, injectNgtRef, injectNgtStore, signalStore } from 'angular-three';
import { BlendFunction, LUT3DEffect } from 'postprocessing';

export type NgtpLUTState = {
	lut: THREE.Texture;
	blendFunction?: BlendFunction;
	tetrahedralInterpolation?: boolean;
};

declare global {
	interface HTMLElementTagNameMap {
		'ngtp-lut': NgtpLUTState;
	}
}

@Component({
	selector: 'ngtp-lut',
	standalone: true,
	template: `
		<ngt-primitive *args="[effect()]" [ref]="effectRef" />
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtpLUT {
	private inputs = signalStore<NgtpLUTState>({});

	@Input() effectRef = injectNgtRef<LUT3DEffect>();

	@Input({ required: true, alias: 'lut' }) set _lut(lut: THREE.Texture) {
		this.inputs.set({ lut });
	}

	@Input({ alias: 'blendFunction' }) set _blendFunction(blendFunction: BlendFunction) {
		this.inputs.set({ blendFunction });
	}

	@Input({ alias: 'tetrahedralInterpolation' }) set _tetrahedralInterpolation(tetrahedralInterpolation: boolean) {
		this.inputs.set({ tetrahedralInterpolation });
	}

	private lut = this.inputs.select('lut');
	private tetrahedralInterpolation = this.inputs.select('tetrahedralInterpolation');
	private blendFunction = this.inputs.select('blendFunction');

	private store = injectNgtStore();
	private invalidate = this.store.select('invalidate');

	effect = computed(
		() =>
			new LUT3DEffect(this.lut(), {
				blendFunction: this.blendFunction(),
				tetrahedralInterpolation: this.tetrahedralInterpolation(),
			}),
	);

	constructor() {
		this.setState();
	}

	private setState() {
		effect(() => {
			const [effect, invalidate, lut, tetrahedralInterpolation] = [
				this.effect(),
				this.invalidate(),
				this.lut(),
				this.tetrahedralInterpolation(),
			];
			if (!effect) return;
			if (tetrahedralInterpolation) effect.tetrahedralInterpolation = tetrahedralInterpolation;
			if (lut) effect.lut = lut;
			invalidate();
		});
	}
}
