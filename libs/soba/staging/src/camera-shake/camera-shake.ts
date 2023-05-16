import { computed, Directive, effect, inject, Input, OnInit } from '@angular/core';
import { injectBeforeRender, NgtSignalStore, NgtStore } from 'angular-three';
import { SimplexNoise } from 'three-stdlib';

export interface NgtsCameraShakeState {
    intensity: number;
    decay: boolean;
    decayRate: number;
    maxYaw: number;
    maxPitch: number;
    maxRoll: number;
    yawFrequency: number;
    pitchFrequency: number;
    rollFrequency: number;
}

@Directive({ selector: 'ngts-camera-shake', standalone: true })
export class NgtsCameraShake extends NgtSignalStore<NgtsCameraShakeState> implements OnInit {
    readonly #store = inject(NgtStore);

    #initialRotation = this.#store.get('camera').rotation.clone();

    readonly #yawNoise = new SimplexNoise();
    readonly #rollNoise = new SimplexNoise();
    readonly #pitchNoise = new SimplexNoise();

    @Input() set intensity(intensity: number) {
        this.set({ intensity });
    }

    @Input() set decay(decay: boolean) {
        this.set({ decay });
    }

    @Input() set decayRate(decayRate: number) {
        this.set({ decayRate });
    }

    @Input() set maxYaw(maxYaw: number) {
        this.set({ maxYaw });
    }

    @Input() set maxPitch(maxPitch: number) {
        this.set({ maxPitch });
    }

    @Input() set maxRoll(maxRoll: number) {
        this.set({ maxRoll });
    }

    @Input() set yawFrequency(yawFrequency: number) {
        this.set({ yawFrequency });
    }

    @Input() set pitchFrequency(pitchFrequency: number) {
        this.set({ pitchFrequency });
    }

    @Input() set rollFrequency(rollFrequency: number) {
        this.set({ rollFrequency });
    }

    constructor() {
        super({
            intensity: 1,
            decayRate: 0.65,
            maxYaw: 0.1,
            maxPitch: 0.1,
            maxRoll: 0.1,
            yawFrequency: 0.1,
            pitchFrequency: 0.1,
            rollFrequency: 0.1,
        });

        injectBeforeRender(({ clock, delta, camera }) => {
            const {
                intensity,
                maxYaw,
                maxPitch,
                maxRoll,
                yawFrequency,
                pitchFrequency,
                rollFrequency,
                decay,
                decayRate,
            } = this.get();

            const shake = Math.pow(intensity, 2);
            const yaw = maxYaw * shake * this.#yawNoise.noise(clock.elapsedTime * yawFrequency, 1);
            const pitch = maxPitch * shake * this.#pitchNoise.noise(clock.elapsedTime * pitchFrequency, 1);
            const roll = maxRoll * shake * this.#rollNoise.noise(clock.elapsedTime * rollFrequency, 1);

            camera.rotation.set(
                this.#initialRotation.x + pitch,
                this.#initialRotation.y + yaw,
                this.#initialRotation.z + roll
            );

            if (decay && intensity > 0) {
                this.set({ intensity: intensity - decayRate * delta });
                this.#constraintIntensity();
            }
        });

        this.#setChangeEvent();
    }

    ngOnInit(): void {}

    #setChangeEvent() {
        const camera = this.#store.select('camera');
        const controls = this.#store.select('controls');
        const trigger = computed(() => ({ camera: camera(), controls: controls() }));
        effect((onCleanup) => {
            const { camera, controls } = trigger();
            if (controls) {
                const callback = () => void (this.#initialRotation = camera.rotation.clone());
                controls.addEventListener('change', callback);
                callback();
                onCleanup(() => void controls.removeEventListener('change', callback));
            }
        });
    }

    getIntensity() {
        return this.get('intensity');
    }

    setIntensity(intensity: number) {
        this.set({ intensity });
        this.#constraintIntensity();
    }

    #constraintIntensity() {
        const intensity = this.get('intensity');
        if (intensity < 0 || intensity > 1) {
            this.set({ intensity: intensity < 0 ? 0 : 1 });
        }
    }
}
