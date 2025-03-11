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
import { NgtThreeElements, extend, injectBeforeRender, injectStore, omit, pick } from 'angular-three';
import { injectFBO } from 'angular-three-soba/misc';
import { mergeInputs } from 'ngxtension/inject-inputs';
import * as THREE from 'three';
import { Group, OrthographicCamera } from 'three';
import { NgtsCameraContent } from './camera-content';

export interface NgtsOrthographicCameraOptions extends Partial<NgtThreeElements['ngt-orthographic-camera']> {
	/** Registers the camera as the system default, fiber will start rendering with it */
	makeDefault?: boolean;
	/** Making it manual will stop responsiveness and you have to calculate aspect ratio yourself. */
	manual?: boolean;
	/** Number of frames to render, Infinity */
	frames: number;
	/** Resolution of the FBO, 256 */
	resolution: number;
	/** Optional environment map for functional use */
	envMap?: THREE.Texture;
}

const defaultOptions: NgtsOrthographicCameraOptions = {
	frames: Infinity,
	resolution: 256,
	makeDefault: false,
	manual: false,
};

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

	cameraRef = viewChild.required<ElementRef<THREE.OrthographicCamera>>('camera');
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

	protected fbo = injectFBO(() => ({ width: this.resolution() }));

	constructor() {
		extend({ OrthographicCamera, Group });

		effect(() => {
			this.cameraRef().nativeElement.updateProjectionMatrix();
		});

		effect(() => {
			const manual = this.manual();
			if (manual) return;

			const camera = this.cameraRef().nativeElement;
			camera.updateProjectionMatrix();
		});

		effect((onCleanup) => {
			const makeDefault = this.makeDefault();
			if (!makeDefault) return;

			const oldCam = this.store.snapshot.camera;
			this.store.update({ camera: this.cameraRef().nativeElement });
			onCleanup(() => this.store.update(() => ({ camera: oldCam })));
		});

		let count = 0;
		let oldEnvMap: THREE.Color | THREE.Texture | null = null;
		injectBeforeRender(({ gl, scene }) => {
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
