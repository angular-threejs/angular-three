import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { NgtArgs } from 'angular-three';
import * as THREE from 'three';
import { CursorPointer } from './cursor';

@Component({
    standalone: true,
    template: `
        <ngt-point-light [position]="5" />
        <ngt-spot-light [position]="-5" />

        <ngt-mesh
            #mesh
            cursorPointer
            [scale]="0.1"
            (beforeRender)="onBeforeRender($any($event).object)"
            (pointerover)="hovered = true"
            (pointerout)="hovered = false"
            (click)="wireframe = !wireframe"
        >
            <ngt-extrude-geometry *args="[shape, extrudeSettings]" (afterAttach)="$any($event).node.center()" />
            <ngt-mesh-standard-material [color]="hovered ? 'goldenrod' : 'navy'" [wireframe]="wireframe" />
        </ngt-mesh>
    `,
    imports: [NgtArgs, CursorPointer],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export default class ExtrudeScene {
    shape = new THREE.Shape();
    readonly extrudeSettings = {
        steps: 2,
        depth: 16,
        bevelEnabled: true,
        bevelThickness: 1,
        bevelSize: 1,
        bevelOffset: 0,
        bevelSegments: 1,
    };

    hovered = false;
    wireframe = false;

    constructor() {
        this.shape.moveTo(0, 0);
        this.shape.lineTo(0, 8);
        this.shape.lineTo(12, 8);
        this.shape.lineTo(12, 0);
        this.shape.lineTo(0, 0);
    }

    onBeforeRender(object: THREE.Mesh) {
        object.rotation.x += 0.01;
        object.rotation.y += 0.01;
    }
}
