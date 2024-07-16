import { ChangeDetectionStrategy, Component, computed, CUSTOM_ELEMENTS_SCHEMA, input } from '@angular/core';
import { NgtArgs, NgtMesh, NgtVector3, omit, pick, vector3 } from 'angular-three';
import { mergeInputs } from 'ngxtension/inject-inputs';
import { Vector3 } from 'three';
import { Sky } from 'three-stdlib';

export function calcPosFromAngles(inclination: number, azimuth: number, vector: Vector3 = new Vector3()) {
	const theta = Math.PI * (inclination - 0.5);
	const phi = 2 * Math.PI * (azimuth - 0.5);

	vector.x = Math.cos(phi);
	vector.y = Math.sin(theta);
	vector.z = Math.sin(phi);

	return vector;
}

export interface NgtsSkyOptions extends Partial<Omit<NgtMesh, 'scale'>> {
	distance: number;
	inclination: number;
	azimuth: number;
	mieCoefficient: number;
	mieDirectionalG: number;
	rayleigh: number;
	turbidity: number;
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

@Component({
	selector: 'ngts-sky',
	standalone: true,
	template: `
		<ngt-primitive *args="[sky]" [parameters]="parameters()" [scale]="scale()">
			<ngt-value attach="material.uniforms.mieCoefficient.value" [rawValue]="mieCoefficient()" />
			<ngt-value attach="material.uniforms.mieDirectionalG.value" [rawValue]="mieDirectionalG()" />
			<ngt-value attach="material.uniforms.rayleigh.value" [rawValue]="rayleigh()" />
			<ngt-value attach="material.uniforms.sunPosition.value" [rawValue]="calculatedSunPosition()" />
			<ngt-value attach="material.uniforms.turbidity.value" [rawValue]="turbidity()" />
			<ng-content />
		</ngt-primitive>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs],
})
export class NgtsSky {
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });
	parameters = omit(this.options, [
		'distance',
		'inclination',
		'azimuth',
		'sunPosition',
		'turbidity',
		'mieCoefficient',
		'mieDirectionalG',
		'sunPosition',
	]);

	distance = pick(this.options, 'distance');
	turbidity = pick(this.options, 'turbidity');
	mieCoefficient = pick(this.options, 'mieCoefficient');
	mieDirectionalG = pick(this.options, 'mieDirectionalG');
	rayleigh = pick(this.options, 'rayleigh');

	scale = computed(() => new Vector3().setScalar(this.distance()));

	private inclination = pick(this.options, 'inclination');
	private azimuth = pick(this.options, 'azimuth');
	private sunPosition = vector3(this.options, 'sunPosition', true);
	calculatedSunPosition = computed(() => {
		const sunPosition = this.sunPosition();
		if (sunPosition) return sunPosition;
		return calcPosFromAngles(this.inclination(), this.azimuth());
	});

	sky = new Sky();
}
