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
import { NgtArgs, omit, pick, resolveRef } from 'angular-three';
import { GodRaysEffect } from 'postprocessing';
import * as THREE from 'three';
import { NgtpEffectComposer } from '../effect-composer';

type GodRaysOptions = ConstructorParameters<typeof GodRaysEffect>[2] & {
	sun:
		| THREE.Mesh
		| THREE.Points
		| ElementRef<THREE.Mesh | THREE.Points>
		| (() => THREE.Mesh | THREE.Points | ElementRef<THREE.Mesh | THREE.Points> | undefined);
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

	private effectOptions = omit(this.options, ['sun']);
	private sun = pick(this.options, 'sun');

	private sunElement = computed(() => {
		const sun = this.sun();
		if (typeof sun === 'function') return resolveRef(sun());
		return resolveRef(sun);
	});

	protected effect = computed(() => {
		const [camera, sunElement, options] = [this.effectComposer.camera(), this.sunElement(), this.effectOptions()];
		return new GodRaysEffect(camera, sunElement, options);
	});

	constructor() {
		effect(() => {
			const sunElement = this.sunElement();
			if (!sunElement) return;

			const godRaysEffect = this.effect();
			godRaysEffect.lightSource = sunElement;
		});

		effect((onCleanup) => {
			const effect = this.effect();
			onCleanup(() => effect.dispose());
		});
	}
}
