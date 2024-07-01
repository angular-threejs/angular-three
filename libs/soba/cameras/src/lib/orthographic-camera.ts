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
import { NgtOrthographicCamera, extend, injectBeforeRender, injectStore, omit, pick } from 'angular-three-core-new';
import { injectFBO } from 'angular-three-soba/misc';
import { injectAutoEffect } from 'ngxtension/auto-effect';
import { mergeInputs } from 'ngxtension/inject-inputs';
import { Color, Group, OrthographicCamera, Texture } from 'three';
import { NgtsCameraContentWithFboTexture } from './camera-content';

extend({ OrthographicCamera, Group });

export interface NgtsOrthographicCameraOptions extends Partial<NgtOrthographicCamera> {
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

const defaultOptions: NgtsOrthographicCameraOptions = {
	frames: Infinity,
	resolution: 256,
	makeDefault: false,
	manual: false,
};

@Component({
	selector: 'ngts-orthographic-camera',
	standalone: true,
	template: `
		<ngt-orthographic-camera
			#camera
			[left]="size().width / -2"
			[right]="size().width / 2"
			[top]="size().height / 2"
			[bottom]="size().height / -2"
			[parameters]="parameters()"
		>
			<ng-content select="[camera-content]" />
		</ngt-orthographic-camera>

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
export class NgtsOrthographicCamera {
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });
	parameters = omit(this.options, ['envMap', 'makeDefault', 'manual', 'frames', 'resolution']);

	cameraRef = viewChild.required<ElementRef<OrthographicCamera>>('camera');
	groupRef = viewChild.required<ElementRef<Group>>('group');

	withTextureContent = contentChild(NgtsCameraContentWithFboTexture, { read: TemplateRef });

	private store = injectStore();
	size = this.store.select('size');

	private resolution = pick(this.options, 'resolution');
	private fbo = injectFBO(() => ({ width: this.resolution() }));
	texture = pick(this.fbo, 'texture');

	constructor() {
		const autoEffect = injectAutoEffect();
		const _camera = this.store.select('camera');

		const _manual = pick(this.options, 'manual');
		const _makeDefault = pick(this.options, 'makeDefault');

		afterNextRender(() => {
			autoEffect(() => {
				if (!_manual()) {
					this.cameraRef().nativeElement.updateProjectionMatrix();
				}
			});

			autoEffect(() => {
				if (_makeDefault()) {
					const oldCam = untracked(_camera);
					this.store.update({ camera: this.cameraRef().nativeElement });
					return () => this.store.update(() => ({ camera: oldCam }));
				}
				return;
			});

			this.cameraRef().nativeElement.updateProjectionMatrix();
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
