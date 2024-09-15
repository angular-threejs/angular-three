import {
	CUSTOM_ELEMENTS_SCHEMA,
	ChangeDetectionStrategy,
	Component,
	computed,
	effect,
	inject,
	input,
} from '@angular/core';
import { NgtAnyRecord, NgtArgs, NgtVector3 } from 'angular-three';
import { DepthOfFieldEffect, MaskFunction } from 'postprocessing';
import { DepthPackingStrategies, Texture, Vector3 } from 'three';
import { NgtpEffectComposer } from '../effect-composer';

type DOFOptions = NonNullable<ConstructorParameters<typeof DepthOfFieldEffect>[1]> &
	Partial<{ target: NgtVector3; depthTexture: { texture: Texture; packing: DepthPackingStrategies } }>;

@Component({
	selector: 'ngtp-depth-of-field',
	standalone: true,
	template: `
		<ngt-primitive *args="[effect()]" />
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtpDepthOfField {
	options = input({} as DOFOptions);

	private autoFocus = computed(() => this.options().target != null);

	private effectComposer = inject(NgtpEffectComposer);

	effect = computed(() => {
		const [camera, options, autoFocus] = [this.effectComposer.camera(), this.options(), this.autoFocus()];

		const effect = new DepthOfFieldEffect(camera, options);

		// Creating a target enables autofocus, R3F will set via props
		if (autoFocus) effect.target = new Vector3();
		// Depth texture for depth picking with optional packing strategy
		if (options.depthTexture) {
			effect.setDepthTexture(options.depthTexture.texture, options.depthTexture.packing as DepthPackingStrategies);
		}
		// Temporary fix that restores DOF 6.21.3 behavior, everything since then lets shapes leak through the blur
		const maskPass = (effect as NgtAnyRecord)['maskPass'];
		maskPass.maskFunction = MaskFunction.MULTIPLY_RGB_SET_ALPHA;

		return effect;
	});

	constructor() {
		effect((onCleanup) => {
			const depthOfFieldEffect = this.effect();
			onCleanup(() => depthOfFieldEffect.dispose());
		});
	}
}
