import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, Input } from '@angular/core';
import { injectNgtRef, NgtArgs, NgtSignalStore } from 'angular-three';
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
        'ngts-sky': NgtsSkyState & Sky;
    }
}

@Component({
    selector: 'ngts-sky',
    standalone: true,
    template: `
        <ngt-primitive ngtCompound *args="[sky]" [ref]="skyRef" [scale]="scale()">
            <ngt-value [rawValue]="skyMieCoefficient()" attach="material.uniforms.mieCoefficient.value" />
            <ngt-value [rawValue]="skyMieDirectionalG()" attach="material.uniforms.mieDirectionalG.value" />
            <ngt-value [rawValue]="skyRayleigh()" attach="material.uniforms.rayleigh.value" />
            <ngt-value [rawValue]="calculatedSunPosition()" attach="material.uniforms.sunPosition.value" />
            <ngt-value [rawValue]="skyTurbidity()" attach="material.uniforms.turbidity.value" />
        </ngt-primitive>
    `,
    imports: [NgtArgs],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsSky extends NgtSignalStore<NgtsSkyState> {
    @Input() skyRef = injectNgtRef<Sky>();

    @Input() set distance(distance: number) {
        this.set({ distance });
    }

    @Input() set sunPosition(sunPosition: THREE.Vector3 | Parameters<THREE.Vector3['set']>) {
        this.set({ sunPosition });
    }

    @Input() set inclination(inclination: number) {
        this.set({ inclination });
    }

    @Input() set azimuth(azimuth: number) {
        this.set({ azimuth });
    }

    @Input() set mieCoefficient(mieCoefficient: number) {
        this.set({ mieCoefficient });
    }

    @Input() set mieDirectionalG(mieDirectionalG: number) {
        this.set({ mieDirectionalG });
    }

    @Input() set rayleigh(rayleigh: number) {
        this.set({ rayleigh });
    }

    @Input() set turbidity(turbidity: number) {
        this.set({ turbidity });
    }

    readonly #inclination = this.select('inclination');
    readonly #azimuth = this.select('azimuth');
    readonly #sunPosition = this.select('sunPosition');
    readonly #distance = this.select('distance');

    readonly sky = new Sky();

    readonly skyMieCoefficient = this.select('mieCoefficient');
    readonly skyMieDirectionalG = this.select('mieDirectionalG');
    readonly skyRayleigh = this.select('rayleigh');
    readonly skyTurbidity = this.select('turbidity');

    readonly calculatedSunPosition = computed(
        () => this.#sunPosition() || calcPosFromAngles(this.#inclination(), this.#azimuth())
    );
    readonly scale = computed(() => new THREE.Vector3().setScalar(this.#distance()));

    constructor() {
        super({
            inclination: 0.6,
            azimuth: 0.1,
            distance: 1000,
            mieCoefficient: 0.005,
            mieDirectionalG: 0.8,
            rayleigh: 0.5,
            turbidity: 10,
        });
    }
}
