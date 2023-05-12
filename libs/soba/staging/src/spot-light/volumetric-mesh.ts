import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { extend, injectBeforeRender, injectNgtRef, NgtArgs, NgtStore } from 'angular-three';
import { SpotLightMaterial } from 'angular-three-soba/shaders';
import * as THREE from 'three';
import { Mesh } from 'three';
import { NgtsSpotLightInput } from './spot-light-input';

extend({ Mesh });

@Component({
    selector: 'ngts-volumetric-mesh',
    standalone: true,
    template: `
        <ngt-mesh [ref]="mesh" [geometry]="geometry()" [raycast]="nullRaycast">
            <ngt-primitive *args="[material]" attach="material">
                <ngt-value [rawValue]="lightOpacity()" attach="uniforms.opacity.value" />
                <ngt-value [rawValue]="lightColor()" attach="uniforms.lightColor.value" />
                <ngt-value [rawValue]="lightAttenuation()" attach="uniforms.attenuation.value" />
                <ngt-value [rawValue]="lightAnglePower()" attach="uniforms.anglePower.value" />
                <ngt-value [rawvalue]="lightDepthBuffer()" attach="uniforms.depth.value" />
                <ngt-value [rawvalue]="near()" attach="uniforms.cameraNear.value" />
                <ngt-value [rawvalue]="far()" attach="uniforms.cameraFar.value" />
                <ngt-value [rawvalue]="resolution()" attach="uniforms.resolution.value" />
            </ngt-primitive>
        </ngt-mesh>
    `,
    imports: [NgtArgs],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsVolumetricMesh extends NgtsSpotLightInput {
    readonly mesh = injectNgtRef<THREE.Mesh>();
    readonly material = new SpotLightMaterial();
    readonly nullRaycast = () => null;

    readonly #vec = new THREE.Vector3();
    readonly #store = inject(NgtStore);
    readonly #camera = this.#store.select('camera');
    readonly #size = this.#store.select('size');
    readonly #dpr = this.#store.select('viewport', 'dpr');

    readonly #normalizedRadiusTop = computed(() => (this.lightRadiusTop() === undefined ? 0.1 : this.lightRadiusTop()));
    readonly #normalizedRadiusBottom = computed(() =>
        this.lightRadiusBottom() === undefined ? this.lightAngle() * 7 : this.lightRadiusBottom()
    );
    readonly geometry = computed(() => {
        const distance = this.lightDistance();
        const radiusTop = this.#normalizedRadiusTop();
        const radiusBottom = this.#normalizedRadiusBottom();

        const geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, distance, 128, 64, true);
        geometry.applyMatrix4(new THREE.Matrix4().makeTranslation(0, -distance / 2, 0));
        geometry.applyMatrix4(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
        return geometry;
    });
    readonly near = computed(() => this.#camera().near);
    readonly far = computed(() => this.#camera().far);
    readonly resolution = computed(() =>
        this.lightDepthBuffer() ? [this.#size().width * this.#dpr(), this.#size().height * this.#dpr()] : [0, 0]
    );

    constructor() {
        super();
        this.set({ opacity: 1, color: 'white', distance: 5, angle: 0.15, attenuation: 5, anglePower: 5 });
        injectBeforeRender(() => {
            const mesh = this.mesh.nativeElement;
            if (!mesh) return;
            this.material.uniforms['spotPosition'].value.copy(mesh.getWorldPosition(this.#vec));
            mesh.lookAt((mesh.parent as THREE.SpotLight).target.getWorldPosition(this.#vec));
        });
    }
}
