import { Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, Input, ViewChild } from '@angular/core';
import { injectBeforeRender, NgtArgs, NgtCanvas } from 'angular-three';
import * as THREE from 'three';
import { DemoOrbitControls } from '../ui-orbit-controls/orbit-controls.component';

@Component({
    selector: 'demo-cube',
    standalone: true,
    template: `
        <ngt-mesh
            #mesh
            (click)="active = !active"
            (pointerover)="hover = true"
            (pointerout)="hover = false"
            [scale]="active ? 1.5 : 1"
            [position]="position"
        >
            <ngt-box-geometry />
            <ngt-mesh-standard-material [color]="hover ? 'goldenrod' : 'darkred'" />
        </ngt-mesh>
    `,
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Cube {
    @Input() position = [0, 0, 0];

    active = false;
    hover = false;

    @ViewChild('mesh', { static: true }) mesh!: ElementRef<THREE.Mesh>;

    constructor() {
        injectBeforeRender(() => {
            const object = this.mesh.nativeElement;
            if (object) {
                object.rotation.x += 0.01;
                object.rotation.y += 0.01;
                object.rotation.z += 0.01;
            }
        });
    }
}

@Component({
    selector: 'demo-cubes-scene',
    standalone: true,
    template: `
        <ngt-color *args="['skyblue']" attach="background" />

        <ngt-ambient-light [intensity]="0.5" />
        <ngt-spot-light [intensity]="0.5" [position]="10" [angle]="0.15" [penumbra]="1" />
        <ngt-point-light [intensity]="0.5" [position]="-10" />

        <demo-cube [position]="[1.5, 0, 0]" />
        <demo-cube [position]="[-1.5, 0, 0]" />

        <demo-orbit-controls />
    `,
    imports: [NgtArgs, Cube, DemoOrbitControls],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Scene {}

@Component({
    standalone: true,
    template: `<ngt-canvas [sceneGraph]="Scene" />`,
    imports: [NgtCanvas],
})
export default class DemoCubes {
    readonly Scene = Scene;
}
