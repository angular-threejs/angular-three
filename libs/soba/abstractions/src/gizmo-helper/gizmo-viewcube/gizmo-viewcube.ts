import { NgFor } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, EventEmitter, Output } from '@angular/core';
import { extend, NgtThreeEvent, requestAnimationInInjectionContext } from 'angular-three';
import { AmbientLight, Group, PointLight } from 'three';
import { cornerDimensions, corners, edgeDimensions, edges } from './constants';
import { NgtsGizmoViewcubeEdgeCube } from './gizmo-viewcube-edge';
import { NgtsGizmoViewcubeFaceCube } from './gizmo-viewcube-face';
import { NgtsGizmoViewcubeInputs } from './gizmo-viewcube-inputs';

extend({ Group, AmbientLight, PointLight });

@Component({
    selector: 'ngts-gizmo-viewcube',
    standalone: true,
    template: `
        <ngt-group [scale]="60">
            <ngts-gizmo-viewcube-face-cube />

            <ngts-gizmo-viewcube-edge-cube
                *ngFor="let edge of edges; let i = index"
                [position]="edge"
                [dimensions]="edgeDimensions[i]"
            />

            <ngts-gizmo-viewcube-edge-cube
                *ngFor="let corner of corners"
                [position]="corner"
                [dimensions]="cornerDimensions"
            />

            <ngt-ambient-light [intensity]="0.5" />
            <ngt-point-light [position]="10" [intensity]="0.5" />
        </ngt-group>
    `,
    imports: [NgtsGizmoViewcubeEdgeCube, NgtsGizmoViewcubeFaceCube, NgFor],
    providers: [{ provide: NgtsGizmoViewcubeInputs, useExisting: NgtsGizmoViewcube }],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsGizmoViewcube extends NgtsGizmoViewcubeInputs {
    readonly edges = edges;
    readonly edgeDimensions = edgeDimensions;

    readonly corners = corners;
    readonly cornerDimensions = cornerDimensions;

    @Output() clicked = new EventEmitter<NgtThreeEvent<MouseEvent>>();

    constructor() {
        super();
        requestAnimationInInjectionContext(() => {
            if (this.clicked.observed) {
                this.set({ clickEmitter: this.clicked });
            }
        });
    }
}
