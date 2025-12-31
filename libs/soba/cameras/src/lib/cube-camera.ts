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
import { beforeRender, extend, injectStore, merge, NgtArgs, NgtThreeElements, omit, pick } from 'angular-three';
import { assertInjector } from 'ngxtension/assert-injector';
import { mergeInputs } from 'ngxtension/inject-inputs';
import * as THREE from 'three';
import { Group } from 'three';
import { NgtsCameraContent } from './camera-content';

/**
 * Configuration options for the cube camera.
 */
export interface CubeCameraOptions {
	/**
	 * Resolution of the cube render target (FBO).
	 * @default 256
	 */
	resolution?: number;
	/**
	 * Near clipping plane distance for the cube camera.
	 * @default 0.1
	 */
	near?: number;
	/**
	 * Far clipping plane distance for the cube camera.
	 * @default 1000
	 */
	far?: number;
	/**
	 * Custom environment map that is temporarily set as the scene's background
	 * during cube camera rendering.
	 */
	envMap?: THREE.Texture;
	/**
	 * Custom fog that is temporarily set as the scene's fog
	 * during cube camera rendering.
	 */
	fog?: THREE.Fog | THREE.FogExp2;
}

/**
 * Creates a reactive cube camera that renders the scene into a cube render target.
 *
 * This function creates a `THREE.CubeCamera` with an associated `WebGLCubeRenderTarget`
 * that can be used for environment mapping and reflections. The camera automatically
 * updates when its options change.
 *
 * @param options - Signal of cube camera configuration options
 * @param config - Optional configuration object
 * @param config.injector - Optional injector for dependency injection context
 * @returns An object containing the FBO signal, camera signal, and update function
 *
 * @example
 * ```typescript
 * const { fbo, camera, update } = cubeCamera(() => ({
 *   resolution: 512,
 *   near: 0.1,
 *   far: 1000
 * }));
 *
 * // Use fbo().texture as an environment map
 * // Call update() to re-render the cube camera
 * ```
 */
export function cubeCamera(options: () => CubeCameraOptions, { injector }: { injector?: Injector } = {}) {
	return assertInjector(cubeCamera, injector, () => {
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

/**
 * Creates a reactive cube camera that renders the scene into a cube render target.
 *
 * @deprecated Use `cubeCamera` instead. Will be removed in v5.0.0.
 * @since v4.0.0
 */
export const injectCubeCamera = cubeCamera;

/**
 * Configuration options for the NgtsCubeCamera component.
 *
 * Extends `CubeCameraOptions` with additional component-specific settings
 * and allows passing through Three.js Group element properties.
 */
export type NgtsCubeCameraOptions = Partial<NgtThreeElements['ngt-group']> &
	CubeCameraOptions & {
		/**
		 * Number of frames to render the cube camera.
		 * Set to `Infinity` for continuous rendering, or a specific number
		 * to limit renders (useful for static reflections).
		 * @default Infinity
		 */
		frames: number;
	};

const defaultOptions: NgtsCubeCameraOptions = {
	frames: Infinity,
	resolution: 256,
	near: 0.1,
	far: 1000,
};

/**
 * A component that creates a cube camera for rendering environment maps and reflections.
 *
 * The cube camera captures the scene from six directions and stores the result
 * in a cube render target texture that can be used for reflections and environment mapping.
 *
 * Use the `cameraContent` directive to access the rendered texture.
 *
 * @example
 * ```html
 * <ngts-cube-camera [options]="{ resolution: 512, frames: 1 }">
 *   <ng-template cameraContent let-texture>
 *     <ngt-mesh>
 *       <ngt-sphere-geometry />
 *       <ngt-mesh-standard-material [envMap]="texture" metalness="1" roughness="0" />
 *     </ngt-mesh>
 *   </ng-template>
 * </ngts-cube-camera>
 * ```
 */
@Component({
	selector: 'ngts-cube-camera',
	template: `
		<ngt-group [parameters]="parameters()">
			<ngt-primitive *args="[camera()]" />
			<ngt-group #group>
				<ng-container
					[ngTemplateOutlet]="cameraContent() ?? null"
					[ngTemplateOutletContext]="{ $implicit: texture() }"
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

	private cubeCamera = cubeCamera(pick(this.options, ['near', 'far', 'envMap', 'fog', 'resolution']));

	protected camera = this.cubeCamera.camera;
	protected texture = pick(this.cubeCamera.fbo, 'texture');

	/**
	 * Reference to the group element containing the camera content.
	 */
	groupRef = viewChild.required<ElementRef<THREE.Group>>('group');
	protected cameraContent = contentChild(NgtsCameraContent, { read: TemplateRef });

	constructor() {
		extend({ Group });

		let count = 0;
		beforeRender(() => {
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
