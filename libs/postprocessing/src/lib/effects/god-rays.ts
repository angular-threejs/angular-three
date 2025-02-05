import {
	CUSTOM_ELEMENTS_SCHEMA,
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	computed,
	effect,
	inject,
	input,
} from '@angular/core';
import { NgtArgs, is } from 'angular-three';
import { GodRaysEffect } from 'postprocessing';
import { Mesh, Points } from 'three';
import { NgtpEffectComposer } from '../effect-composer';

type GodRaysOptions = ConstructorParameters<typeof GodRaysEffect>[2] & {
	sun: Mesh | Points | ElementRef<Mesh | Points>;
};

@Component({
	selector: 'ngtp-god-rays',
	template: `
		<ngt-primitive *args="[effect()]" />
	`,
	imports: [NgtArgs],
	changeDetection: ChangeDetectionStrategy.OnPush,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtpGodRays {
	options = input({} as GodRaysOptions);

	private effectComposer = inject(NgtpEffectComposer);

	effect = computed(() => {
		const [camera, { sun, ...options }] = [this.effectComposer.camera(), this.options()];
		return new GodRaysEffect(camera, is.ref(sun) ? sun.nativeElement : sun, options);
	});

	constructor() {
		effect(() => {
			const [sun, godRaysEffect] = [this.options().sun, this.effect()];
			godRaysEffect.lightSource = is.ref(sun) ? sun.nativeElement : sun;
		});

		effect((onCleanup) => {
			const effect = this.effect();
			onCleanup(() => effect.dispose());
		});
	}
}
