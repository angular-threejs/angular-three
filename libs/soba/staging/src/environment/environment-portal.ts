import { NgIf } from '@angular/common';
import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, effect, inject } from '@angular/core';
import {
    extend,
    injectBeforeRender,
    injectNgtRef,
    NgtArgs,
    NgtPortal,
    NgtPortalContent,
    NgtRenderState,
    NgtStore,
    prepare,
    requestAnimationInInjectionContext,
} from 'angular-three';
import * as THREE from 'three';
import { CubeCamera } from 'three';
import { NgtsEnvironmentCube } from './environment-cube';
import { NgtsEnvironmentInput } from './environment-input';
import { NgtsEnvironmentMap } from './environment-map';
import { setEnvProps } from './utils';

extend({ CubeCamera });

@Component({
    selector: 'ngts-environment-portal',
    standalone: true,
    template: `
        <ngt-portal [container]="virtualSceneRef">
            <ng-template ngtPortalContent>
                <ng-content />
                <ngt-cube-camera *args="cameraArgs()" [ref]="cubeCameraRef" />
                <ng-container
                    *ngIf="
                        environmentInput.environmentFiles() || environmentInput.environmentPreset();
                        else environmentMap
                    "
                >
                    <ngts-environment-cube [background]="true" />
                </ng-container>
                <ng-template #environmentMap>
                    <ngts-environment-map
                        *ngIf="environmentInput.environmentMap() as map"
                        [background]="true"
                        [map]="map"
                    />
                </ng-template>
            </ng-template>
        </ngt-portal>
    `,
    imports: [NgtPortal, NgtPortalContent, NgtsEnvironmentMap, NgtsEnvironmentCube, NgIf, NgtArgs],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsEnvironmentPortal {
    protected readonly environmentInput = inject(NgtsEnvironmentInput);
    readonly #store = inject(NgtStore);

    readonly virtualSceneRef = injectNgtRef<THREE.Scene>(prepare(new THREE.Scene()));
    readonly cubeCameraRef = injectNgtRef<THREE.CubeCamera>();

    readonly #fbo = computed(() => {
        const fbo = new THREE.WebGLCubeRenderTarget(this.environmentInput.environmentResolution());
        fbo.texture.type = THREE.HalfFloatType;
        return fbo;
    });
    readonly cameraArgs = computed(() => [
        this.environmentInput.environmentNear()!,
        this.environmentInput.environmentFar()!,
        this.#fbo(),
    ]);

    constructor() {
        this.environmentInput.patch({
            near: 1,
            far: 1000,
            resolution: 256,
            frames: 1,
            background: false,
            preset: undefined,
        });
        requestAnimationInInjectionContext(() => {
            this.#setEnvProps();
        });
        injectBeforeRender(this.#onBeforeRender.bind(this, 1));
    }

    #setEnvProps() {
        const gl = this.#store.select('gl');
        const scene = this.#store.select('scene');

        const trigger = computed(() => ({
            gl: gl(),
            defaultScene: scene(),
            fbo: this.#fbo(),
            scene: this.environmentInput.environmentScene(),
            background: this.environmentInput.environmentBackground(),
            frames: this.environmentInput.environmentFrames(),
            blur: this.environmentInput.environmentBlur(),
            virtualScene: this.virtualSceneRef.nativeElement,
            cubeCamera: this.cubeCameraRef.nativeElement,
        }));

        effect((onCleanup) => {
            const { virtualScene, blur, frames, background, scene, fbo, defaultScene, gl, cubeCamera } = trigger();
            if (!cubeCamera || !virtualScene) return;
            if (frames === 1) cubeCamera.update(gl, virtualScene);
            onCleanup(setEnvProps(background!, scene, defaultScene, fbo.texture, blur));
        });
    }

    #onBeforeRender(count: number, { gl }: NgtRenderState) {
        const { frames } = this.environmentInput.get();
        if (frames === Infinity || count < frames!) {
            const camera = this.cubeCameraRef.nativeElement;
            const virtualScene = this.virtualSceneRef.nativeElement;
            if (camera && virtualScene) {
                camera.update(gl, virtualScene);
                count++;
            }
        }
    }
}
