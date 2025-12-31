import { NgTemplateOutlet } from '@angular/common';
import {
	CUSTOM_ELEMENTS_SCHEMA,
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	TemplateRef,
	contentChild,
	effect,
	inject,
	input,
	viewChild,
} from '@angular/core';
import { NgtElementEvents, NgtThreeElements, beforeRender, extend, injectStore, omit, pick } from 'angular-three';
import { fbo } from 'angular-three-soba/misc';
import { mergeInputs } from 'ngxtension/inject-inputs';
import * as THREE from 'three';
import { Group, PerspectiveCamera } from 'three';
import { NgtsCameraContent } from './camera-content';

/**
 * Configuration options for the NgtsPerspectiveCamera component.
 *
 * Extends Three.js perspective camera properties with additional features
 * for automatic aspect ratio handling, render-to-texture capabilities, and system camera registration.
 */
export interface NgtsPerspectiveCameraOptions extends Partial<NgtThreeElements['ngt-perspective-camera']> {
	/**
	 * When true, registers this camera as the system default camera.
	 * Angular Three will start rendering with this camera.
	 * @default false
	 */
	makeDefault?: boolean;
	/**
	 * When true, disables automatic aspect ratio calculation based on viewport size.
	 * You must manually set the aspect ratio property.
	 * @default false
	 */
	manual?: boolean;
	/**
	 * Number of frames to render to the FBO when using cameraContent.
	 * Set to `Infinity` for continuous rendering, or a specific number
	 * to limit renders (useful for static scenes).
	 * @default Infinity
	 */
	frames: number;
	/**
	 * Resolution of the frame buffer object (FBO) for render-to-texture.
	 * @default 256
	 */
	resolution: number;
	/**
	 * Optional environment map texture to use as the scene background
	 * during FBO rendering.
	 */
	envMap?: THREE.Texture;
}

const defaultOptions: NgtsPerspectiveCameraOptions = {
	frames: Infinity,
	resolution: 256,
	makeDefault: false,
	manual: false,
};

/**
 * A perspective camera component with automatic aspect ratio handling and render-to-texture support.
 *
 * This camera automatically calculates its aspect ratio based on the viewport size unless
 * `manual` mode is enabled. It supports render-to-texture via the `cameraContent` directive,
 * allowing you to capture the camera's view as a texture.
 *
 * Emits `created`, `updated`, and `attached` events through host directives.
 *
 * @example
 * ```html
 * <!-- Basic perspective camera -->
 * <ngts-perspective-camera [options]="{ makeDefault: true, position: [0, 0, 10], fov: 75 }" />
 *
 * <!-- With render-to-texture -->
 * <ngts-perspective-camera [options]="{ resolution: 512 }">
 *   <ng-template cameraContent let-texture>
 *     <ngt-mesh>
 *       <ngt-plane-geometry />
 *       <ngt-mesh-basic-material [map]="texture" />
 *     </ngt-mesh>
 *   </ng-template>
 * </ngts-perspective-camera>
 * ```
 */
@Component({
	selector: 'ngts-perspective-camera',
	template: `
		<ngt-perspective-camera #camera [parameters]="parameters()">
			<ng-container [ngTemplateOutlet]="content() ?? null" />
		</ngt-perspective-camera>

		<ngt-group #group>
			<ng-container
				[ngTemplateOutlet]="cameraContent() ?? null"
				[ngTemplateOutletContext]="{ $implicit: fbo.texture }"
			/>
		</ngt-group>
	`,
	imports: [NgTemplateOutlet],
	changeDetection: ChangeDetectionStrategy.OnPush,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	hostDirectives: [{ directive: NgtElementEvents, outputs: ['created', 'updated', 'attached'] }],
})
export class NgtsPerspectiveCamera {
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });
	protected parameters = omit(this.options, ['envMap', 'makeDefault', 'frames', 'resolution']);

	protected content = contentChild(TemplateRef);
	protected cameraContent = contentChild(NgtsCameraContent, { read: TemplateRef });

	/**
	 * Reference to the perspective camera element.
	 */
	cameraRef = viewChild.required<ElementRef<THREE.PerspectiveCamera>>('camera');
	/**
	 * Reference to the group element containing the camera content.
	 */
	groupRef = viewChild.required<ElementRef<THREE.Group>>('group');

	private elementEvents = inject(NgtElementEvents, { host: true });
	private store = injectStore();

	private manual = pick(this.options, 'manual');
	private makeDefault = pick(this.options, 'makeDefault');
	private resolution = pick(this.options, 'resolution');
	protected fbo = fbo(() => ({ width: this.resolution() }));

	constructor() {
		extend({ PerspectiveCamera, Group });
		this.elementEvents.ngtElementEvents.set(this.cameraRef);

		effect((onCleanup) => {
			const makeDefault = this.makeDefault();
			if (!makeDefault) return;

			const camera = this.cameraRef().nativeElement;
			const oldCam = this.store.snapshot.camera;
			this.store.update({ camera });
			onCleanup(() => this.store.update(() => ({ camera: oldCam })));
		});

		effect(() => {
			const camera = this.cameraRef().nativeElement;
			camera.updateProjectionMatrix();
		});

		effect(() => {
			const manual = this.manual();
			if (manual) return;
			const [camera, width, height] = [
				this.cameraRef().nativeElement,
				this.store.size.width(),
				this.store.size.height(),
			];
			camera.aspect = width / height;
			camera.updateProjectionMatrix();
		});

		let count = 0;
		let oldEnvMap: THREE.Color | THREE.Texture | null = null;
		beforeRender(({ gl, scene }) => {
			const [{ frames, envMap }, group, camera, fbo] = [
				this.options(),
				this.groupRef().nativeElement,
				this.cameraRef().nativeElement,
				this.fbo,
			];
			if (this.cameraContent() && group && camera && fbo && (frames === Infinity || count < frames)) {
				group.visible = false;
				gl.setRenderTarget(fbo);
				oldEnvMap = scene.background;
				if (envMap) scene.background = envMap;
				gl.render(scene, camera);
				scene.background = oldEnvMap;
				gl.setRenderTarget(null);
				group.visible = true;
				count++;
			}
		});
	}
}
