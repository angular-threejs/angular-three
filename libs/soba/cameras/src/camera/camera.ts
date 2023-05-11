import { Directive, effect, inject, Input } from '@angular/core';
import { injectNgtRef, NgtSignalStore, NgtStore, type NgtCamera } from 'angular-three';
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
    readonly fboRef = injectNgtsFBO(() => {
        const resolution = this.select('resolution');
        return { width: resolution() };
    });

    constructor() {
        super({ resolution: 256, frames: Infinity, makeDefault: false, manual: false });
        this.#setDefaultCamera();
        this.#updateProjectionMatrix();
    }

    #setDefaultCamera() {
        effect(
            (onCleanup) => {
                const camera = this.cameraRef.nativeElement;
                const makeDefault = this.select('makeDefault');
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
        effect(() => {
            const camera = this.cameraRef.nativeElement;
            const manual = this.select('manual');
            if (!manual() && camera) camera.updateProjectionMatrix();
        });
    }
}
