import { NgIf } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, effect, Input } from '@angular/core';
import { extend, injectNgtRef, NgtAnyRecord, NgtSignalStore } from 'angular-three';
import * as THREE from 'three';
import { LineBasicMaterial, LineSegments } from 'three';

extend({ LineSegments, LineBasicMaterial });

export interface NgtsEdgesState {
    threshold: number;
    color: THREE.ColorRepresentation;
    geometry: THREE.BufferGeometry;
    userData: NgtAnyRecord;
}

@Component({
    selector: 'ngts-edges',
    standalone: true,
    template: `
        <ngt-line-segments [ref]="edgesRef" [raycast]="noop" ngtCompound>
            <ng-container *ngIf="withChildren; else noChildren">
                <ng-content />
            </ng-container>
            <ng-template #noChildren>
                <ngt-line-basic-material [color]="color" />
            </ng-template>
        </ngt-line-segments>
    `,
    imports: [NgIf],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsEdges extends NgtSignalStore<NgtsEdgesState> {
    @Input() edgesRef = injectNgtRef<THREE.LineSegments>();

    @Input() set threshold(threshold: number) {
        this.set({ threshold });
    }

    @Input() set color(color: THREE.ColorRepresentation) {
        this.set({ color });
    }

    @Input() set geometry(geometry: THREE.BufferGeometry) {
        this.set({ geometry });
    }

    @Input() set userData(userData: NgtAnyRecord) {
        this.set({ userData });
    }

    @Input() withChildren = false;

    readonly noop = () => null;

    constructor() {
        super({
            threshold: 15,
            color: 'black',
            userData: {},
        });
        this.#setupGeometry();
    }

    #setupGeometry(): void {
        effect(() => {
            const edges = this.edgesRef.nativeElement;
            if (!edges) return;
            const parent = edges.parent as THREE.Mesh;
            if (parent) {
                const geom = this.get('geometry') || parent.geometry;
                const threshold = this.get('threshold');
                if (geom !== edges.userData['currentGeom'] || threshold !== edges.userData['currentThreshold']) {
                    edges.userData['currentGeom'] = geom;
                    edges.userData['currentThreshold'] = threshold;
                    edges.geometry = new THREE.EdgesGeometry(geom, threshold);
                }
            }
        });
    }
}
