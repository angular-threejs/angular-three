import { Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, ViewChild } from '@angular/core';
import { extend, injectBeforeRender, NgtCanvas } from 'angular-three';
import * as THREE from 'three';

extend(THREE);

@Component({
    standalone: true,
    template: `
        <ngt-mesh #cube>
            <ngt-box-geometry />
            <ngt-mesh-basic-material color="red" />
        </ngt-mesh>
    `,
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Scene {
    @ViewChild('cube', { static: true }) cube!: ElementRef<THREE.Mesh>;

    constructor() {
        injectBeforeRender(({ clock }) => {
            this.cube.nativeElement.rotation.x = clock.elapsedTime;
            this.cube.nativeElement.rotation.y = clock.elapsedTime;
        });
    }
}

@Component({
    standalone: true,
    selector: 'angular-three-root',
    template: ` <ngt-canvas [sceneGraph]="scene" /> `,
    imports: [NgtCanvas],
})
export class AppComponent {
    readonly scene = Scene;
}
