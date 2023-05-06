import { Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, inject, ViewChild } from '@angular/core';
import { injectBeforeRender, NgtStore } from 'angular-three-backup';
import { CursorPointer } from './cursor';

@Component({
    standalone: true,
    template: `
        <ngt-point-light [position]="5" />
        <ngt-spot-light [position]="-5" />

        <ngt-mesh
            #cube
            cursorPointer
            (pointerover)="hovered = true"
            (pointerout)="hovered = false"
            (click)="wireframe = !wireframe"
        >
            <ngt-box-geometry />
            <ngt-mesh-standard-material [color]="hovered ? 'yellow' : 'red'" [wireframe]="wireframe" />
        </ngt-mesh>
    `,
    imports: [CursorPointer],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export default class RedScene {
    @ViewChild('cube', { static: true }) cube!: ElementRef<THREE.Mesh>;

    hovered = false;
    wireframe = false;

    constructor() {
        injectBeforeRender(({ clock }) => {
            this.cube.nativeElement.rotation.x = clock.elapsedTime;
            this.cube.nativeElement.rotation.y = clock.elapsedTime;
        });
        console.log('red instantiated', inject(NgtStore).get('scene'));
    }

    ngOnDestroy() {
        console.log('red destroyed');
    }
}
