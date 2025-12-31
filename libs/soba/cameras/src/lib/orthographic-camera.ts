import { NgTemplateOutlet } from '@angular/common';
import {
	CUSTOM_ELEMENTS_SCHEMA,
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	TemplateRef,
	computed,
	contentChild,
	effect,
	input,
	viewChild,
} from '@angular/core';
import { NgtThreeElements, beforeRender, extend, injectStore, omit, pick } from 'angular-three';
import { fbo } from 'angular-three-soba/misc';
import { mergeInputs } from 'ngxtension/inject-inputs';
import * as THREE from 'three';
import { Group, OrthographicCamera } from 'three';
import { NgtsCameraContent } from './camera-content';

/**
 * Configuration options for the NgtsOrthographicCamera component.
 *
 * Extends Three.js orthographic camera properties with additional features
 * for automatic aspect ratio handling, render-to-texture capabilities, and system camera registration.
 */
export interface NgtsOrthographicCameraOptions extends Partial<NgtThreeElements['ngt-orthographic-camera']> {
	/**
	 * When true, registers this camera as the system default camera.
	 * Angular Three will start rendering with this camera.
	 * @default false
	 */
	makeDefault?: boolean;
	/**
	 * When true, disables automatic frustum calculation based on viewport size.
	 * You must manually set left, right, top, and bottom properties.
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

const defaultOptions: NgtsOrthographicCameraOptions = {
	frames: Infinity,
	resolution: 256,
	makeDefault: false,
	manual: false,
};

/**
 * An orthographic camera component with automatic frustum sizing and render-to-texture support.
 *
 * This camera automatically calculates its frustum based on the viewport size unless
 * `manual` mode is enabled. It supports render-to-texture via the `cameraContent` directive,
 * allowing you to capture the camera's view as a texture.
 *
 * @example
 * ```html
 * <!-- Basic orthographic camera -->
 * <ngts-orthographic-camera [options]="{ makeDefault: true, position: [0, 0, 10] }" />
 *
 * <!-- With render-to-texture -->
 * <ngts-orthographic-camera [options]="{ resolution: 512 }">
 *   <ng-template cameraContent let-texture>
 *     <ngt-mesh>
 *       <ngt-plane-geometry />
 *       <ngt-mesh-basic-material [map]="texture" />
 *     </ngt-mesh>
 *   </ng-template>
 * </ngts-orthographic-camera>
 * ```
 */
@Component({
	selector: 'ngts-orthographic-camera',
	template: `
		<ngt-orthographic-camera
			#camera
			[left]="left()"
			[right]="right()"
			[top]="top()"
			[bottom]="bottom()"
			[parameters]="parameters()"
		>
			<ng-container [ngTemplateOutlet]="content() ?? null" />
		</ngt-orthographic-camera>

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
})
export class NgtsOrthographicCamera {
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });
	protected parameters = omit(this.options, [
		'envMap',
		'makeDefault',
		'frames',
		'resolution',
		'left',
		'top',
		'bottom',
		'right',
	]);

	protected content = contentChild(TemplateRef);
	protected cameraContent = contentChild(NgtsCameraContent, { read: TemplateRef });

	/**
	 * Reference to the orthographic camera element.
	 */
	cameraRef = viewChild.required<ElementRef<THREE.OrthographicCamera>>('camera');
	/**
	 * Reference to the group element containing the camera content.
	 */
	groupRef = viewChild.required<ElementRef<THREE.Group>>('group');

	private store = injectStore();

	private _left = pick(this.options, 'left');
	private _right = pick(this.options, 'right');
	private _top = pick(this.options, 'top');
	private _bottom = pick(this.options, 'bottom');

	protected left = computed(() => this._left() ?? this.store.size.width() / -2);
	protected right = computed(() => this._right() ?? this.store.size.width() / 2);
	protected top = computed(() => this._top() ?? this.store.size.height() / 2);
	protected bottom = computed(() => this._bottom() ?? this.store.size.height() / -2);

	private manual = pick(this.options, 'manual');
	private makeDefault = pick(this.options, 'makeDefault');
	private resolution = pick(this.options, 'resolution');

	protected fbo = fbo(() => ({ width: this.resolution() }));

	constructor() {
		extend({ OrthographicCamera, Group });

		effect((onCleanup) => {
			const makeDefault = this.makeDefault();
			if (!makeDefault) return;

			const oldCam = this.store.snapshot.camera;
			this.store.update({ camera: this.cameraRef().nativeElement });
			onCleanup(() => this.store.update(() => ({ camera: oldCam })));
		});

		effect(() => {
			this.cameraRef().nativeElement.updateProjectionMatrix();
		});

		effect(() => {
			const manual = this.manual();
			if (manual) return;

			const camera = this.cameraRef().nativeElement;
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
