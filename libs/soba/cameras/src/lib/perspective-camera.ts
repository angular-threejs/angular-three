import { NgTemplateOutlet } from '@angular/common';
import {
	CUSTOM_ELEMENTS_SCHEMA,
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	TemplateRef,
	contentChild,
	effect,
	input,
	untracked,
	viewChild,
} from '@angular/core';
import { NgtPerspectiveCamera, extend, injectBeforeRender, injectStore, omit, pick } from 'angular-three';
import { injectFBO } from 'angular-three-soba/misc';
import { mergeInputs } from 'ngxtension/inject-inputs';
import { Color, Group, PerspectiveCamera, Texture } from 'three';
import { NgtsCameraContent } from './camera-content';

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
	template: `
		<ngt-perspective-camera #camera [parameters]="parameters()">
			<ng-container [ngTemplateOutlet]="content() ?? null" />
		</ngt-perspective-camera>

		<ngt-group #group>
			<ng-container [ngTemplateOutlet]="cameraContent() ?? null" [ngTemplateOutletContext]="{ $implicit: texture }" />
		</ngt-group>
	`,
	imports: [NgTemplateOutlet],
	changeDetection: ChangeDetectionStrategy.OnPush,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsPerspectiveCamera {
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });
	protected parameters = omit(this.options, ['envMap', 'makeDefault', 'manual', 'frames', 'resolution']);

	content = contentChild(TemplateRef);
	cameraContent = contentChild(NgtsCameraContent, { read: TemplateRef });

	cameraRef = viewChild.required<ElementRef<PerspectiveCamera>>('camera');
	groupRef = viewChild.required<ElementRef<Group>>('group');

	private store = injectStore();

	private camera = this.store.select('camera');
	private size = this.store.select('size');

	private manual = pick(this.options, 'manual');
	private makeDefault = pick(this.options, 'makeDefault');
	private resolution = pick(this.options, 'resolution');
	private fbo = injectFBO(() => ({ width: this.resolution() }));
	protected texture = pick(this.fbo, 'texture');

	constructor() {
		extend({ PerspectiveCamera, Group });

		effect(() => {
			this.cameraRef().nativeElement.updateProjectionMatrix();
		});

		effect(() => {
			const manual = this.manual();
			if (manual) return;
			const [camera, size] = [this.cameraRef().nativeElement, this.size()];
			camera.aspect = size.width / size.height;
			camera.updateProjectionMatrix();
		});

		effect((onCleanup) => {
			const makeDefault = this.makeDefault();
			if (!makeDefault) return;

			const oldCam = untracked(this.camera);
			this.store.update({ camera: this.cameraRef().nativeElement });
			onCleanup(() => this.store.update(() => ({ camera: oldCam })));
		});
		/**/
		let count = 0;
		let oldEnvMap: Color | Texture | null = null;
		injectBeforeRender(({ gl, scene }) => {
			const [{ frames, envMap }, group, camera, fbo] = [
				this.options(),
				this.groupRef().nativeElement,
				this.cameraRef().nativeElement,
				this.fbo(),
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
