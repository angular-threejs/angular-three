import { ChangeDetectionStrategy, Component, computed, CUSTOM_ELEMENTS_SCHEMA, input } from '@angular/core';
import { NgtArgs, NgtThreeElements, NgtVector3, omit, pick, vector3 } from 'angular-three';
import { mergeInputs } from 'ngxtension/inject-inputs';
import * as THREE from 'three';
import { Sky } from 'three-stdlib';

/**
 * Calculates the sun position from inclination and azimuth angles.
 *
 * @param inclination - Vertical angle of the sun (0-1, where 0.5 is horizon)
 * @param azimuth - Horizontal angle of the sun (0-1, representing full rotation)
 * @param vector - Optional vector to store the result (creates new if not provided)
 * @returns The calculated sun position vector
 */
export function calcPosFromAngles(inclination: number, azimuth: number, vector: THREE.Vector3 = new THREE.Vector3()) {
	const theta = Math.PI * (inclination - 0.5);
	const phi = 2 * Math.PI * (azimuth - 0.5);

	vector.x = Math.cos(phi);
	vector.y = Math.sin(theta);
	vector.z = Math.sin(phi);

	return vector;
}

/**
 * Configuration options for the NgtsSky component.
 * Extends the base mesh element options from Three.js.
 */
export interface NgtsSkyOptions extends Partial<Omit<NgtThreeElements['ngt-mesh'], 'scale'>> {
	/**
	 * Distance of the sky sphere from the camera.
	 * @default 1000
	 */
	distance: number;
	/**
	 * Vertical angle of the sun (0-1, where 0.5 is horizon).
	 * Values above 0.5 place sun above horizon, below places it below.
	 * @default 0.6
	 */
	inclination: number;
	/**
	 * Horizontal angle of the sun (0-1, representing full rotation).
	 * @default 0.1
	 */
	azimuth: number;
	/**
	 * Mie scattering coefficient. Controls haze and sun disc intensity.
	 * @default 0.005
	 */
	mieCoefficient: number;
	/**
	 * Mie scattering directional parameter. Controls sun disc size.
	 * @default 0.8
	 */
	mieDirectionalG: number;
	/**
	 * Rayleigh scattering coefficient. Higher values create bluer skies.
	 * @default 0.5
	 */
	rayleigh: number;
	/**
	 * Atmospheric turbidity. Higher values create hazier atmospheres.
	 * @default 10
	 */
	turbidity: number;
	/**
	 * Direct sun position vector. If provided, overrides inclination/azimuth.
	 */
	sunPosition?: NgtVector3;
}

const defaultOptions: NgtsSkyOptions = {
	distance: 1000,
	inclination: 0.6,
	azimuth: 0.1,
	mieCoefficient: 0.005,
	mieDirectionalG: 0.8,
	rayleigh: 0.5,
	turbidity: 10,
};

/**
 * Renders a procedural sky dome using atmospheric scattering simulation.
 * Based on the Three.js Sky shader which simulates realistic sky colors based on sun position.
 *
 * @example
 * ```html
 * <ngts-sky [options]="{ turbidity: 10, rayleigh: 2, inclination: 0.5 }" />
 * ```
 */
@Component({
	selector: 'ngts-sky',
	template: `
		<ngt-primitive
			*args="[sky]"
			[parameters]="parameters()"
			[scale]="scale()"
			[material.uniforms.mieCoefficient.value]="mieCoefficient()"
			[material.uniforms.mieDirectionalG.value]="mieDirectionalG()"
			[material.uniforms.rayleigh.value]="rayleigh()"
			[material.uniforms.sunPosition.value]="calculatedSunPosition()"
			[material.uniforms.turbidity.value]="turbidity()"
		>
			<ng-content />
		</ngt-primitive>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs],
})
export class NgtsSky {
	/** Configuration options for the sky appearance. */
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });
	protected parameters = omit(this.options, [
		'distance',
		'inclination',
		'azimuth',
		'sunPosition',
		'turbidity',
		'mieCoefficient',
		'mieDirectionalG',
		'sunPosition',
	]);

	private distance = pick(this.options, 'distance');
	protected turbidity = pick(this.options, 'turbidity');
	protected mieCoefficient = pick(this.options, 'mieCoefficient');
	protected mieDirectionalG = pick(this.options, 'mieDirectionalG');
	protected rayleigh = pick(this.options, 'rayleigh');

	protected scale = computed(() => new THREE.Vector3().setScalar(this.distance()));

	private inclination = pick(this.options, 'inclination');
	private azimuth = pick(this.options, 'azimuth');
	private sunPosition = vector3(this.options, 'sunPosition', true);
	protected calculatedSunPosition = computed(() => {
		const sunPosition = this.sunPosition();
		if (sunPosition) return sunPosition;
		return calcPosFromAngles(this.inclination(), this.azimuth());
	});

	protected sky = new Sky();
}
