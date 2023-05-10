import { Component, Input, computed } from '@angular/core';
import { injectNgtRef } from 'angular-three';
import * as THREE from 'three';
import type { Line2 } from 'three-stdlib';
import { NgtsLine } from '../line/line';
import { NgtsLineInputs } from '../line/line-input';

declare module '../line/line-input' {
    interface NgtsLineState {
        start: THREE.Vector3 | [number, number, number];
        end: THREE.Vector3 | [number, number, number];
        midA: THREE.Vector3 | [number, number, number];
        midB: THREE.Vector3 | [number, number, number];
    }
}

@Component({
    selector: 'ngts-cubic-bezier-line',
    standalone: true,
    template: `
        <ngts-line
            [lineRef]="lineRef"
            [points]="points()"
            [color]="lineParameters().color"
            [vertexColors]="lineParameters().vertexColors"
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
})
export class NgtsCubicBezierLine extends NgtsLineInputs {
    @Input() lineRef = injectNgtRef<Line2>();

    @Input({ required: true }) set start(start: THREE.Vector3 | [number, number, number]) {
        this.set({ start });
    }

    @Input({ required: true }) set end(end: THREE.Vector3 | [number, number, number]) {
        this.set({ end });
    }

    @Input({ required: true }) set midA(midA: THREE.Vector3 | [number, number, number]) {
        this.set({ midA });
    }

    @Input({ required: true }) set midB(midB: THREE.Vector3 | [number, number, number]) {
        this.set({ midB });
    }

    @Input() set segments(segments: number) {
        this.set({ segments });
    }

    readonly points = computed(() => {
        const start = this.select('start')();
        const end = this.select('end')();
        const midA = this.select('midA')();
        const midB = this.select('midB')();
        const segments = this.select('segments')() as number;

        const startV = start instanceof THREE.Vector3 ? start : new THREE.Vector3(...start);
        const endV = end instanceof THREE.Vector3 ? end : new THREE.Vector3(...end);
        const midAV = midA instanceof THREE.Vector3 ? midA : new THREE.Vector3(...midA);
        const midBV = midB instanceof THREE.Vector3 ? midB : new THREE.Vector3(...midB);
        return new THREE.CubicBezierCurve3(startV, midAV, midBV, endV).getPoints(segments);
    });

    constructor() {
        super();
        this.set({ segments: 10 });
    }
}
