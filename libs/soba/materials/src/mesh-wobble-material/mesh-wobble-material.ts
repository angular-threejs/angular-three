import { Component, CUSTOM_ELEMENTS_SCHEMA, Input } from '@angular/core';
import { extend, injectBeforeRender, injectNgtRef, NgtArgs, NgtSignalStore } from 'angular-three';
import { MeshWobbleMaterial } from 'angular-three-soba/shaders';

extend({ MeshWobbleMaterial });

export interface NgtsMeshWobbleMaterialState {
    time: number;
    factor: number;
    speed: number;
}

@Component({
    selector: 'ngts-mesh-wobble-material',
    standalone: true,
    template: `
        <ngt-primitive
            *args="[material]"
            [ref]="materialRef"
            [time]="wobbleTime()"
            [factor]="wobbleFactor()"
            attach="material"
            ngtCompound
        />
    `,
    imports: [NgtArgs],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsMeshWobbleMaterial extends NgtSignalStore<NgtsMeshWobbleMaterialState> {
    readonly material = new MeshWobbleMaterial();

    @Input() materialRef = injectNgtRef<MeshWobbleMaterial>();

    @Input() set time(time: number) {
        this.set({ time });
    }

    @Input() set factor(factor: number) {
        this.set({ factor });
    }

    @Input() set speed(speed: number) {
        this.set({ speed });
    }

    readonly wobbleTime = this.select('time');
    readonly wobbleFactor = this.select('factor');

    constructor() {
        super({ speed: 1, time: 0, factor: 1 });
        injectBeforeRender(({ clock }) => {
            this.material.time = clock.getElapsedTime() * this.get('speed');
        });
    }
}
