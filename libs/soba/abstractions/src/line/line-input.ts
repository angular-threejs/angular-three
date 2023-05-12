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

    readonly #color = this.select('color');
    readonly #vertexColors = this.select('vertexColors');
    readonly #resolution = this.select('resolution');
    readonly #linewidth = this.select('lineWidth');
    readonly #alphaToCoverage = this.select('alphaToCoverage');
    readonly #dashed = this.select('dashed');
    readonly #dashScale = this.select('dashScale');
    readonly #dashSize = this.select('dashSize');
    readonly #dashOffset = this.select('dashOffset');
    readonly #gapSize = this.select('gapSize');
    readonly #wireframe = this.select('wireframe');
    readonly #worldUnits = this.select('worldUnits');

    readonly lineParameters = computed(() => ({
        color: this.#color(),
        vertexColors: this.#vertexColors(),
        resolution: this.#resolution(),
        linewidth: this.#linewidth(),
        alphaToCoverage: this.#alphaToCoverage(),
        dashed: this.#dashed(),
        dashScale: this.#dashScale(),
        dashSize: this.#dashSize(),
        dashOffset: this.#dashOffset(),
        gapSize: this.#gapSize(),
        wireframe: this.#wireframe(),
        worldUnits: this.#worldUnits(),
    }));

    constructor() {
        super({ color: 'black' });
    }
}
