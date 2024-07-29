import { NgTemplateOutlet } from '@angular/common';
import {
	ChangeDetectionStrategy,
	Component,
	computed,
	contentChild,
	CUSTOM_ELEMENTS_SCHEMA,
	ElementRef,
	Injector,
	input,
	TemplateRef,
	untracked,
	viewChild,
} from '@angular/core';
import { extend, injectBeforeRender, injectStore, merge, NgtArgs, NgtGroup, omit, pick } from 'angular-three';
import { assertInjector } from 'ngxtension/assert-injector';
import { injectAutoEffect } from 'ngxtension/auto-effect';
import { mergeInputs } from 'ngxtension/inject-inputs';
import { CubeCamera, Fog, FogExp2, Group, HalfFloatType, Texture, WebGLCubeRenderTarget } from 'three';
import { NgtsCameraContent } from './camera-content';

export interface CubeCameraOptions {
	/** Resolution of the FBO, 256 */
	resolution?: number;
	/** Camera near, 0.1 */
	near?: number;
	/** Camera far, 1000 */
	far?: number;
	/** Custom environment map that is temporarily set as the scenes background */
	envMap?: Texture;
	/** Custom fog that is temporarily set as the scenes fog */
	fog?: Fog | FogExp2;
}

export function injectCubeCamera(options: () => CubeCameraOptions, { injector }: { injector?: Injector } = {}) {
	return assertInjector(injectCubeCamera, injector, () => {
		const autoEffect = injectAutoEffect();
		const store = injectStore();
		const gl = store.select('gl');
		const scene = store.select('scene');

		// backfill the options with default values
		const mergedOptions = merge(options, { resolution: 256, near: 0.1, far: 1000 }, 'backfill');
		const resolution = pick(mergedOptions, 'resolution');
		const near = pick(mergedOptions, 'near');
		const far = pick(mergedOptions, 'far');

		const fbo = computed(() => {
			const fbo = new WebGLCubeRenderTarget(resolution());
			fbo.texture.type = HalfFloatType;
			return fbo;
		});

		autoEffect(() => {
			const _fbo = fbo();
			return () => {
				_fbo.dispose();
			};
		});

		const camera = computed(() => {
			return new CubeCamera(near()!, far()!, fbo());
		});

		const update = computed(() => {
			const [_scene, _gl, _camera, { envMap, fog }] = [scene(), gl(), camera(), untracked(mergedOptions)];
			let originalFog: Fog | FogExp2;
			let originalBackground: Texture;

			return () => {
				originalFog = _scene.fog as Fog | FogExp2;
				originalBackground = _scene.background as Texture;
				_scene.background = envMap || originalBackground;
				_scene.fog = fog || originalFog;
				_camera.update(_gl, _scene);
				_scene.fog = originalFog;
				_scene.background = originalBackground;
			};
		});

		return { fbo, camera, update };
	});
}

export interface NgtsCubeCameraOptions extends Partial<NgtGroup>, CubeCameraOptions {
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
	standalone: true,
	template: `
		<ngt-group [parameters]="parameters()">
			<ngt-primitive *args="[camera()]" />
			<ngt-group #group>
				<ng-container [ngTemplateOutlet]="cameraContent() ?? null" [ngTemplateOutletContext]="{ $implicit: texture }" />
			</ngt-group>
		</ngt-group>
	`,
	imports: [NgtArgs, NgTemplateOutlet],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtsCubeCamera {
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });
	parameters = omit(this.options, ['fog', 'near', 'far', 'envMap', 'resolution', 'frames']);

	private cubeCamera = injectCubeCamera(pick(this.options, ['near', 'far', 'envMap', 'fog', 'resolution']));

	camera = this.cubeCamera.camera;
	texture = pick(this.cubeCamera.fbo, 'texture');

	groupRef = viewChild.required<ElementRef<Group>>('group');
	cameraContent = contentChild(NgtsCameraContent, { read: TemplateRef });

	constructor() {
		extend({ Group });

		let count = 0;
		injectBeforeRender(() => {
			const group = this.groupRef().nativeElement;
			if (!group) return;

			const frames = this.options().frames;
			const update = this.cubeCamera.update();
			if (frames === Infinity || count < frames) {
				group.visible = false;
				update();
				group.visible = true;
				count++;
			}
		});
	}
}
