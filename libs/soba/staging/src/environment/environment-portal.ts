import { NgIf } from '@angular/common';
import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, effect, inject } from '@angular/core';
import {
	extend,
	injectBeforeRender,
	injectNgtRef,
	injectNgtStore,
	NgtArgs,
	NgtPortal,
	NgtPortalContent,
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
				<ng-container *ngIf="environmentInput.files() || environmentInput.preset(); else environmentMap">
					<ngts-environment-cube [background]="true" />
				</ng-container>
				<ng-template #environmentMap>
					<ngts-environment-map *ngIf="environmentInput.map() as map" [background]="true" [map]="map" />
				</ng-template>
			</ng-template>
		</ngt-portal>
	`,
	imports: [NgtPortal, NgtPortalContent, NgtsEnvironmentMap, NgtsEnvironmentCube, NgIf, NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsEnvironmentPortal {
	environmentInput = inject(NgtsEnvironmentInput);
	private store = injectNgtStore();

	virtualSceneRef = injectNgtRef<THREE.Scene>(prepare(new THREE.Scene()));
	cubeCameraRef = injectNgtRef<THREE.CubeCamera>();

	private fbo = computed(() => {
		const fbo = new THREE.WebGLCubeRenderTarget(this.environmentInput.resolution());
		fbo.texture.type = THREE.HalfFloatType;
		return fbo;
	});
	cameraArgs = computed(() => [this.environmentInput.near()!, this.environmentInput.far()!, this.fbo()]);

	constructor() {
		effect(() => {
			this.environmentInput.inputs.patch({
				near: 1,
				far: 1000,
				resolution: 256,
				frames: 1,
				background: false,
				preset: undefined,
			});
		});
		this.setEnvProps();
		this.beforeRender();
	}

	private setEnvProps() {
		const gl = this.store.select('gl');
		const scene = this.store.select('scene');

		const trigger = computed(() => ({
			gl: gl(),
			defaultScene: scene(),
			fbo: this.fbo(),
			scene: this.environmentInput.scene(),
			background: this.environmentInput.background(),
			frames: this.environmentInput.frames(),
			blur: this.environmentInput.blur(),
			virtualScene: this.virtualSceneRef.nativeElement,
			cubeCamera: this.cubeCameraRef.nativeElement,
		}));

		effect((onCleanup) => {
			const { virtualScene, blur, frames, background, scene, fbo, defaultScene, gl, cubeCamera } = trigger();
			if (!cubeCamera || !virtualScene) return;
			if (frames === 1) cubeCamera.update(gl, virtualScene);
			const cleanUp = setEnvProps(background!, scene, defaultScene, fbo.texture, blur);
			onCleanup(cleanUp);
		});
	}

	private beforeRender() {
		let count = 1;
		injectBeforeRender(({ gl }) => {
			const { frames } = this.environmentInput.inputs.get();
			if (frames === Infinity || count < frames!) {
				const camera = this.cubeCameraRef.nativeElement;
				const virtualScene = this.virtualSceneRef.nativeElement;
				if (camera && virtualScene) {
					camera.update(gl, virtualScene);
					count++;
				}
			}
		});
	}
}
