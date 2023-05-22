import { RouteMeta } from '@analogjs/router';
import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, effect, ElementRef, Input, ViewChild } from '@angular/core';
import { Triplet } from '@pmndrs/cannon-worker-api';
import { NgtArgs, NgtCanvas, NgtSignalStore } from 'angular-three';
import { NgtcPhysics } from 'angular-three-cannon';
import { injectHeightfield, injectSphere } from 'angular-three-cannon/services';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
// @ts-ignore
import niceColors from 'nice-color-palettes';
import * as THREE from 'three';

export const routeMeta: RouteMeta = {
    title: 'Height Field',
};

type GenerateHeightmapArgs = {
    height: number;
    number: number;
    scale: number;
    width: number;
};

/* Generates a 2D array using Worley noise. */
function generateHeightmap({ width, height, number, scale }: GenerateHeightmapArgs) {
    const data = [];

    const seedPoints = [];
    for (let i = 0; i < number; i++) {
        seedPoints.push([Math.random(), Math.random()]);
    }

    let max = 0;
    for (let i = 0; i < width; i++) {
        const row = [];
        for (let j = 0; j < height; j++) {
            let min = Infinity;
            seedPoints.forEach((p) => {
                const distance2 = (p[0] - i / width) ** 2 + (p[1] - j / height) ** 2;
                if (distance2 < min) {
                    min = distance2;
                }
            });
            const d = Math.sqrt(min);
            if (d > max) {
                max = d;
            }
            row.push(d);
        }
        data.push(row);
    }

    /* Normalize and scale. */
    for (let i = 0; i < width; i++) {
        for (let j = 0; j < height; j++) {
            data[i][j] *= scale / max;
        }
    }
    return data;
}

@Component({
    selector: 'height-field-spheres',
    standalone: true,
    templateUrl: 'height-field-spheres.html',
    imports: [NgtArgs],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class HeightFieldSpheres extends NgtSignalStore<{ columns: number; rows: number; spread: number }> {
    @Input() set columns(columns: number) {
        this.set({ columns });
    }

    @Input() set rows(rows: number) {
        this.set({ rows });
    }

    @Input() set spread(spread: number) {
        this.set({ spread });
    }

    readonly #columns = this.select('columns');
    readonly #rows = this.select('rows');
    readonly #spread = this.select('spread');

    readonly sphereBody = injectSphere<THREE.InstancedMesh>((index) => ({
        args: [0.2],
        mass: 1,
        position: [
            ((index % this.#columns()) - (this.#columns() - 1) / 2) * this.#spread(),
            2.0,
            (Math.floor(index / this.#columns()) - (this.#rows() - 1) / 2) * this.#spread(),
        ],
    }));

    readonly number = computed(() => this.#columns() * this.#rows());
    readonly colors = computed(() => new Float32Array(this.number() * 3));

    constructor() {
        super({ columns: 0, rows: 0, spread: 0 });
        effect(() => {
            const colors = this.colors();
            const number = this.number();
            const color = new THREE.Color();

            for (let i = 0; i < number; i++) {
                color
                    .set(niceColors[17][Math.floor(Math.random() * 5)])
                    .convertSRGBToLinear()
                    .toArray(colors, i * 3);
            }
        });
    }
}

@Component({
    selector: 'height-map-geometry',
    standalone: true,
    template: ` <ngt-buffer-geometry #geometry /> `,
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class HeightMapGeometry extends NgtSignalStore<{
    heights: number[][];
    elementSize: number;
    geometry: THREE.BufferGeometry;
}> {
    @Input() set elementSize(elementSize: number) {
        this.set({ elementSize });
    }

    @Input() set heights(heights: number[][]) {
        this.set({ heights });
    }

    @ViewChild('geometry', { static: true }) set geometry(geometry: ElementRef<THREE.BufferGeometry>) {
        this.set({ geometry: geometry.nativeElement });
    }

    readonly #heights = this.select('heights');
    readonly #geometry = this.select('geometry');

    constructor() {
        super();
        effect(() => {
            const heights = this.#heights();
            const geometry = this.#geometry();
            if (!heights || !geometry) return;

            const elementSize = this.get('elementSize');

            const dx = elementSize;
            const dy = elementSize;

            /* create the vertex data from heights */
            const vertices = heights.flatMap((row, i) => row.flatMap((z, j) => [i * dx, j * dy, z]));

            /* create the faces */
            const indices = [];
            for (let i = 0; i < heights.length - 1; i++) {
                for (let j = 0; j < heights[i].length - 1; j++) {
                    const stride = heights[i].length;
                    const index = i * stride + j;
                    indices.push(index + 1, index + stride, index + stride + 1);
                    indices.push(index + stride, index + 1, index);
                }
            }

            geometry.setIndex(indices);
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
            geometry.computeVertexNormals();
            geometry.computeBoundingBox();
            geometry.computeBoundingSphere();
        });
    }
}

@Component({
    selector: 'height-field',
    standalone: true,
    templateUrl: 'height-field.html',
    imports: [HeightMapGeometry],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class Field extends NgtSignalStore<{ heights: number[][]; elementSize: number; position: Triplet; rotation: Triplet }> {
    @Input() set elementSize(elementSize: number) {
        this.set({ elementSize });
    }

    @Input() set heights(heights: number[][]) {
        this.set({ heights });
    }

    @Input() set position(position: Triplet) {
        this.set({ position });
    }

    @Input() set rotation(rotation: Triplet) {
        this.set({ rotation });
    }

    readonly color = niceColors[17][4];

    readonly fieldHeights = this.select('heights');
    readonly fieldElementSize = this.select('elementSize');
    readonly #position = this.select('position');
    readonly #rotation = this.select('rotation');

    readonly fieldBody = injectHeightfield<THREE.Mesh>(() => ({
        args: [this.fieldHeights(), { elementSize: this.fieldElementSize() }],
        position: this.#position(),
        rotation: this.#rotation(),
    }));

    constructor() {
        super({ elementSize: 0, position: [0, 0, 0], rotation: [0, 0, 0], heights: [] });
    }
}

@Component({
    standalone: true,
    templateUrl: 'scene.html',
    imports: [NgtsOrbitControls, NgtcPhysics, Field, HeightFieldSpheres, NgtArgs],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class SceneGraph {
    readonly Math = Math;
    readonly scale = 10;
    readonly heights = generateHeightmap({ height: 128, width: 128, number: 10, scale: 1 });
}

@Component({
    standalone: true,
    templateUrl: 'index.html',
    imports: [NgtCanvas],
})
export default class HeightField {
    readonly scene = SceneGraph;
}
