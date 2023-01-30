import {
    AfterViewInit,
    Component,
    CUSTOM_ELEMENTS_SCHEMA,
    ElementRef,
    HostListener,
    inject,
    ViewChild,
} from '@angular/core';
import { injectBeforeRender, injectNgtRef, NgtArgs, NgtCanvas, NgtState, NgtStore } from 'angular-three';
import * as THREE from 'three';

@Component({
    standalone: true,
    template: `
        <ngt-group #cameras>
            <ngt-perspective-camera
                [ref]="cameraPerspectiveRef"
                [aspect]="store.get('viewport', 'aspect') * 0.5"
                [near]="150"
                [far]="1000"
                [rotation]="[0, Math.PI, 0]"
            />
            <ngt-orthographic-camera
                [ref]="cameraOrthographicRef"
                [left]="(0.5 * 600 * store.get('viewport', 'aspect')) / -2"
                [right]="(0.5 * 600 * store.get('viewport', 'aspect')) / 2"
                [top]="300"
                [bottom]="-300"
                [near]="150"
                [far]="1000"
                [rotation]="[0, Math.PI, 0]"
            />

            <ngt-mesh [position]="[0, 0, 150]">
                <ngt-sphere-geometry *args="[5, 16, 8]" />
                <ngt-mesh-basic-material color="#0000ff" [wireframe]="true" />
            </ngt-mesh>
        </ngt-group>

        <ngt-camera-helper #perspective *args="[cameraPerspectiveRef.nativeElement]" />
        <ngt-camera-helper #orthographic *args="[cameraOrthographicRef.nativeElement]" />

        <ngt-mesh #whiteMesh>
            <ngt-sphere-geometry *args="[100, 16, 8]" />
            <ngt-mesh-basic-material [wireframe]="true" />

            <ngt-mesh [position]="[0, 150, 0]">
                <ngt-sphere-geometry *args="[50, 16, 8]" />
                <ngt-mesh-basic-material color="#00ff00" [wireframe]="true" />
            </ngt-mesh>
        </ngt-mesh>

        <ngt-points>
            <ngt-float32-buffer-attribute *args="[vertices, 3]" attach="geometry.attributes.position" />
            <ngt-points-material color="#888888" />
        </ngt-points>
    `,
    imports: [NgtArgs],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Scene implements AfterViewInit {
    readonly Math = Math;

    readonly cameraPerspectiveRef = injectNgtRef<THREE.PerspectiveCamera>();
    readonly cameraOrthographicRef = injectNgtRef<THREE.OrthographicCamera>();

    readonly store = inject(NgtStore);

    @ViewChild('cameras', { static: true }) cameraGroup!: ElementRef<THREE.Group>;
    @ViewChild('perspective') cameraPerspectiveHelper?: ElementRef<THREE.CameraHelper>;
    @ViewChild('orthographic') cameraOrthographicHelper?: ElementRef<THREE.CameraHelper>;

    @ViewChild('whiteMesh', { static: true }) whiteMesh!: ElementRef<THREE.Mesh>;

    readonly vertices: number[] = [];

    private activeCamera?: THREE.Camera;
    private activeCameraHelper?: THREE.CameraHelper;

    constructor() {
        for (let i = 0; i < 10000; i++) {
            this.vertices.push(THREE.MathUtils.randFloatSpread(2000)); // x
            this.vertices.push(THREE.MathUtils.randFloatSpread(2000)); // y
            this.vertices.push(THREE.MathUtils.randFloatSpread(2000)); // z
        }
        injectBeforeRender(({ gl, size, scene, camera }) => {
            const r = Date.now() * 0.0005;
            const mesh = this.whiteMesh.nativeElement;
            const cameraGroup = this.cameraGroup.nativeElement;
            const cameraPerspective = this.cameraPerspectiveRef.nativeElement;
            const cameraPerspectiveHelper = this.cameraPerspectiveHelper?.nativeElement;
            const cameraOrthographic = this.cameraOrthographicRef.nativeElement;
            const cameraOrthographicHelper = this.cameraOrthographicHelper?.nativeElement;

            mesh.position.x = 700 * Math.cos(r);
            mesh.position.z = 700 * Math.sin(r);
            mesh.position.y = 700 * Math.sin(r);

            mesh.children[0].position.x = 70 * Math.cos(2 * r);
            mesh.children[0].position.z = 70 * Math.sin(r);

            if (cameraPerspective && cameraOrthographic && cameraPerspectiveHelper && cameraOrthographicHelper) {
                if (this.activeCamera === cameraPerspective) {
                    cameraPerspective.fov = 35 + 30 * Math.sin(0.5 * r);
                    cameraPerspective.far = mesh.position.length();
                    cameraPerspective.updateProjectionMatrix();

                    cameraPerspectiveHelper.update();
                    cameraPerspectiveHelper.visible = true;

                    cameraOrthographicHelper.visible = false;
                } else {
                    cameraOrthographic.far = mesh.position.length();
                    cameraOrthographic.updateProjectionMatrix();

                    cameraOrthographicHelper.update();
                    cameraOrthographicHelper.visible = true;

                    cameraPerspectiveHelper.visible = false;
                }
            }

            cameraGroup.lookAt(mesh.position);

            gl.clear();

            this.activeCameraHelper!.visible = false;
            gl.setViewport(0, 0, size.width / 2, size.height);
            gl.render(scene, this.activeCamera!);

            this.activeCameraHelper!.visible = true;

            gl.setViewport(size.width / 2, 0, size.width / 2, size.height);
            gl.render(scene, camera);
        }, 1);
    }

    ngAfterViewInit() {
        this.activeCamera = this.cameraPerspectiveRef.nativeElement;
        this.activeCameraHelper = this.cameraPerspectiveHelper?.nativeElement;
    }

    @HostListener('document:keydown', ['$event'])
    onKeyDown(event: KeyboardEvent) {
        if (event.key.toLowerCase() === 'o') {
            this.activeCamera = this.cameraOrthographicRef.nativeElement;
            this.activeCameraHelper = this.cameraOrthographicHelper?.nativeElement;
        } else if (event.key.toLowerCase() === 'p') {
            this.activeCamera = this.cameraPerspectiveRef.nativeElement;
            this.activeCameraHelper = this.cameraPerspectiveHelper?.nativeElement;
        }
    }
}

@Component({
    standalone: true,
    template: `
        <div class="block h-full w-full bg-black">
            <ngt-canvas
                [sceneGraph]="SceneGraph"
                [gl]="{ alpha: false }"
                [camera]="{
                    fov: 50,
                    near: 1,
                    far: 10000,
                    position: [0, 0, 2500]
                }"
                (created)="onCreated($event)"
            />
        </div>
        <div class="absolute text-center text-white w-full top-0 left-0 text-xl">
            <a href="https://threejs.org" target="_blank" rel="noopener" class="underline">three.js</a> -<a
                href="https://angular-threejs.netlify.app"
                target="_blank"
                rel="noopener"
                class="underline"
                >Angular Three</a
            >
            - cameras
            <br />
            <b class="text-green-300">O</b> orthographic <b class="text-green-300">P</b> perspective
        </div>
    `,
    imports: [NgtCanvas],
})
export default class DemoCamera {
    readonly SceneGraph = Scene;

    onCreated({ gl, camera, viewport }: NgtState) {
        gl.autoClear = false;
        (camera as THREE.PerspectiveCamera).aspect = viewport.aspect / 2;
    }
}
