import { CUSTOM_ELEMENTS_SCHEMA, Component, Injector, Input, computed, effect, inject } from '@angular/core';
import { NgtArgs, NgtStore, injectNgtRef } from 'angular-three';
import * as THREE from 'three';
import { Line2, LineGeometry, LineMaterial, LineSegments2, LineSegmentsGeometry } from 'three-stdlib';
import { NgtsLineInputs, type NgtsLineState } from './line-input';

declare global {
    interface HTMLElementTagNameMap {
        'ngts-line': NgtsLineState;
    }
}

@Component({
    selector: 'ngts-line',
    standalone: true,
    template: `
        <ngt-primitive *args="[line()]" [ref]="lineRef" ngtCompound>
            <ngt-primitive *args="[lineGeometry()]" attach="geometry" />
            <ngt-primitive
                *args="[lineMaterial]"
                attach="material"
                [resolution]="lineMaterialParameters().resolution"
                [color]="lineMaterialParameters().color"
                [vertexColors]="lineMaterialParameters().vertexColors"
                [linewidth]="lineMaterialParameters().linewidth"
                [alphaToCoverage]="lineMaterialParameters().alphaToCoverage"
                [dashed]="lineMaterialParameters().dashed"
                [dashScale]="lineMaterialParameters().dashScale"
                [dashSize]="lineMaterialParameters().dashSize"
                [dashOffset]="lineMaterialParameters().dashOffset"
                [gapSize]="lineMaterialParameters().gapSize"
                [wireframe]="lineMaterialParameters().wireframe"
                [worldUnits]="lineMaterialParameters().worldUnits"
            />
        </ngt-primitive>
    `,
    imports: [NgtArgs],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsLine extends NgtsLineInputs {
    @Input() lineRef = injectNgtRef<LineSegments2 | Line2>();

    @Input() set points(
        points: Array<THREE.Vector3 | THREE.Vector2 | [number, number, number] | [number, number] | number>
    ) {
        this.set({ points });
    }

    @Input() set segments(segments: boolean) {
        this.set({ segments });
    }

    readonly #injector = inject(Injector);
    readonly #store = inject(NgtStore);

    readonly #resolution = computed(() => {
        const size = this.#store.select('size');
        const resolution = this.select('resolution');

        return resolution() ? resolution() : [size().width, size().height];
    });

    readonly #pointValues = computed(() => {
        const points = this.select('points');
        return points().map((p) => {
            const isArray = Array.isArray(p);
            return p instanceof THREE.Vector3
                ? [p.x, p.y, p.z]
                : p instanceof THREE.Vector2
                ? [p.x, p.y, 0]
                : isArray && p.length === 3
                ? [p[0], p[1], p[2]]
                : isArray && p.length === 2
                ? [p[0], p[1], 0]
                : p;
        });
    });
    readonly #vertexColors = computed(() => {
        const vertexColors = this.select('vertexColors');
        return (vertexColors() || []).map((c) => (c instanceof THREE.Color ? c.toArray() : c));
    });

    readonly lineGeometry = computed(() => {
        const segments = this.select('segments');
        const pointValues = this.#pointValues();
        const vertexColors = this.#vertexColors();

        const geometry = segments() ? new LineSegmentsGeometry() : new LineGeometry();
        geometry.setPositions(pointValues.flat());

        if (vertexColors.length) {
            geometry.setColors(vertexColors.flat());
        }

        return geometry;
    });
    readonly lineMaterial = new LineMaterial();
    readonly line = computed(() => {
        const segments = this.select('segments');
        return segments() ? new LineSegments2() : new Line2();
    });

    readonly lineMaterialParameters = computed(() => {
        const parameters = this.lineParameters();
        const resolution = this.#resolution();

        return {
            ...parameters,
            vertexColors: Boolean(parameters.vertexColors),
            resolution,
            dashScale: parameters.dashScale ?? this.lineMaterial.dashScale,
            dashSize: parameters.dashSize ?? this.lineMaterial.dashSize,
            dashOffset: parameters.dashOffset ?? this.lineMaterial.dashOffset,
            gapSize: parameters.gapSize ?? this.lineMaterial.gapSize,
            wireframe: parameters.wireframe ?? this.lineMaterial.wireframe,
            worldUnits: parameters.worldUnits ?? this.lineMaterial.worldUnits,
        };
    });

    constructor() {
        super();
        this.set({ segments: false });
        this.#disposeGeometry();
        this.#computeLineDistances();
    }

    #computeLineDistances() {
        const trigger = computed(() => {
            const points = this.select('points');
            const lineGeometry = this.lineGeometry();
            const line = this.lineRef.nativeElement;
            const children = this.lineRef.children('nonObjects');
            return { points: points(), lineGeometry, line, children: children() };
        });
        effect(() => {
            const { line } = trigger();
            if (!line) return;
            line.computeLineDistances();
        });
    }

    #disposeGeometry() {
        effect(
            (onCleanup) => {
                const lineGeometry = this.lineGeometry();
                onCleanup(() => lineGeometry.dispose());
            },
            { injector: this.#injector }
        );
    }
}
