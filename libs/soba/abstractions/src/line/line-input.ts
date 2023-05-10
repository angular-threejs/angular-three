import { Directive, Input } from '@angular/core';
import { NgtSignalStore } from 'angular-three';
import type { LineMaterialParameters } from 'three-stdlib';

export type NgtsLineState = {
    vertexColors?: Array<THREE.Color | [number, number, number]>;
    lineWidth?: number;
    segments?: boolean;
    color: THREE.ColorRepresentation;
    points: Array<THREE.Vector3 | THREE.Vector2 | [number, number, number] | [number, number] | number>;
} & Omit<LineMaterialParameters, 'vertexColors' | 'color'>;

@Directive()
export abstract class NgtsLineInputs extends NgtSignalStore<NgtsLineState> {
    @Input() set vertexColors(vertexColors: Array<THREE.Color | [number, number, number]>) {
        this.set({ vertexColors });
    }

    @Input() set lineWidth(lineWidth: number) {
        this.set({ lineWidth });
    }

    @Input() set alphaToCoverage(alphaToCoverage: boolean) {
        this.set({ alphaToCoverage });
    }

    @Input() set color(color: THREE.ColorRepresentation) {
        this.set({ color });
    }

    @Input() set dashed(dashed: boolean) {
        this.set({ dashed });
    }

    @Input() set dashScale(dashScale: number) {
        this.set({ dashScale });
    }

    @Input() set dashSize(dashSize: number) {
        this.set({ dashSize });
    }

    @Input() set dashOffset(dashOffset: number) {
        this.set({ dashOffset });
    }

    @Input() set gapSize(gapSize: number) {
        this.set({ gapSize });
    }

    @Input() set resolution(resolution: THREE.Vector2) {
        this.set({ resolution });
    }

    @Input() set wireframe(wireframe: boolean) {
        this.set({ wireframe });
    }

    @Input() set worldUnits(worldUnits: boolean) {
        this.set({ worldUnits });
    }

    constructor() {
        super({ color: 'black' });
    }
}
