import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { NgtArgs, NgtBeforeRenderEvent } from 'angular-three';

@Component({
    selector: 'demo-test-scene',
    standalone: true,
    template: `
        <ngt-mesh (beforeRender)="onBeforeRender($any($event))">
            <ngt-box-geometry *args="[2, 2, 2]" />
            <ngt-mesh-basic-material color="goldenrod" />
        </ngt-mesh>
    `,
    imports: [NgtArgs],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Scene {
    onBeforeRender({ object }: NgtBeforeRenderEvent<THREE.Mesh>) {
        object.rotation.x += 0.01;
        object.rotation.y += 0.01;
    }
}
