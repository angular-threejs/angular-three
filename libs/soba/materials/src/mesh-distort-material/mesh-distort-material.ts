import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, Input } from '@angular/core';
import { injectBeforeRender, injectNgtRef, NgtArgs, NgtSignalStore } from 'angular-three';
import { MeshDistortMaterial, NGTS_DISTORT_MATERIAL_SHADER } from 'angular-three-soba/shaders';

export interface NgtsMeshDistortMaterialState {
    time: number;
    distort: number;
    radius: number;
    speed: number;
}

@Component({
    selector: 'ngts-mesh-distort-material',
    standalone: true,
    template: `
        <ngt-primitive
            *args="[material]"
            [ref]="materialRef"
            [time]="distortTime()"
            [distort]="distortDistort()"
            [radius]="distortRadius()"
            ngtCompound
            attach="material"
        />
    `,
    imports: [NgtArgs],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsMeshDistortMaterial extends NgtSignalStore<NgtsMeshDistortMaterialState> {
    readonly material = new (inject(NGTS_DISTORT_MATERIAL_SHADER))();

    @Input() materialRef = injectNgtRef<InstanceType<MeshDistortMaterial>>();

    @Input() set time(time: number) {
        this.set({ time });
    }

    @Input() set distort(distort: number) {
        this.set({ distort });
    }

    @Input() set radius(radius: number) {
        this.set({ radius });
    }

    @Input() set speed(speed: number) {
        this.set({ speed });
    }

    readonly distortTime = this.select('time');
    readonly distortDistort = this.select('distort');
    readonly distortRadius = this.select('radius');

    constructor() {
        super({ speed: 1, time: 0, distort: 0.4, radius: 1 });
        injectBeforeRender(({ clock }) => {
            this.material.time = clock.getElapsedTime() * this.get('speed');
        });
    }
}
