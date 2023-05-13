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
                <ng-container *ngIf="environmentFiles() || environmentPreset(); else environmentMap">
                    <ngts-environment-cube
                        [background]="true"
                        [files]="environmentFiles()"
                        [preset]="environmentPreset()"
                        [path]="environmentPath()"
                        [extensions]="environmentExtensions()"
                    />
                </ng-container>
                <ng-template #environmentMap>
                    <ngts-environment-map
                        [background]="true"
                        [map]="environmentMap()"
                        [extensions]="environmentExtension()"
                    />
                </ng-template>
            </ng-template>
        </ngt-portal>
    `,
    imports: [NgtPortal, NgtPortalContent, NgtsEnvironmentMap, NgtsEnvironmentCube, NgIf, NgtArgs],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsEnvironmentPortal extends NgtsEnvironmentInput {
    readonly #store = inject(NgtStore);

    readonly virtualSceneRef = injectNgtRef<THREE.Scene>(prepare(new THREE.Scene()));
    readonly cubeCameraRef = injectNgtRef<THREE.CubeCamera>();

    readonly #fbo = computed(() => {
        const fbo = new THREE.WebGLCubeRenderTarget(this.environmentResolution());
        fbo.texture.type = THREE.HalfFloatType;
        return fbo;
    });
    readonly cameraArgs = computed(() => [this.environmentNear(), this.environmentFar(), this.#fbo()]);

    constructor() {
        super();
        this.set({ near: 1, far: 1000, resolution: 256, frames: 1, background: false, preset: undefined });
        this.#setEnvProps();
        injectBeforeRender(this.#onBeforeRender.bind(this, 1));
    }

    #setEnvProps() {
        const gl = this.#store.select('gl');
        const scene = this.#store.select('scene');

        const trigger = computed(() => ({
            gl: gl(),
            defaultScene: scene(),
            fbo: this.#fbo(),
            scene: this.environmentScene(),
            background: this.environmentBackground(),
            frames: this.environmentFrames(),
            blur: this.environmentBlur(),
            virtualScene: this.virtualSceneRef.nativeElement,
            cubeCamera: this.cubeCameraRef.nativeElement,
        }));

        effect((onCleanup) => {
            const { virtualScene, blur, frames, background, scene, fbo, defaultScene, gl, cubeCamera } = trigger();
            if (!cubeCamera || !virtualScene) return;
            if (frames === 1) cubeCamera.update(gl, virtualScene);
            onCleanup(setEnvProps(background, scene, defaultScene, fbo.texture, blur));
        });
    }

    #onBeforeRender(count: number, { gl }: NgtRenderState) {
        const { frames } = this.get();
        if (frames === Infinity || count < frames) {
            const camera = this.cubeCameraRef.nativeElement;
            const virtualScene = this.virtualSceneRef.nativeElement;
            if (camera && virtualScene) {
                camera.update(gl, virtualScene);
                count++;
            }
        }
    }
}
