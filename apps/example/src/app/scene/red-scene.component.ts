import { Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, inject, ViewChild } from '@angular/core';
import { injectBeforeRender, NgtStore } from 'angular-three';

@Component({
    standalone: true,
    template: `
        <ngt-point-light [position]="5" />
        <ngt-spot-light [position]="-5" />

        <ngt-mesh #cube>
            <ngt-box-geometry />
            <ngt-mesh-standard-material color="red" />
        </ngt-mesh>
    `,
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export default class RedScene {
    @ViewChild('cube', { static: true }) cube!: ElementRef<THREE.Mesh>;

    readonly store = inject(NgtStore);

    constructor() {
        injectBeforeRender(({ clock }) => {
            this.cube.nativeElement.rotation.x = clock.elapsedTime;
            this.cube.nativeElement.rotation.y = clock.elapsedTime;
        });
        console.log(this.store.get('scene'));
    }

    ngOnDestroy() {
        console.log('red destroyed');
    }
}
