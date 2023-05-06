import { NgTemplateOutlet } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { NgtCanvas, extend } from 'angular-three';
import * as THREE from 'three';

extend(THREE);

@Component({
    selector: 'app-cube',
    standalone: true,
    template: `
        <ngt-mesh
            (beforeRender)="onBeforeRender($any($event).object)"
            (pointerover)="hover.set(true)"
            (pointerout)="hover.set(false)"
            (click)="active.set(!active())"
            [scale]="active() ? 1.5 : 1"
        >
            <ngt-box-geometry />
            <ngt-mesh-standard-material [color]="hover() ? 'hotpink' : 'orange'" />
        </ngt-mesh>
    `,
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Cube {
    hover = signal(false);
    active = signal(false);

    onBeforeRender(mesh: THREE.Mesh) {
        mesh.rotation.x += 0.01;
        mesh.rotation.y += 0.01;
    }
}

@Component({
    standalone: true,
    template: `
        <ngt-spot-light [position]="5" />
        <ngt-point-light [position]="-5" />
        <app-cube />
    `,
    imports: [Cube, NgTemplateOutlet],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Scene {}

@Component({
    standalone: true,
    imports: [NgtCanvas],
    selector: 'angular-three-root',
    template: ` <ngt-canvas [sceneGraph]="scene" />`,
})
export class AppComponent {
    readonly scene = Scene;
}
