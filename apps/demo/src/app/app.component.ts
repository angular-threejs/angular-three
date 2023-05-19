import { NgIf } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, Component, Signal } from '@angular/core';
import { NgtArgs, NgtBeforeRenderEvent, NgtCanvas, extend } from 'angular-three';
import { NgtpEffectComposer } from 'angular-three-postprocessing';
import { NgtpBloom, NgtpDotScreen } from 'angular-three-postprocessing/effects';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import { injectNgtsGLTFLoader } from 'angular-three-soba/loaders';
import * as THREE from 'three';
import { GLTF } from 'three-stdlib';

extend(THREE);

interface KeenGLTF extends GLTF {
    nodes: { mesh_0: THREE.Mesh };
    materials: { 'Scene_-_Root': THREE.MeshStandardMaterial };
}

@Component({
    standalone: true,
    template: `
        <ngt-color *args="['black']" attach="background" />

        <ngt-ambient-light />
        <ngt-directional-light [position]="[0, 1, 2]" />

        <ngt-group
            *ngIf="keen() as keen"
            [position]="[0, -7, 0]"
            [rotation]="[-Math.PI / 2, 0, 0]"
            (beforeRender)="onBeforeRender($event)"
        >
            <ngt-mesh [material]="keen.materials['Scene_-_Root']" [geometry]="keen.nodes['mesh_0'].geometry" />
        </ngt-group>

        <ngtp-effect-composer>
            <ngtp-bloom [intensity]="5" />
            <ngtp-dot-screen [scale]="3" />
        </ngtp-effect-composer>

        <ngts-orbit-controls />
    `,
    imports: [NgtpEffectComposer, NgtpBloom, NgtpDotScreen, NgIf, NgtArgs, NgtsOrbitControls],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Scene {
    readonly Math = Math;
    readonly keen = injectNgtsGLTFLoader(() => 'assets/scene.gltf') as Signal<KeenGLTF>;

    onBeforeRender({ object, state: { clock } }: NgtBeforeRenderEvent<THREE.Group>) {
        object.rotation.z = clock.elapsedTime;
    }
}

@Component({
    standalone: true,
    imports: [NgtCanvas],
    selector: 'angular-three-root',
    template: ` <ngt-canvas [sceneGraph]="scene" [camera]="{ position: [0, 0, 15], near: 5, far: 20 }" />`,
})
export class AppComponent {
    readonly scene = Scene;
}
