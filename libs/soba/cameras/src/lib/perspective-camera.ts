import { NgTemplateOutlet } from '@angular/common';
import {
	CUSTOM_ELEMENTS_SCHEMA,
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	TemplateRef,
	afterNextRender,
	contentChild,
	input,
	untracked,
	viewChild,
} from '@angular/core';
import { NgtPerspectiveCamera, extend, injectBeforeRender, injectStore, omit, pick } from 'angular-three-core-new';
import { injectFBO } from 'angular-three-soba/misc';
import { injectAutoEffect } from 'ngxtension/auto-effect';
import { mergeInputs } from 'ngxtension/inject-inputs';
import { Color, Group, PerspectiveCamera, Texture } from 'three';
import { NgtsCameraContentWithFboTexture } from './camera-content';

extend({ PerspectiveCamera, Group });

export interface NgtsPerspectiveCameraOptions extends Partial<NgtPerspectiveCamera> {
	/** Registers the camera as the system default, fiber will start rendering with it */
	makeDefault?: boolean;
	/** Making it manual will stop responsiveness and you have to calculate aspect ratio yourself. */
	manual?: boolean;
	/** Number of frames to render, Infinity */
	frames: number;
	/** Resolution of the FBO, 256 */
	resolution: number;
	/** Optional environment map for functional use */
	envMap?: Texture;
}

const defaultOptions: NgtsPerspectiveCameraOptions = {
	frames: Infinity,
	resolution: 256,
	makeDefault: false,
	manual: false,
};

@Component({
	selector: 'ngts-perspective-camera',
	standalone: true,
	template: `
		<ngt-perspective-camera #camera [parameters]="parameters()">
			<ng-content select="[camera-content]" />
		</ngt-perspective-camera>

		<ngt-group #group>
			<ng-container
				[ngTemplateOutlet]="withTextureContent() ?? null"
				[ngTemplateOutletContext]="{ $implicit: texture }"
			/>
		</ngt-group>
	`,
	imports: [NgTemplateOutlet],
	changeDetection: ChangeDetectionStrategy.OnPush,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsPerspectiveCamera {
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });
	parameters = omit(this.options, ['envMap', 'makeDefault', 'manual', 'frames', 'resolution']);

	cameraRef = viewChild.required<ElementRef<PerspectiveCamera>>('camera');
	groupRef = viewChild.required<ElementRef<Group>>('group');

	withTextureContent = contentChild(NgtsCameraContentWithFboTexture, { read: TemplateRef });

	private resolution = pick(this.options, 'resolution');
	private fbo = injectFBO(() => ({ width: this.resolution() }));
	texture = pick(this.fbo, 'texture');

	constructor() {
		const autoEffect = injectAutoEffect();
		const store = injectStore();

		const _camera = store.select('camera');
		const _size = store.select('size');
		const manual = pick(this.options, 'manual');
		const makeDefault = pick(this.options, 'makeDefault');

		afterNextRender(() => {
			autoEffect(() => {
				if (!manual()) {
					this.cameraRef().nativeElement.aspect = _size().width / _size().height;
				}
			});

			autoEffect(() => {
				if (makeDefault()) {
					const oldCam = untracked(_camera);
					store.update({ camera: this.cameraRef().nativeElement });
					return () => store.update(() => ({ camera: oldCam }));
				}
				return;
			});

			this.cameraRef().nativeElement.aspect = _size().width / _size().height;
		});

		let count = 0;
		let oldEnvMap: Color | Texture | null = null;
		injectBeforeRender(({ gl, scene }) => {
			const [{ frames, envMap }, group, camera, fbo] = [
				this.options(),
				this.groupRef().nativeElement,
				this.cameraRef().nativeElement,
				this.fbo(),
			];
			if (this.withTextureContent() && group && camera && fbo && (frames === Infinity || count < frames)) {
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
