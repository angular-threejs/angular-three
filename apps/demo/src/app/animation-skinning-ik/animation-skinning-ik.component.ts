import { NgIf } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, inject, ViewChild } from '@angular/core';
import {
    extend,
    injectNgtLoader,
    NgtArgs,
    NgtBeforeRenderEvent,
    NgtCanvas,
    NgtPush,
    NgtState,
    NgtStore,
} from 'angular-three';
import { map } from 'rxjs';
import * as THREE from 'three';
import { CCDIKHelper, DRACOLoader, GLTFLoader, TransformControls } from 'three-stdlib';
import { DemoOrbitControls } from '../ui-orbit-controls/orbit-controls.component';
import { AnimationSkinningIKStore } from './animation-skinning-ik.store';

extend({ TransformControls, CCDIKHelper });

@Component({
    selector: 'demo-ik-helper',
    standalone: true,
    template: `
        <ng-container *ngIf="(ooi$ | ngtPush).kira as kira">
            <ngt-cCDIK-helper *args="[kira, iks, 0.01]" (beforeRender)="onBeforeRender()" />
        </ng-container>
    `,
    imports: [NgtArgs, NgIf, NgtPush],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class IKHelper {
    private readonly ikStore = inject(AnimationSkinningIKStore);
    readonly iks = this.ikStore.iks;
    readonly ooi$ = this.ikStore.select('OOI');

    onBeforeRender() {
        this.ikStore.solver.update();
    }
}

@Component({
    selector: 'demo-sphere-camera',
    standalone: true,
    template: `
        <ngt-cube-camera *args="[0.05, 50, cubeRenderTarget]" (beforeRender)="onBeforeRender($any($event))" />
    `,
    imports: [NgtArgs],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SphereCamera {
    private readonly ikStore = inject(AnimationSkinningIKStore);
    readonly cubeRenderTarget = this.ikStore.get('cubeRenderTarget');

    onBeforeRender({ object, state: { gl, scene } }: NgtBeforeRenderEvent<THREE.CubeCamera>) {
        const sphere = this.ikStore.OOI.sphere;
        if (sphere) {
            sphere.visible = false;
            sphere.getWorldPosition(object.position);
            object.update(gl, scene);
            sphere.visible = true;
        }
    }
}

@Component({
    selector: 'demo-kira',
    standalone: true,
    template: `
        <ngt-primitive
            *args="[model$ | ngtPush : null]"
            (afterAttach)="onAfterAttach()"
            (beforeRender)="onBeforeRender()"
        />
    `,
    imports: [NgtArgs, NgtPush],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Kira {
    private readonly ikStore = inject(AnimationSkinningIKStore);
    readonly v0 = new THREE.Vector3();

    readonly model$ = injectNgtLoader(
        () => GLTFLoader,
        'assets/kira.glb',
        (loader) => {
            const dracoLoader = new DRACOLoader();
            dracoLoader.setDecoderPath('assets/draco/');
            (loader as GLTFLoader).setDRACOLoader(dracoLoader);
        }
    ).pipe(
        map((gltf) => {
            const ooi: Record<string, THREE.Object3D> = {};
            gltf.scene.traverse((n) => {
                if (n.name === 'head') ooi['head'] = n;
                if (n.name === 'lowerarm_l') ooi['lowerarm_l'] = n;
                if (n.name === 'Upperarm_l') ooi['Upperarm_l'] = n;
                if (n.name === 'hand_l') ooi['hand_l'] = n;
                if (n.name === 'target_hand_l') ooi['target_hand_l'] = n;
                if (n.name === 'boule') ooi['sphere'] = n;
                if (n.name === 'Kira_Shirt_left') ooi['kira'] = n;
                if ((n as THREE.Mesh).isMesh) n.frustumCulled = false;
            });
            this.ikStore.set({ OOI: ooi });
            return gltf.scene;
        })
    );

    onAfterAttach() {
        this.ikStore.kiraReady();
    }

    onBeforeRender() {
        const head = this.ikStore.OOI.head;
        const sphere = this.ikStore.OOI.sphere;
        if (head && sphere) {
            sphere.getWorldPosition(this.v0);
            head.lookAt(this.v0);
            head.rotation.set(head.rotation.x, head.rotation.y + Math.PI, head.rotation.z);
        }
    }
}

@Component({
    standalone: true,
    template: `
        <ngt-color *args="['#dddddd']" attach="background" />
        <ngt-fog-exp2 *args="['#ffffff', 0.17]" attach="fog" />

        <ngt-ambient-light [intensity]="8" color="#ffffff" />

        <demo-kira />
        <demo-sphere-camera />
        <demo-ik-helper />

        <demo-orbit-controls
            [minDistance]="0.2"
            [maxDistance]="1.5"
            (ready)="ikStore.set({ orbitControls: $any($event) })"
        />

        <ngt-transform-controls
            #transformControls
            *args="[camera, glDom]"
            [size]="0.75"
            [showX]="false"
            space="world"
        />
    `,
    imports: [NgtArgs, DemoOrbitControls, Kira, SphereCamera, IKHelper],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Scene {
    readonly ikStore = inject(AnimationSkinningIKStore);
    private readonly store = inject(NgtStore);
    readonly camera = this.store.get('camera');
    readonly glDom = this.store.get('gl', 'domElement');

    @ViewChild('transformControls') set transformControls({ nativeElement }: ElementRef<TransformControls>) {
        this.ikStore.set({ transformControls: nativeElement });
        nativeElement.addEventListener('mouseDown', () => (this.ikStore.orbitControls.enabled = false));
        nativeElement.addEventListener('mouseUp', () => (this.ikStore.orbitControls.enabled = true));
    }
}

@Component({
    standalone: true,
    template: `
        <ngt-canvas
            [sceneGraph]="SceneGraph"
            [camera]="{
                fov: 55,
                near: 0.001,
                far: 5000,
                position: [0.9728517749133652, 1.1044765132727201, 0.7316689528482836]
            }"
            [gl]="{ logarithmicDepthBuffer: true }"
            (created)="onCreated($event)"
        />
    `,
    providers: [AnimationSkinningIKStore],
    imports: [NgtCanvas],
})
export default class DemoAnimationSkinningIK {
    readonly SceneGraph = Scene;

    onCreated({ scene, camera, gl }: NgtState) {
        camera.lookAt(scene.position);
        gl.physicallyCorrectLights = true;
    }
}
