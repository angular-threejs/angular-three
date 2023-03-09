import { Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, inject, ViewChild } from '@angular/core';
import { injectBeforeRender, NgtStore } from 'angular-three';
import { CursorPointer } from './cursor';

@Component({
    standalone: true,
    template: `
        <ngt-spot-light [position]="5" />
        <ngt-point-light [position]="-5" />

        <ngt-mesh #cube cursorPointer (pointerover)="hovered = true" (pointerout)="hovered = false">
            <ngt-icosahedron-geometry />
            <ngt-mesh-standard-material [color]="hovered ? 'green' : 'blue'" />
        </ngt-mesh>
    `,
    imports: [CursorPointer],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export default class BlueScene {
    @ViewChild('cube', { static: true }) cube!: ElementRef<THREE.Mesh>;

    readonly store = inject(NgtStore);

    hovered = false;

    constructor() {
        injectBeforeRender(({ clock }) => {
            this.cube.nativeElement.rotation.x = clock.elapsedTime;
            this.cube.nativeElement.rotation.y = clock.elapsedTime;
        });
        console.log('blue instantiated', this.store.get('scene'));
    }

    ngOnDestroy() {
        console.log('blue destroyed');
    }
}
