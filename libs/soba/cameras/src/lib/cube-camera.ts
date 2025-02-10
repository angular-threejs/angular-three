import { NgTemplateOutlet } from '@angular/common';
import {
	ChangeDetectionStrategy,
	Component,
	computed,
	contentChild,
	CUSTOM_ELEMENTS_SCHEMA,
	effect,
	ElementRef,
	Injector,
	input,
	TemplateRef,
	untracked,
	viewChild,
} from '@angular/core';
import { extend, injectBeforeRender, injectStore, merge, NgtArgs, NgtThreeElements, omit, pick } from 'angular-three';
import { assertInjector } from 'ngxtension/assert-injector';
import { mergeInputs } from 'ngxtension/inject-inputs';
import * as THREE from 'three';
import { Group } from 'three';
import { NgtsCameraContent } from './camera-content';

export interface CubeCameraOptions {
	/** Resolution of the FBO, 256 */
	resolution?: number;
	/** Camera near, 0.1 */
	near?: number;
	/** Camera far, 1000 */
	far?: number;
	/** Custom environment map that is temporarily set as the scenes background */
	envMap?: THREE.Texture;
	/** Custom fog that is temporarily set as the scenes fog */
	fog?: THREE.Fog | THREE.FogExp2;
}

export function injectCubeCamera(options: () => CubeCameraOptions, { injector }: { injector?: Injector } = {}) {
	return assertInjector(injectCubeCamera, injector, () => {
		const store = injectStore();

		// backfill the options with default values
		const mergedOptions = merge(options, { resolution: 256, near: 0.1, far: 1000 }, 'backfill');
		const resolution = pick(mergedOptions, 'resolution');
		const near = pick(mergedOptions, 'near');
		const far = pick(mergedOptions, 'far');

		const fbo = computed(() => {
			const fbo = new THREE.WebGLCubeRenderTarget(resolution());
			fbo.texture.type = THREE.HalfFloatType;
			return fbo;
		});

		effect((onCleanup) => {
			const _fbo = fbo();
			onCleanup(() => _fbo.dispose());
		});

		const cubeCamera = computed(() => new THREE.CubeCamera(near()!, far()!, fbo()));
		const update = () => {
			const [scene, gl, camera, { envMap, fog }] = [
				store.scene(),
				store.gl(),
				cubeCamera(),
				untracked(mergedOptions),
			];
			let originalFog: THREE.Fog | THREE.FogExp2;
			let originalBackground: THREE.Texture;

			originalFog = scene.fog as THREE.Fog | THREE.FogExp2;
			originalBackground = scene.background as THREE.Texture;
			scene.background = envMap || originalBackground;
			scene.fog = fog || originalFog;
			camera.update(gl, scene);
			scene.fog = originalFog;
			scene.background = originalBackground;
		};

		return { fbo, camera: cubeCamera, update };
	});
}

export interface NgtsCubeCameraOptions extends Partial<NgtThreeElements['ngt-group']>, CubeCameraOptions {
	frames: number;
}

const defaultOptions: NgtsCubeCameraOptions = {
	frames: Infinity,
	resolution: 256,
	near: 0.1,
	far: 1000,
};

@Component({
	selector: 'ngts-cube-camera',
	template: `
		<ngt-group [parameters]="parameters()">
			<ngt-primitive *args="[camera()]" />
			<ngt-group #group>
				<ng-container
					[ngTemplateOutlet]="cameraContent() ?? null"
					[ngTemplateOutletContext]="{ $implicit: texture }"
				/>
			</ngt-group>
		</ngt-group>
	`,
	imports: [NgtArgs, NgTemplateOutlet],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtsCubeCamera {
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });
	protected parameters = omit(this.options, ['fog', 'near', 'far', 'envMap', 'resolution', 'frames']);

	private cubeCamera = injectCubeCamera(pick(this.options, ['near', 'far', 'envMap', 'fog', 'resolution']));

	protected camera = this.cubeCamera.camera;
	protected texture = pick(this.cubeCamera.fbo, 'texture');

	groupRef = viewChild.required<ElementRef<THREE.Group>>('group');
	protected cameraContent = contentChild(NgtsCameraContent, { read: TemplateRef });

	constructor() {
		extend({ Group });

		let count = 0;
		injectBeforeRender(() => {
			const group = this.groupRef().nativeElement;
			if (!group) return;

			const frames = this.options().frames;
			if (frames === Infinity || count < frames) {
				group.visible = false;
				this.cubeCamera.update();
				group.visible = true;
				count++;
			}
		});
	}
}
