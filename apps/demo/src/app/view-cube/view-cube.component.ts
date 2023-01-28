import { Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, inject, ViewChild } from '@angular/core';
import {
    extend,
    injectBeforeRender,
    NgtArgs,
    NgtCanvas,
    NgtPortal,
    NgtPortalContent,
    NgtPush,
    NgtRepeat,
    NgtRxStore,
    NgtStore,
    prepare,
} from 'angular-three';
import * as THREE from 'three';
import { OrbitControls } from 'three-stdlib';

extend({ OrbitControls });

@Component({
    selector: 'view-cube',
    standalone: true,
    template: `
        <ngt-portal [state]="{camera}">
            <ng-template ngtPortalContent>
                <ngt-mesh
                    #cube
                    [position]="position"
                    (pointerout)="hovered = -1"
                    (pointermove)="hovered = Math.floor(($any($event).faceIndex || 0) / 2)"
                >
                    <ngt-mesh-lambert-material
                        *ngFor="let i; repeat: 6"
                        [attach]="['material', i]"
                        [color]="hovered === i ? 'orange' : 'white'"
                    />
                    <ngt-box-geometry *args="[60, 60, 60]" />
                </ngt-mesh>
                <ngt-ambient-light [intensity]="1" />
                <ngt-point-light [position]="200" [intensity]="0.5" />
            </ng-template>
        </ngt-portal>
    `,
    imports: [NgtPortal, NgtPortalContent, NgtPush, NgtArgs, NgtRepeat],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ViewCube extends NgtRxStore {
    private readonly store = inject(NgtStore);
    readonly size = this.store.get('size');

    private readonly matrix = new THREE.Matrix4();

    readonly position = [this.size.width / 2 - 80, this.size.height / 2 - 80, 0];
    readonly Math = Math;

    @ViewChild('cube') cube?: ElementRef<THREE.Mesh>;

    readonly camera = prepare(() => {
        const size = this.size;
        const cam = new THREE.OrthographicCamera(size.width / -2, size.width / 2, size.height / 2, size.height / -2);
        cam.position.set(0, 0, 100);
        return cam;
    });

    hovered = -1;

    constructor() {
        super();
        injectBeforeRender(({ camera }) => {
            if (this.cube?.nativeElement) {
                this.matrix.copy(camera.matrix).invert();
                this.cube.nativeElement.quaternion.setFromRotationMatrix(this.matrix);
            }
        });
    }
}

@Component({
    selector: 'demo-view-cube-scene',
    standalone: true,
    template: `
        <ngt-ambient-light [intensity]="0.5" />
        <ngt-mesh [scale]="2">
            <ngt-torus-geometry *args="[1, 0.5, 32, 100]" />
            <ngt-mesh-normal-material />
        </ngt-mesh>
        <ngt-orbit-controls
            *args="[camera, glDom]"
            [enableDamping]="true"
            (beforeRender)="$any($event).object.update()"
        />
        <view-cube />
    `,
    imports: [ViewCube, NgtArgs],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Scene {
    private readonly store = inject(NgtStore);
    readonly camera = this.store.get('camera');
    readonly glDom = this.store.get('gl', 'domElement');
}

@Component({
    selector: 'demo-view-cube',
    standalone: true,
    template: ` <ngt-canvas [sceneGraph]="Scene" />`,
    imports: [NgtCanvas],
})
export default class SandboxViewCube {
    readonly Scene = Scene;
}
