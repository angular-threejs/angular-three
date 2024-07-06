import {
	CUSTOM_ELEMENTS_SCHEMA,
	ChangeDetectionStrategy,
	Component,
	afterNextRender,
	computed,
	input,
} from '@angular/core';
import { NgtArgs, NgtVector3, injectNgtRef } from 'angular-three';
import { injectAutoEffect } from 'ngxtension/auto-effect';
import { DepthOfFieldEffect, MaskFunction } from 'postprocessing';
import { DepthPackingStrategies, Texture, Vector3 } from 'three';
import { injectEffectComposerApi } from '../effect-composer';

type DOFOptions = NonNullable<ConstructorParameters<typeof DepthOfFieldEffect>[1]> &
	Partial<{
		target: NgtVector3;
		depthTexture: {
			texture: Texture;
			// TODO: narrow to DepthPackingStrategies
			packing: number;
		};
	}>;

@Component({
	selector: 'ngtp-depth-of-field',
	standalone: true,
	template: `
		<ngt-primitive *args="[effect()]" [ref]="effectRef()" />
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtpDepthOfField {
	autoEffect = injectAutoEffect();
	composerApi = injectEffectComposerApi();

	effectRef = input(injectNgtRef<DepthOfFieldEffect>());
	options = input({} as DOFOptions);

	autoFocus = computed(() => this.options().target != null);

	effect = computed(() => {
		const [{ camera }, options, autoFocus] = [this.composerApi(), this.options(), this.autoFocus()];

		const effect = new DepthOfFieldEffect(camera, options);

		// Creating a target enables autofocus, R3F will set via props
		if (autoFocus) effect.target = new Vector3();
		// Depth texture for depth picking with optional packing strategy
		if (options.depthTexture) {
			effect.setDepthTexture(options.depthTexture.texture, options.depthTexture.packing as DepthPackingStrategies);
		}
		// Temporary fix that restores DOF 6.21.3 behavior, everything since then lets shapes leak through the blur
		const maskPass = (effect as any).maskPass;
		maskPass.maskFunction = MaskFunction.MULTIPLY_RGB_SET_ALPHA;

		return effect;
	});

	constructor() {
		afterNextRender(() => {
			this.autoEffect(() => {
				const effect = this.effect();
				return () => {
					effect.dispose();
				};
			});
		});
	}
}
