import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, Input } from '@angular/core';
import { injectNgtRef } from 'angular-three';
import * as THREE from 'three';
import { CatmullRomCurve3 } from 'three';
import { Line2 } from 'three-stdlib';
import { NgtsLine } from '../line/line';
import { NgtsLineInputs } from '../line/line-input';

declare module '../line/line-input' {
    interface NgtsLineState {
        closed: boolean;
        curveType: 'centripetal' | 'chordal' | 'catmullrom';
        tension: number;
    }
}

@Component({
    selector: 'ngts-catmull-rom-line',
    standalone: true,
    template: `
        <ngts-line
            [lineRef]="lineRef"
            [points]="segmentedPoints()"
            [vertexColors]="interpolatedVertexColors()"
            [color]="lineParameters().color"
            [resolution]="lineParameters().resolution"
            [lineWidth]="lineParameters().linewidth"
            [alphaToCoverage]="lineParameters().alphaToCoverage"
            [dashed]="lineParameters().dashed"
            [dashScale]="lineParameters().dashScale"
            [dashSize]="lineParameters().dashSize"
            [dashOffset]="lineParameters().dashOffset"
            [gapSize]="lineParameters().gapSize"
            [wireframe]="lineParameters().wireframe"
            [worldUnits]="lineParameters().worldUnits"
        />
    `,
    imports: [NgtsLine],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsCatmullRomLine extends NgtsLineInputs {
    @Input() lineRef = injectNgtRef<Line2>();

    @Input({ required: true }) set points(
        points: Array<THREE.Vector3 | THREE.Vector2 | [number, number, number] | [number, number] | number>
    ) {
        this.set({ points });
    }

    @Input() set closed(closed: boolean) {
        this.set({ closed });
    }

    @Input() set curveType(curveType: 'centripetal' | 'chordal' | 'catmullrom') {
        this.set({ curveType });
    }

    @Input() set tension(tension: number) {
        this.set({ tension });
    }

    @Input() set segments(segments: number) {
        this.set({ segments });
    }

    readonly #points = this.select('points');
    readonly #closed = this.select('closed');
    readonly #curveType = this.select('curveType');
    readonly #tension = this.select('tension');
    readonly #vertexColors = this.select('vertexColors');

    readonly #curve = computed(() => {
        const mappedPoints = this.#points().map((p) =>
            p instanceof THREE.Vector3 ? p : new THREE.Vector3(...(p as [number, number, number]))
        );
        return new CatmullRomCurve3(mappedPoints, this.#closed(), this.#curveType(), this.#tension());
    });

    readonly #segments = this.select('segments');
    readonly segmentedPoints = computed(() => {
        const curve = this.#curve();
        return curve.getPoints(this.#segments() as number);
    });

    readonly interpolatedVertexColors = computed(() => {
        const vertexColors = this.#vertexColors();
        const segments = this.#segments() as number;

        if (!vertexColors || vertexColors.length < 2) return undefined;
        if (vertexColors.length === segments + 1) return vertexColors;

        const mappedColors = vertexColors.map((color: THREE.Color | [number, number, number]) =>
            color instanceof THREE.Color ? color : new THREE.Color(...color)
        );
        if (this.get('closed')) mappedColors.push(mappedColors[0].clone());

        const iColors: THREE.Color[] = [mappedColors[0]];
        const divisions = segments / (mappedColors.length - 1);
        for (let i = 0; i < segments; i++) {
            const alpha = (i % divisions) / divisions;
            const colorIndex = Math.floor(i / divisions);
            iColors.push(mappedColors[colorIndex].clone().lerp(mappedColors[colorIndex + 1], alpha));
        }
        iColors.push(mappedColors[mappedColors.length - 1]);
        return iColors;
    });

    constructor() {
        super();
        this.set({ closed: false, curveType: 'centripetal', tension: 0.5, segments: 64 });
    }
}
