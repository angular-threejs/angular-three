import { RouteMeta } from '@analogjs/router';
import {
    AfterViewInit,
    CUSTOM_ELEMENTS_SCHEMA,
    Component,
    ElementRef,
    OnInit,
    ViewChild,
    computed,
    inject,
    signal,
} from '@angular/core';
import { NgtArgs, NgtCanvas, NgtRenderState, NgtState, NgtStore, injectBeforeRender } from 'angular-three';
import * as THREE from 'three';

export const routeMeta: RouteMeta = {
    title: 'THREE.js Camera',
};

@Component({
    standalone: true,
    templateUrl: 'scene.html',
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    imports: [NgtArgs],
    host: { '(document:keydown)': 'onKeyDown($event)' },
})
class SceneGraph implements OnInit, AfterViewInit {
    readonly Math = Math;
    readonly #aspect = inject(NgtStore).select('viewport', 'aspect');

    readonly perspectiveAspect = computed(() => this.#aspect() / 2);
    readonly left = computed(() => (300 * this.#aspect()) / -2);
    readonly right = computed(() => (300 * this.#aspect()) / 2);

    readonly vertices = Array.from({ length: 10000 }, () => [
        THREE.MathUtils.randFloatSpread(2000),
        THREE.MathUtils.randFloatSpread(2000),
        THREE.MathUtils.randFloatSpread(2000),
    ]).flat();

    readonly #activeCamera = signal<THREE.Camera>(null!);
    readonly #activeHelper = signal<THREE.CameraHelper>(null!);

    @ViewChild('perspectiveCamera', { static: true }) perspectiveCamera!: ElementRef<THREE.PerspectiveCamera>;
    @ViewChild('orthographicCamera', { static: true }) orthographicCamera!: ElementRef<THREE.OrthographicCamera>;
    @ViewChild('perspectiveHelper') perspectiveHelper?: ElementRef<THREE.CameraHelper>;
    @ViewChild('orthographicHelper') orthographicHelper?: ElementRef<THREE.CameraHelper>;
    @ViewChild('cameras', { static: true }) cameraGroup!: ElementRef<THREE.Group>;
    @ViewChild('mesh', { static: true }) mesh!: ElementRef<THREE.Mesh>;

    constructor() {
        injectBeforeRender(this.#onBeforeRender.bind(this), { priority: 1 });
    }

    ngOnInit() {
        this.#activeCamera.set(this.perspectiveCamera.nativeElement);
    }

    ngAfterViewInit() {
        this.#activeHelper.set(this.perspectiveHelper!.nativeElement);
    }

    onKeyDown({ key }: KeyboardEvent) {
        switch (key.toLowerCase()) {
            case 'o':
                this.#activeCamera.set(this.orthographicCamera.nativeElement);
                this.#activeHelper.set(this.orthographicHelper!.nativeElement);
                break;
            case 'p':
                this.#activeCamera.set(this.perspectiveCamera.nativeElement);
                this.#activeHelper.set(this.perspectiveHelper!.nativeElement);
        }
    }

    #onBeforeRender({ gl, size, camera, scene }: NgtRenderState) {
        if (!this.#activeCamera() || !this.#activeHelper()) return;
        const r = Date.now() * 0.0005;
        // reassign shorthands
        const mesh = this.mesh.nativeElement;
        const cameraGroup = this.cameraGroup.nativeElement;
        const perspectiveCamera = this.perspectiveCamera.nativeElement;
        const perspectiveHelper = this.perspectiveHelper?.nativeElement;
        const orthographicCamera = this.orthographicCamera.nativeElement;
        const orthographicHelper = this.orthographicHelper?.nativeElement;

        mesh.position.x = 700 * Math.cos(r);
        mesh.position.z = 700 * Math.sin(r);
        mesh.position.y = 700 * Math.sin(r);

        mesh.children[0].position.x = 70 * Math.cos(2 * r);
        mesh.children[0].position.y = 70 * Math.sin(r);

        if (perspectiveCamera && orthographicCamera && perspectiveHelper && orthographicHelper) {
            if (this.#activeCamera() === perspectiveCamera) {
                perspectiveCamera.fov = 35 + 30 * Math.sin(0.5 * r);
                perspectiveCamera.far = mesh.position.length();
                perspectiveCamera.updateProjectionMatrix();

                perspectiveHelper.update();
                perspectiveHelper.visible = true;

                orthographicHelper.visible = false;
            } else {
                orthographicCamera.far = mesh.position.length();
                orthographicCamera.updateProjectionMatrix();

                orthographicHelper.update();
                orthographicHelper.visible = true;

                perspectiveHelper.visible = false;
            }
        }

        cameraGroup.lookAt(mesh.position);

        gl.clear();

        this.#activeHelper().visible = false;
        gl.setViewport(0, 0, size.width / 2, size.height);
        gl.render(scene, this.#activeCamera());

        this.#activeHelper().visible = true;

        gl.setViewport(size.width / 2, 0, size.width / 2, size.height);
        gl.render(scene, camera);
    }
}

@Component({
    standalone: true,
    templateUrl: 'index.html',
    imports: [NgtCanvas],
})
export default class Camera {
    readonly scene = SceneGraph;

    onCreated({ gl, camera, viewport }: NgtState) {
        gl.autoClear = false;
        (camera as THREE.PerspectiveCamera).aspect = viewport.aspect / 2;
    }
}
