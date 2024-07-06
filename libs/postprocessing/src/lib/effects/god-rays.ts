import {
	CUSTOM_ELEMENTS_SCHEMA,
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	afterNextRender,
	computed,
	input,
} from '@angular/core';
import { NgtArgs, injectNgtRef, is } from 'angular-three';
import { injectAutoEffect } from 'ngxtension/auto-effect';
import { GodRaysEffect } from 'postprocessing';
import { Mesh, Points } from 'three';
import { injectEffectComposerApi } from '../effect-composer';

type GodRaysOptions = ConstructorParameters<typeof GodRaysEffect>[2] & {
	sun: Mesh | Points | ElementRef<Mesh | Points>;
};

@Component({
	selector: 'ngtp-god-rays',
	standalone: true,
	template: `
		<ngt-primitive *args="[effect()]" [ref]="effectRef()" />
	`,
	imports: [NgtArgs],
	changeDetection: ChangeDetectionStrategy.OnPush,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtpGodRays {
	autoEffect = injectAutoEffect();
	composerApi = injectEffectComposerApi();

	effectRef = input(injectNgtRef<GodRaysEffect>());
	options = input({} as GodRaysOptions);

	effect = computed(() => {
		const [{ camera }, { sun, ...options }] = [this.composerApi(), this.options()];
		return new GodRaysEffect(camera, is.ref(sun) ? sun.nativeElement : sun, options);
	});

	constructor() {
		afterNextRender(() => {
			this.autoEffect(() => {
				const [sun, effect] = [this.options().sun, this.effect()];
				effect.lightSource = is.ref(sun) ? sun.nativeElement : sun;
			});
		});
	}
}
