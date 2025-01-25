import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component, computed, effect, input } from '@angular/core';
import { NgtArgs, injectStore, pick } from 'angular-three';
import { BlendFunction, LUT3DEffect } from 'postprocessing';
import * as THREE from 'three';

export interface LUTOptions {
	lut: THREE.Texture;
	blendFunction?: BlendFunction;
	tetrahedralInterpolation?: boolean;
}

@Component({
	selector: 'ngtp-lut',
	template: `
		<ngt-primitive *args="[effect()]" [dispose]="null" />
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtpLUT {
	options = input({} as LUTOptions);

	private lut = pick(this.options, 'lut');
	private tetrahedralInterpolation = pick(this.options, 'tetrahedralInterpolation');

	private store = injectStore();

	protected effect = computed(() => {
		const { lut, ...options } = this.options();
		return new LUT3DEffect(lut, options);
	});

	constructor() {
		effect(() => {
			const [effect, lut, tetrahedralInterpolation, invalidate] = [
				this.effect(),
				this.lut(),
				this.tetrahedralInterpolation(),
				this.store.invalidate(),
			];

			if (tetrahedralInterpolation) effect.tetrahedralInterpolation = tetrahedralInterpolation;
			if (lut) effect.lut = lut;
			invalidate();
		});

		effect((onCleanup) => {
			const effect = this.effect();
			onCleanup(() => effect.dispose());
		});
	}
}
