import { ChangeDetectionStrategy, Component, computed, CUSTOM_ELEMENTS_SCHEMA, effect, input } from '@angular/core';
import { NgtArgs, omit, pick } from 'angular-three';
import { EffectAttribute, ToneMappingEffect } from 'postprocessing';

export type NgtpToneMappingOptions = Partial<NonNullable<ConstructorParameters<typeof ToneMappingEffect>[0]>>;

@Component({
	selector: 'ngtp-tone-mapping',
	standalone: true,
	template: `
		<ngt-primitive *args="[effect()]" [parameters]="parameters()" />
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs],
})
export class NgtpToneMapping {
	options = input({} as NgtpToneMappingOptions);
	protected parameters = omit(this.options, [
		'blendFunction',
		'adaptive',
		'mode',
		'resolution',
		'maxLuminance',
		'whitePoint',
		'middleGrey',
		'minLuminance',
		'averageLuminance',
		'adaptationRate',
	]);

	private blendFunction = pick(this.options, 'blendFunction');
	private adaptive = pick(this.options, 'adaptive');
	private mode = pick(this.options, 'mode');
	private resolution = pick(this.options, 'resolution');
	private maxLuminance = pick(this.options, 'maxLuminance');
	private whitePoint = pick(this.options, 'whitePoint');
	private middleGrey = pick(this.options, 'middleGrey');
	private minLuminance = pick(this.options, 'minLuminance');
	private averageLuminance = pick(this.options, 'averageLuminance');
	private adaptationRate = pick(this.options, 'adaptationRate');

	effect = computed(() => {
		const [
			blendFunction,
			adaptive,
			mode,
			resolution,
			maxLuminance,
			whitePoint,
			middleGrey,
			minLuminance,
			averageLuminance,
			adaptationRate,
		] = [
			this.blendFunction(),
			this.adaptive(),
			this.mode(),
			this.resolution(),
			this.maxLuminance(),
			this.whitePoint(),
			this.middleGrey(),
			this.minLuminance(),
			this.averageLuminance(),
			this.adaptationRate(),
		];

		const effect = new ToneMappingEffect({
			blendFunction,
			adaptive,
			mode,
			resolution,
			maxLuminance,
			whitePoint,
			middleGrey,
			minLuminance,
			averageLuminance,
			adaptationRate,
		});

		effect['setAttributes'](EffectAttribute.CONVOLUTION);

		return effect;
	});

	constructor() {
		effect((onCleanup) => {
			const toneMappingEffect = this.effect();
			onCleanup(() => toneMappingEffect.dispose());
		});
	}
}
