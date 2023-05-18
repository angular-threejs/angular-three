import { Directive, effect, inject, Input } from '@angular/core';
import {
    injectNgtRef,
    NgtSignalStore,
    NgtStore,
    requestAnimationInInjectionContext,
    type NgtCamera,
} from 'angular-three';
import { injectNgtsFBO } from 'angular-three-soba/misc';

export interface NgtsCameraState {
    makeDefault: boolean;
    manual: boolean;
    frames: number;
    resolution: number;
    envMap?: THREE.Texture;
}

@Directive()
export abstract class NgtsCamera<TCamera extends NgtCamera> extends NgtSignalStore<NgtsCameraState> {
    @Input() set makeDefault(makeDefault: boolean) {
        this.set({ makeDefault });
    }

    @Input() set manual(manual: boolean) {
        this.set({ manual });
    }

    @Input() set frames(frames: number) {
        this.set({ frames });
    }

    @Input() set resolution(resolution: number) {
        this.set({ resolution });
    }

    @Input() set envMap(envMap: THREE.Texture) {
        this.set({ envMap });
    }

    @Input() cameraRef = injectNgtRef<TCamera>();

    protected readonly store = inject(NgtStore);
    readonly #resolution = this.select('resolution');
    readonly fboRef = injectNgtsFBO(() => ({ width: this.#resolution() }));

    constructor() {
        super({ resolution: 256, frames: Infinity, makeDefault: false, manual: false });
        requestAnimationInInjectionContext(() => {
            this.#setDefaultCamera();
            this.#updateProjectionMatrix();
        });
    }

    #setDefaultCamera() {
        const makeDefault = this.select('makeDefault');
        effect(
            (onCleanup) => {
                const camera = this.cameraRef.nativeElement;
                if (camera && makeDefault()) {
                    const { camera: oldCamera } = this.store.get();
                    this.store.set({ camera });
                    onCleanup(() => this.store.set({ camera: oldCamera }));
                }
            },
            { allowSignalWrites: true }
        );
    }

    #updateProjectionMatrix() {
        const manual = this.select('manual');
        effect(() => {
            const camera = this.cameraRef.nativeElement;
            if (!manual() && camera) camera.updateProjectionMatrix();
        });
    }
}
