import { Component, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { injectBeforeRender, injectNgtLoader, NgtArgs, NgtCanvas, NgtPush, NgtStore } from 'angular-three';
import { map } from 'rxjs';
import * as THREE from 'three';
import { DRACOLoader, GLTFLoader, RoomEnvironment } from 'three-stdlib';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { DemoOrbitControls } from '../ui-orbit-controls/orbit-controls.component';

@Component({
    standalone: true,
    template: `
        <ngt-color *args="['#bfe3dd']" attach="background" />
        <ngt-value [rawValue]="texture" attach="environment" />

        <ngt-primitive *args="[model$ | ngtPush]" [position]="[1, 1, 0]" [scale]="0.01" />

        <demo-orbit-controls [target]="[0, 0.5, 0]" [enablePan]="false" />
    `,
    imports: [NgtArgs, NgtPush, DemoOrbitControls],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Scene {
    private readonly stats = Stats();
    private readonly gl = inject(NgtStore).get('gl');
    private readonly pmremGenerator = new THREE.PMREMGenerator(this.gl);

    readonly texture = this.pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

    private mixer?: THREE.AnimationMixer;

    readonly model$ = injectNgtLoader(
        () => GLTFLoader,
        'assets/LittlestTokyo.glb',
        (loader) => {
            const dracoLoader = new DRACOLoader();
            dracoLoader.setDecoderPath('assets/draco/');
            (loader as GLTFLoader).setDRACOLoader(dracoLoader);
        }
    ).pipe(
        map((model) => {
            const scene = model.scene;
            this.mixer = new THREE.AnimationMixer(scene);
            this.mixer.clipAction(model.animations[0]).play();
            return scene;
        })
    );

    constructor() {
        injectBeforeRender(({ delta }) => {
            this.mixer?.update(delta);
            this.stats.update();
        });
        this.gl.domElement.parentElement?.appendChild(this.stats.dom);
    }
}

@Component({
    standalone: true,
    template: ` <ngt-canvas [sceneGraph]="SceneGraph" [camera]="{ fov: 40, far: 100, position: [5, 2, 8] }" /> `,
    imports: [NgtCanvas],
})
export default class DemoAnimationKeyframes {
    readonly SceneGraph = Scene;
}
