import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { NgtBeforeRenderEvent, NgtCanvas } from 'angular-three';

@Component({
    selector: 'demo-test-scene',
    standalone: true,
    template: `
        <ngt-mesh
            (click)="active = !active"
            (pointerover)="hover = true"
            (pointerout)="hover = false"
            [scale]="active ? 1.5 : 1"
            (beforeRender)="onBeforeRender($any($event))"
        >
            <ngt-box-geometry />
            <ngt-mesh-basic-material [color]="hover ? 'goldenrod' : 'darkred'" />
        </ngt-mesh>
    `,
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Scene {
    active = false;
    hover = false;

    onBeforeRender({ object }: NgtBeforeRenderEvent<THREE.Mesh>) {
        object.rotation.x += 0.01;
        object.rotation.y += 0.01;
    }
}

@Component({
    selector: 'demo-test',
    standalone: true,
    template: `<ngt-canvas [sceneGraph]="Scene" />`,
    imports: [NgtCanvas],
})
export default class DemoTest {
    readonly Scene = Scene;
}
