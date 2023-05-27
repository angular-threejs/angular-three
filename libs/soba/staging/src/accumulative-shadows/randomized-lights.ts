import { CUSTOM_ELEMENTS_SCHEMA, Component, Input, computed, effect, inject } from '@angular/core';
import {
    NgtArgs,
    NgtRepeat,
    NgtSignalStore,
    extend,
    injectNgtRef,
    requestAnimationFrameInInjectionContext,
    type NgtGroup,
} from 'angular-three';
import * as THREE from 'three';
import { DirectionalLight, Group, OrthographicCamera, Vector2 } from 'three';
import { NGTS_ACCUMULATIVE_SHADOWS_API } from './accumulative-shadows';

extend({ Group, DirectionalLight, OrthographicCamera, Vector2 });

export interface NgtsRandomizedLightsState {
    /** How many frames it will jiggle the lights, 1.
     *  Frames is context aware, if a provider like AccumulativeShadows exists, frames will be taken from there!  */
    frames: number;
    /** Light position, [0, 0, 0] */
    position: [x: number, y: number, z: number];
    /** Radius of the jiggle, higher values make softer light, 5 */
    radius: number;
    /** Amount of lights, 8 */
    amount: number;
    /** Light intensity, 1 */
    intensity: number;
    /** Ambient occlusion, lower values mean less AO, hight more, you can mix AO and directional light, 0.5 */
    ambient: number;
    /** If the lights cast shadows, this is true by default */
    castShadow: boolean;
    /** Default shadow bias, 0 */
    bias: number;
    /** Default map size, 512 */
    mapSize: number;
    /** Default size of the shadow camera, 10 */
    size: number;
    /** Default shadow camera near, 0.5 */
    near: number;
    /** Default shadow camera far, 500 */
    far: number;
}

declare global {
    interface HTMLElementTagNameMap {
        'ngts-randomized-lights': NgtGroup & NgtsRandomizedLightsState;
    }
}

@Component({
    selector: 'ngts-randomized-lights',
    standalone: true,
    template: `
        <ngt-group ngtCompound [ref]="lightsRef">
            <ngt-directional-light
                *ngFor="let i; repeat: lightsAmount()"
                [castShadow]="lightsCastShadow()"
                [intensity]="lightsIntensity() / lightsAmount()"
            >
                <ngt-value [rawValue]="lightsBias()" attach="shadow.bias" />
                <ngt-vector2 *args="shadowMapSize()" attach="shadow.mapSize" />
                <ngt-orthographic-camera *args="cameraArgs()" attach="shadow.camera" />
            </ngt-directional-light>
        </ngt-group>
    `,
    imports: [NgtArgs, NgtRepeat],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsRandomizedLights extends NgtSignalStore<NgtsRandomizedLightsState> {
    @Input() lightsRef = injectNgtRef<THREE.Group>();
    /** How many frames it will jiggle the lights, 1.
     *  Frames is context aware, if a provider like AccumulativeShadows exists, frames will be taken from there!  */
    @Input() set frames(frames: number) {
        this.set({ frames });
    }

    /** Light position, [0, 0, 0] */
    @Input() set position(position: [x: number, y: number, z: number]) {
        this.set({ position });
    }

    /** Radius of the jiggle, higher values make softer light, 5 */
    @Input() set radius(radius: number) {
        this.set({ radius });
    }

    /** Amount of lights, 8 */
    @Input() set amount(amount: number) {
        this.set({ amount });
    }

    /** Light intensity, 1 */
    @Input() set intensity(intensity: number) {
        this.set({ intensity });
    }

    /** Ambient occlusion, lower values mean less AO, hight more, you can mix AO and directional light, 0.5 */
    @Input() set ambient(ambient: number) {
        this.set({ ambient });
    }

    /** If the lights cast shadows, this is true by default */
    @Input() set castShadow(castShadow: boolean) {
        this.set({ castShadow });
    }

    /** Default shadow bias, 0 */
    @Input() set bias(bias: number) {
        this.set({ bias });
    }

    /** Default map size, 512 */
    @Input() set mapSize(mapSize: number) {
        this.set({ mapSize });
    }

    /** Default size of the shadow camera, 10 */
    @Input() set size(size: number) {
        this.set({ size });
    }

    /** Default shadow camera near, 0.5 */
    @Input() set near(near: number) {
        this.set({ near });
    }

    /** Default shadow camera far, 500 */
    @Input() set far(far: number) {
        this.set({ far });
    }

    readonly #parent = inject(NGTS_ACCUMULATIVE_SHADOWS_API);

    readonly #size = this.select('size');
    readonly #near = this.select('near');
    readonly #far = this.select('far');
    readonly #mapSize = this.select('mapSize');
    readonly #ambient = this.select('ambient');
    readonly #position = this.select('position');
    readonly #radius = this.select('radius');

    readonly lightsAmount = this.select('amount');
    readonly lightsCastShadow = this.select('castShadow');
    readonly lightsIntensity = this.select('intensity');
    readonly lightsBias = this.select('bias');

    readonly shadowMapSize = computed(() => [this.#mapSize(), this.#mapSize()]);
    readonly cameraArgs = computed(() => [
        -this.#size(),
        this.#size(),
        this.#size(),
        -this.#size(),
        this.#near(),
        this.#far(),
    ]);

    readonly length = computed(() => new THREE.Vector3(...this.#position()).length());

    readonly api = computed(() => {
        const radius = this.#radius();
        const position = this.#position();
        const ambient = this.#ambient();
        const length = this.length();
        const lights = this.lightsRef.nativeElement;

        const update = () => {
            let light: THREE.DirectionalLight | undefined;
            if (lights) {
                for (let l = 0; l < lights.children.length; l++) {
                    light = lights.children[l] as THREE.DirectionalLight;
                    if (Math.random() > ambient) {
                        light.position.set(
                            position[0] + THREE.MathUtils.randFloatSpread(radius),
                            position[1] + THREE.MathUtils.randFloatSpread(radius),
                            position[2] + THREE.MathUtils.randFloatSpread(radius)
                        );
                    } else {
                        const lambda = Math.acos(2 * Math.random() - 1) - Math.PI / 2.0;
                        const phi = 2 * Math.PI * Math.random();
                        light.position.set(
                            Math.cos(lambda) * Math.cos(phi) * length,
                            Math.abs(Math.cos(lambda) * Math.sin(phi) * length),
                            Math.sin(lambda) * length
                        );
                    }
                }
            }
        };

        return { update };
    });

    constructor() {
        super({
            castShadow: true,
            bias: 0.001,
            mapSize: 512,
            size: 5,
            near: 0.5,
            far: 500,
            frames: 1,
            position: [0, 0, 0],
            radius: 1,
            amount: 8,
            intensity: 1,
            ambient: 0.5,
        });
        requestAnimationFrameInInjectionContext(() => {
            this.#updateLightsMap();
        });
    }

    #updateLightsMap() {
        effect((onCleanup) => {
            const lights = this.lightsRef.nativeElement;
            if (!lights) return;
            const parent = this.#parent();
            if (parent) {
                parent.lights.set(lights.uuid, this.api);
                onCleanup(() => parent.lights.delete(lights.uuid));
            }
        });
    }
}
