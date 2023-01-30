import {
    AfterViewInit,
    Component,
    CUSTOM_ELEMENTS_SCHEMA,
    ElementRef,
    HostListener,
    inject,
    OnInit,
    ViewChild,
} from '@angular/core';
import { injectBeforeRender, NgtArgs, NgtCanvas, NgtRenderState, NgtState, NgtStore } from 'angular-three';
import * as THREE from 'three';

@Component({
    standalone: true,
    template: `
        <ngt-group #cameras>
            <ngt-perspective-camera
                #perspectiveCamera
                [aspect]="store.get('viewport', 'aspect') * 0.5"
                [near]="150"
                [far]="1000"
                [rotation]="[0, Math.PI, 0]"
            />
            <ngt-orthographic-camera
                #orthographicCamera
                [left]="(300 * store.get('viewport', 'aspect')) / -2"
                [right]="(300 * store.get('viewport', 'aspect')) / 2"
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

        <ngt-camera-helper #perspectiveHelper *args="[perspectiveCamera]" />
        <ngt-camera-helper #orthographicHelper *args="[orthographicCamera]" />

        <ngt-mesh #mesh>
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
export class Scene implements AfterViewInit, OnInit {
    readonly Math = Math;

    readonly store = inject(NgtStore);

    @ViewChild('perspectiveCamera', { static: true }) perspectiveCamera!: ElementRef<THREE.PerspectiveCamera>;
    @ViewChild('orthographicCamera', { static: true }) orthographicCamera!: ElementRef<THREE.OrthographicCamera>;
    @ViewChild('cameras', { static: true }) cameraGroup!: ElementRef<THREE.Group>;
    @ViewChild('mesh', { static: true }) mesh!: ElementRef<THREE.Mesh>;

    @ViewChild('perspectiveHelper') perspectiveHelper?: ElementRef<THREE.CameraHelper>;
    @ViewChild('orthographicHelper') orthographicHelper?: ElementRef<THREE.CameraHelper>;

    readonly vertices: number[] = [];

    private activeCamera?: THREE.Camera;
    private activeCameraHelper?: THREE.CameraHelper;

    constructor() {
        injectBeforeRender(this.onBeforeRender.bind(this), 1);
    }

    ngOnInit() {
        for (let i = 0; i < 10000; i++) {
            this.vertices.push(THREE.MathUtils.randFloatSpread(2000)); // x
            this.vertices.push(THREE.MathUtils.randFloatSpread(2000)); // y
            this.vertices.push(THREE.MathUtils.randFloatSpread(2000)); // z
        }
    }

    ngAfterViewInit() {
        this.activeCamera = this.perspectiveCamera.nativeElement;
        this.activeCameraHelper = this.perspectiveHelper?.nativeElement;
    }

    @HostListener('document:keydown', ['$event'])
    onKeyDown({ key }: KeyboardEvent) {
        switch (key.toLowerCase()) {
            case 'o':
                this.activeCamera = this.orthographicCamera.nativeElement;
                this.activeCameraHelper = this.orthographicHelper?.nativeElement;
                break;
            case 'p':
                this.activeCamera = this.perspectiveCamera.nativeElement;
                this.activeCameraHelper = this.perspectiveHelper?.nativeElement;
        }
    }

    private onBeforeRender({ gl, size, camera, scene }: NgtRenderState) {
        if (!this.activeCamera || !this.activeCameraHelper) return;

        const r = Date.now() * 0.0005;
        // reassign shorthands
        const mesh = this.mesh.nativeElement;
        const camGroup = this.cameraGroup.nativeElement;
        const perspective = this.perspectiveCamera.nativeElement;
        const perspectiveHelper = this.perspectiveHelper?.nativeElement;
        const orthographic = this.orthographicCamera.nativeElement;
        const orthographicHelper = this.orthographicHelper?.nativeElement;

        mesh.position.x = 700 * Math.cos(r);
        mesh.position.z = 700 * Math.sin(r);
        mesh.position.y = 700 * Math.sin(r);

        mesh.children[0].position.x = 70 * Math.cos(2 * r);
        mesh.children[0].position.z = 70 * Math.sin(r);

        if (perspective && orthographic && perspectiveHelper && orthographicHelper) {
            if (this.activeCamera === perspective) {
                perspective.fov = 35 + 30 * Math.sin(0.5 * r);
                perspective.far = mesh.position.length();
                perspective.updateProjectionMatrix();

                perspectiveHelper.update();
                perspectiveHelper.visible = true;

                orthographicHelper.visible = false;
            } else {
                orthographic.far = mesh.position.length();
                orthographic.updateProjectionMatrix();

                orthographicHelper.update();
                orthographicHelper.visible = true;

                perspectiveHelper.visible = false;
            }
        }

        camGroup.lookAt(mesh.position);

        gl.clear();

        this.activeCameraHelper.visible = false;
        gl.setViewport(0, 0, size.width / 2, size.height);
        gl.render(scene, this.activeCamera);

        this.activeCameraHelper.visible = true;

        gl.setViewport(size.width / 2, 0, size.width / 2, size.height);
        gl.render(scene, camera);
    }
}

@Component({
    standalone: true,
    template: `
        <div class="block h-full w-full bg-black">
            <ngt-canvas
                [sceneGraph]="SceneGraph"
                [gl]="{ alpha: false }"
                [camera]="{ fov: 50, near: 1, far: 10000, position: [0, 0, 2500] }"
                (created)="onCreated($event)"
            />
        </div>
        <div class="absolute text-center text-white w-full top-0 left-0 text-xl">
            <a href="https://threejs.org" target="_blank" rel="noopener" class="underline"> three.js </a> -
            <a href="https://angular-threejs.netlify.app" target="_blank" rel="noopener" class="underline">
                Angular Three
            </a>
            - cameras
            <br />
            <b class="text-green-400">O</b> orthographic <b class="text-green-400">P</b> perspective
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
