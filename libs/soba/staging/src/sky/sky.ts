import { CUSTOM_ELEMENTS_SCHEMA, Component, Input, computed } from '@angular/core';
import { NgtArgs, injectNgtRef, signalStore, type NgtMesh } from 'angular-three';
import * as THREE from 'three';
import { Sky } from 'three-stdlib';

function calcPosFromAngles(inclination: number, azimuth: number, vector = new THREE.Vector3()) {
	const theta = Math.PI * (inclination - 0.5);
	const phi = 2 * Math.PI * (azimuth - 0.5);

	vector.x = Math.cos(phi);
	vector.y = Math.sin(theta);
	vector.z = Math.sin(phi);

	return vector;
}

export interface NgtsSkyState {
	distance: number;
	sunPosition: THREE.Vector3 | Parameters<THREE.Vector3['set']>;
	inclination: number;
	azimuth: number;
	mieCoefficient: number;
	mieDirectionalG: number;
	rayleigh: number;
	turbidity: number;
}

declare global {
	interface HTMLElementTagNameMap {
		/**
		 * @extends three-stdlib|Sky
		 * @extends ngt-mesh
		 */
		'ngts-sky': NgtsSkyState & Sky & NgtMesh;
	}
}

@Component({
	selector: 'ngts-sky',
	standalone: true,
	template: `
		<ngt-primitive *args="[sky]" [ref]="skyRef" [scale]="scale()" ngtCompound>
			<ngt-value [rawValue]="mieCoefficient()" attach="material.uniforms.mieCoefficient.value" />
			<ngt-value [rawValue]="mieDirectionalG()" attach="material.uniforms.mieDirectionalG.value" />
			<ngt-value [rawValue]="rayleigh()" attach="material.uniforms.rayleigh.value" />
			<ngt-value [rawValue]="sunPosition()" attach="material.uniforms.sunPosition.value" />
			<ngt-value [rawValue]="turbidity()" attach="material.uniforms.turbidity.value" />
			<ng-content />
		</ngt-primitive>
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsSky {
	private inputs = signalStore<NgtsSkyState>({
		inclination: 0.6,
		azimuth: 0.1,
		distance: 1000,
		mieCoefficient: 0.005,
		mieDirectionalG: 0.8,
		rayleigh: 0.5,
		turbidity: 10,
	});

	@Input() skyRef = injectNgtRef<Sky>();

	@Input({ alias: 'distance' }) set _distance(distance: number) {
		this.inputs.set({ distance });
	}

	@Input({ alias: 'sunPosition' }) set _sunPosition(sunPosition: THREE.Vector3 | Parameters<THREE.Vector3['set']>) {
		this.inputs.set({ sunPosition });
	}

	@Input({ alias: 'inclination' }) set _inclination(inclination: number) {
		this.inputs.set({ inclination });
	}

	@Input({ alias: 'azimuth' }) set _azimuth(azimuth: number) {
		this.inputs.set({ azimuth });
	}

	@Input({ alias: 'mieCoefficient' }) set _mieCoefficient(mieCoefficient: number) {
		this.inputs.set({ mieCoefficient });
	}

	@Input({ alias: 'mieDirectionalG' }) set _mieDirectionalG(mieDirectionalG: number) {
		this.inputs.set({ mieDirectionalG });
	}

	@Input({ alias: 'rayleigh' }) set _rayleigh(rayleigh: number) {
		this.inputs.set({ rayleigh });
	}

	@Input({ alias: 'turbidity' }) set _turbidity(turbidity: number) {
		this.inputs.set({ turbidity });
	}

	private inclination = this.inputs.select('inclination');
	private azimuth = this.inputs.select('azimuth');
	private sunPos = this.inputs.select('sunPosition');
	private distance = this.inputs.select('distance');

	sunPosition = computed(() => this.sunPos() || calcPosFromAngles(this.inclination(), this.azimuth()));
	scale = computed(() => new THREE.Vector3().setScalar(this.distance()));
	mieCoefficient = this.inputs.select('mieCoefficient');
	mieDirectionalG = this.inputs.select('mieDirectionalG');
	rayleigh = this.inputs.select('rayleigh');
	turbidity = this.inputs.select('turbidity');

	sky = new Sky();
}
