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

/**
 * Configuration options for the god rays effect.
 * Extends GodRaysEffect options with a required sun/light source.
 */
type GodRaysOptions = ConstructorParameters<typeof GodRaysEffect>[2] & {
	/**
	 * The light source for the god rays.
	 * Can be a Mesh, Points, ElementRef, or a function returning any of these.
	 */
	sun:
		| THREE.Mesh
		| THREE.Points
		| ElementRef<THREE.Mesh | THREE.Points>
		| (() => THREE.Mesh | THREE.Points | ElementRef<THREE.Mesh | THREE.Points> | undefined);
};

/**
 * Angular component that applies a god rays (volumetric lighting) effect to the scene.
 *
 * This effect creates light shafts emanating from a light source, simulating
 * the way light scatters through atmospheric particles. Requires a sun/light
 * source mesh to generate the rays from.
 *
 * @example
 * ```html
 * <ngt-mesh #sun [position]="[0, 5, -10]">
 *   <ngt-sphere-geometry />
 *   <ngt-mesh-basic-material color="yellow" />
 * </ngt-mesh>
 *
 * <ngtp-effect-composer>
 *   <ngtp-god-rays [options]="{ sun: sunRef, density: 0.96 }" />
 * </ngtp-effect-composer>
 * ```
 */
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
	/**
	 * Configuration options for the god rays effect.
	 * Must include a `sun` property with the light source reference.
	 * @see GodRaysOptions
	 */
	options = input({} as GodRaysOptions);

	private effectComposer = inject(NgtpEffectComposer);

	private effectOptions = omit(this.options, ['sun']);
	private sun = pick(this.options, 'sun');

	/**
	 * Resolves the sun reference to the actual Three.js object.
	 * Handles both direct references and function references.
	 */
	private sunElement = computed(() => {
		const sun = this.sun();
		if (typeof sun === 'function') return resolveRef(sun());
		return resolveRef(sun);
	});

	/**
	 * The underlying GodRaysEffect instance.
	 * Created with the camera, sun element, and configured options.
	 */
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
