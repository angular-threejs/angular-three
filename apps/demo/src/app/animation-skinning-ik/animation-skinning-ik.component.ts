import { NgIf } from '@angular/common';
import { ChangeDetectorRef, Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, inject, ViewChild } from '@angular/core';
import {
    applyProps,
    extend,
    injectBeforeRender,
    injectNgtLoader,
    NgtArgs,
    NgtCanvas,
    NgtPush,
    NgtState,
    NgtStore,
} from 'angular-three';
import { map } from 'rxjs';
import * as THREE from 'three';
import { CCDIKHelper, CCDIKSolver, DRACOLoader, GLTFLoader, IKS, OrbitControls, TransformControls } from 'three-stdlib';
import { DemoOrbitControls } from '../ui-orbit-controls/orbit-controls.component';

const iks = [
    {
        target: 22, // "target_hand_l"
        effector: 6, // "hand_l"
        links: [
            {
                index: 5, // "lowerarm_l"
                enabled: true,
                rotationMin: new THREE.Vector3(1.2, -1.8, -0.4),
                rotationMax: new THREE.Vector3(1.7, -1.1, 0.3),
            },
            {
                index: 4, // "Upperarm_l"
                enabled: true,
                rotationMin: new THREE.Vector3(0.1, -0.7, -1.8),
                rotationMax: new THREE.Vector3(1.1, 0, -1.4),
            },
        ],
    },
];
const v0 = new THREE.Vector3();

extend({ TransformControls, CCDIKHelper });

@Component({
    standalone: true,
    template: `
        <ngt-color *args="['#dddddd']" attach="background" />
        <ngt-fog-exp2 *args="['#ffffff', 0.17]" attach="fog" />
        <ngt-ambient-light [intensity]="8" />
        <ngt-primitive *args="[model$ | ngtPush : null]" (afterAttach)="onAfterModelAttach()" />
        <ngt-cube-camera #cubeCamera *args="[0.05, 50, cubeRenderTarget]" />
        <ng-container *ngIf="ooi['kira']">
            <ngt-cCDIK-helper *args="[ooi['kira'], iks, 0.01]" />
        </ng-container>
        <demo-orbit-controls [minDistance]="0.2" [maxDistance]="1.5" (ready)="orbitControls = $any($event)" />
        <ngt-transform-controls
            #transformControls
            *args="[store.get('camera'), store.get('gl', 'domElement')]"
            [size]="0.75"
            [showX]="false"
            space="world"
        />
    `,
    imports: [NgtArgs, NgIf, DemoOrbitControls, NgtPush],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Scene {
    readonly iks = iks;
    readonly cubeRenderTarget = new THREE.WebGLCubeRenderTarget(1024);

    private readonly cdr = inject(ChangeDetectorRef);
    readonly store = inject(NgtStore);

    @ViewChild('transformControls') transformControls?: ElementRef<TransformControls>;
    @ViewChild('cubeCamera') cubeCamera?: ElementRef<THREE.CubeCamera>;
    orbitControls?: OrbitControls;
    solver?: CCDIKSolver;

    readonly ooi: Record<string, THREE.Object3D> = {};

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
            gltf.scene.traverse((n) => {
                if (n.name === 'head') this.ooi['head'] = n;
                if (n.name === 'hand_l') this.ooi['hand_l'] = n;
                if (n.name === 'target_hand_l') this.ooi['target_hand_l'] = n;
                if (n.name === 'boule') this.ooi['sphere'] = n;
                if (n.name === 'Kira_Shirt_left') this.ooi['kira'] = n;
                if ((n as THREE.Mesh).isMesh) n.frustumCulled = false;
            });
            this.cdr.detectChanges();
            return gltf.scene;
        })
    );

    constructor() {
        injectBeforeRender(({ gl, scene }) => {
            const head = this.ooi['head'];
            const sphere = this.ooi['sphere'];

            if (sphere && this.cubeCamera) {
                sphere.visible = false;
                sphere.getWorldPosition(this.cubeCamera.nativeElement.position);
                this.cubeCamera.nativeElement.update(gl, scene);
                sphere.visible = true;
            }

            if (this.solver) {
                this.solver.update();
            }

            if (head && sphere) {
                sphere.getWorldPosition(v0);
                head.lookAt(v0);
                head.rotation.set(head.rotation.x, head.rotation.y + Math.PI, head.rotation.z);
            }
        });
    }

    onAfterModelAttach() {
        this.orbitControls?.target.copy(this.ooi['sphere'].position);
        this.ooi['hand_l'].attach(this.ooi['sphere']);
        applyProps(this.ooi['sphere'], {
            material: new THREE.MeshBasicMaterial({ envMap: this.cubeRenderTarget.texture }),
        });

        this.transformControls?.nativeElement.attach(this.ooi['target_hand_l']);
        this.ooi['kira'].add((this.ooi['kira'] as THREE.SkinnedMesh).skeleton.bones[0]);
        this.solver = new CCDIKSolver(this.ooi['kira'] as THREE.SkinnedMesh, this.iks as unknown as IKS[]);

        if (this.transformControls && this.orbitControls) {
            this.transformControls.nativeElement.addEventListener(
                'mouseDown',
                () => (this.orbitControls!.enabled = false)
            );
            this.transformControls.nativeElement.addEventListener(
                'mouseUp',
                () => (this.orbitControls!.enabled = true)
            );
        }
    }
}

@Component({
    standalone: true,
    template: `
        <ngt-canvas
            [sceneGraph]="SceneGraph"
            [legacy]="true"
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
    imports: [NgtCanvas],
})
export default class DemoAnimationSkinningIK {
    readonly SceneGraph = Scene;

    onCreated({ scene, camera, gl }: NgtState) {
        applyProps(gl, { physicallyCorrectLights: true });
        camera.lookAt(scene.position);
    }
}
