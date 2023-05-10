import { Directive, Input, computed } from '@angular/core';
import { NgtSignalStore } from 'angular-three';
import type { LineMaterialParameters } from 'three-stdlib';

export interface NgtsLineState extends Omit<LineMaterialParameters, 'vertexColors' | 'color'> {
    vertexColors?: Array<THREE.Color | [number, number, number]>;
    lineWidth?: number;
    segments: boolean | number | undefined;
    color: THREE.ColorRepresentation;
    points: Array<THREE.Vector3 | THREE.Vector2 | [number, number, number] | [number, number] | number>;
}

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

    readonly lineParameters = computed(() => {
        const color = this.select('color');
        const vertexColors = this.select('vertexColors');
        const resolution = this.select('resolution');
        const linewidth = this.select('lineWidth');
        const alphaToCoverage = this.select('alphaToCoverage');
        const dashed = this.select('dashed');
        const dashScale = this.select('dashScale');
        const dashSize = this.select('dashSize');
        const dashOffset = this.select('dashOffset');
        const gapSize = this.select('gapSize');
        const wireframe = this.select('wireframe');
        const worldUnits = this.select('worldUnits');

        return {
            color: color(),
            vertexColors: vertexColors(),
            resolution: resolution(),
            linewidth: linewidth(),
            alphaToCoverage: alphaToCoverage(),
            dashed: dashed(),
            dashScale: dashScale(),
            dashSize: dashSize(),
            dashOffset: dashOffset(),
            gapSize: gapSize(),
            wireframe: wireframe(),
            worldUnits: worldUnits(),
        };
    });

    constructor() {
        super({ color: 'black' });
    }
}
