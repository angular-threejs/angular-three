import { Component, Input, computed, effect } from '@angular/core';
import { injectNgtRef } from 'angular-three';
import * as THREE from 'three';
import { Line2 } from 'three-stdlib';
import { NgtsLine } from '../line/line';
import { NgtsLineInputs } from '../line/line-input';

declare module '../line/line-input' {
    interface NgtsLineState {
        start: THREE.Vector3 | [number, number, number];
        end: THREE.Vector3 | [number, number, number];
        mid?: THREE.Vector3 | [number, number, number];
    }
}

const v = new THREE.Vector3();

@Component({
    selector: 'ngts-quadratic-bezier-line',
    standalone: true,
    template: `
        <ngts-line
            [lineRef]="lineRef"
            [points]="points()"
            [color]="lineParameters().color!"
            [vertexColors]="lineParameters().vertexColors!"
            [resolution]="lineParameters().resolution!"
            [lineWidth]="lineParameters().linewidth!"
            [alphaToCoverage]="lineParameters().alphaToCoverage!"
            [dashed]="lineParameters().dashed!"
            [dashScale]="lineParameters().dashScale!"
            [dashSize]="lineParameters().dashSize!"
            [dashOffset]="lineParameters().dashOffset!"
            [gapSize]="lineParameters().gapSize!"
            [wireframe]="lineParameters().wireframe!"
            [worldUnits]="lineParameters().worldUnits!"
        />
    `,
    imports: [NgtsLine],
})
export class NgtsQuadraticBezierLine extends NgtsLineInputs {
    readonly curve = new THREE.QuadraticBezierCurve3(undefined!, undefined!, undefined!);

    @Input() lineRef = injectNgtRef<Line2>();

    @Input() set start(start: THREE.Vector3 | [number, number, number]) {
        this.set({ start });
    }

    @Input() set end(end: THREE.Vector3 | [number, number, number]) {
        this.set({ end });
    }

    @Input() set mid(mid: THREE.Vector3 | [number, number, number]) {
        this.set({ mid });
    }

    @Input() set segments(segments: number) {
        this.set({ segments });
    }

    readonly #start = this.select('start');
    readonly #end = this.select('end');
    readonly #mid = this.select('mid');
    readonly #segments = this.select('segments');
    readonly points = computed(() =>
        this.#getPoints(this.#start(), this.#end(), this.#mid(), this.#segments() as number)
    );

    constructor() {
        super();
        this.set({ start: [0, 0, 0], end: [0, 0, 0], segments: 20 });
        this.#replaceSetPoints();
    }

    #replaceSetPoints() {
        effect(() => {
            const line = this.lineRef.nativeElement;
            if (!line) return;
            (
                line as unknown as {
                    setPoints: (
                        start: THREE.Vector3 | [number, number, number],
                        end: THREE.Vector3 | [number, number, number],
                        mid: THREE.Vector3 | [number, number, number]
                    ) => void;
                }
            ).setPoints = (start, end, mid) => {
                const points = this.#getPoints(start, end, mid);
                if (line.geometry) {
                    line.geometry.setPositions(points.map((p) => p.toArray()).flat());
                }
            };
        });
    }

    #getPoints(
        start: THREE.Vector3 | [number, number, number],
        end: THREE.Vector3 | [number, number, number],
        mid?: THREE.Vector3 | [number, number, number],
        segments = 20
    ) {
        if (start instanceof THREE.Vector3) this.curve.v0.copy(start);
        else this.curve.v0.set(...(start as [number, number, number]));
        if (end instanceof THREE.Vector3) this.curve.v2.copy(end);
        else this.curve.v2.set(...(end as [number, number, number]));
        if (mid instanceof THREE.Vector3) {
            this.curve.v1.copy(mid);
        } else {
            this.curve.v1.copy(
                this.curve.v0
                    .clone()
                    .add(this.curve.v2.clone().sub(this.curve.v0))
                    .add(v.set(0, this.curve.v0.y - this.curve.v2.y, 0))
            );
        }
        return this.curve.getPoints(segments);
    }
}
