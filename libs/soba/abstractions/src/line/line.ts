import { CUSTOM_ELEMENTS_SCHEMA, Component, Input, computed, effect, inject } from '@angular/core';
import { NgtArgs, NgtStore, injectNgtRef, requestAnimationFrameInInjectionContext } from 'angular-three';
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

    @Input({ required: true }) set points(
        points: Array<THREE.Vector3 | THREE.Vector2 | [number, number, number] | [number, number] | number>
    ) {
        this.set({ points });
    }

    @Input() set segments(segments: boolean) {
        this.set({ segments });
    }

    readonly #store = inject(NgtStore);
    readonly #size = this.#store.select('size');

    readonly #lineResolution = this.select('resolution');
    readonly #resolution = computed(() =>
        this.#lineResolution() ? this.#lineResolution() : [this.#size().width, this.#size().height]
    );

    readonly #points = this.select('points');
    readonly #pointValues = computed(() =>
        this.#points().map((p) => {
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
        })
    );

    readonly #vertexColors = this.select('vertexColors');
    readonly #vertexColorValues = computed(() =>
        (this.#vertexColors() || []).map((c) => (c instanceof THREE.Color ? c.toArray() : c))
    );

    readonly #segments = this.select('segments');
    readonly lineGeometry = computed(() => {
        const pointValues = this.#pointValues();
        const vertexColors = this.#vertexColorValues();

        const geometry = this.#segments() ? new LineSegmentsGeometry() : new LineGeometry();
        geometry.setPositions(pointValues.flat());

        if (vertexColors.length) {
            geometry.setColors(vertexColors.flat());
        }

        return geometry;
    });
    readonly lineMaterial = new LineMaterial();
    readonly line = computed(() => (this.#segments() ? new LineSegments2() : new Line2()));

    readonly lineMaterialParameters = computed(() => {
        const parameters = this.lineParameters();
        const resolution = this.#resolution();

        const vertexColors = Boolean(parameters.vertexColors);

        if (vertexColors) {
            parameters.color = undefined!;
        }

        return {
            ...parameters,
            vertexColors,
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
        requestAnimationFrameInInjectionContext(() => {
            this.#disposeGeometry();
            this.#computeLineDistances();
        });
    }

    #computeLineDistances() {
        const points = this.select('points');
        const trigger = computed(() => {
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
        effect((onCleanup) => {
            const lineGeometry = this.lineGeometry();
            onCleanup(() => lineGeometry.dispose());
        });
    }
}
