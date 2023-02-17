import { Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, ViewChild } from '@angular/core';
import { injectBeforeRender } from 'angular-three';

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
export default class RedScene {
    @ViewChild('cube', { static: true }) cube!: ElementRef<THREE.Mesh>;

    constructor() {
        injectBeforeRender(({ clock }) => {
            this.cube.nativeElement.rotation.x = clock.elapsedTime;
            this.cube.nativeElement.rotation.y = clock.elapsedTime;
        });
    }
}
