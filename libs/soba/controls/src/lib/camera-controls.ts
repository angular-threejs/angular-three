import {
	ChangeDetectionStrategy,
	Component,
	computed,
	CUSTOM_ELEMENTS_SCHEMA,
	effect,
	input,
	output,
} from '@angular/core';
import { beforeRender, injectStore, NgtArgs, NgtCamera, omit, pick } from 'angular-three';
import CameraControls from 'camera-controls';
import { mergeInputs } from 'ngxtension/inject-inputs';
import * as THREE from 'three';

/**
 * Configuration options for the NgtsCameraControls component.
 *
 * Extends the camera-controls library options with Angular-specific
 * configuration for camera control, DOM element binding, and performance settings.
 */
export interface NgtsCameraControlsOptions {
	/**
	 * The camera to control. Defaults to the store's camera.
	 */
	camera?: NgtCamera;
	/**
	 * The DOM element to attach controls to. Defaults to the canvas.
	 */
	domElement?: HTMLElement;
	/**
	 * Whether to make these the default controls in the store.
	 * @default false
	 */
	makeDefault: boolean;
	/**
	 * Whether to trigger performance regression when controls are active.
	 * @default false
	 */
	regress: boolean;
}

const defaultOptions: Partial<CameraControls> & NgtsCameraControlsOptions = {
	makeDefault: false,
	regress: false,
};

/**
 * A component that provides advanced camera controls using the camera-controls library.
 *
 * CameraControls offer smooth, customizable camera movements with features like
 * dolly, truck, rotate, and various transition animations. It provides more
 * advanced functionality than OrbitControls, including smooth transitions
 * and programmatic camera control.
 *
 * @see https://github.com/yomotsu/camera-controls
 *
 * @example
 * ```html
 * <ngts-camera-controls [options]="{ makeDefault: true }" />
 * ```
 *
 * @example
 * ```html
 * <ngts-camera-controls
 *   [options]="{ regress: true }"
 *   (control)="onControl($event)"
 *   (controlStart)="onControlStart($event)"
 *   (controlEnd)="onControlEnd($event)"
 *   (transitionStart)="onTransitionStart($event)"
 *   (update)="onUpdate($event)"
 *   (wake)="onWake($event)"
 *   (rest)="onRest($event)"
 *   (sleep)="onSleep($event)"
 * />
 * ```
 */
@Component({
	selector: 'ngts-camera-controls',
	template: `
		<ngt-primitive *args="[controls()]" [parameters]="parameters()">
			<ng-content />
		</ngt-primitive>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	imports: [NgtArgs],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtsCameraControls {
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });
	protected parameters = omit(this.options, ['makeDefault', 'camera', 'regress', 'domElement']);

	control = output<any>();
	controlStart = output<any>();
	controlEnd = output<any>();
	transitionStart = output<any>();
	update = output<any>();
	wake = output<any>();
	rest = output<any>();
	sleep = output<any>();

	private store = injectStore();

	private camera = pick(this.options, 'camera');
	private regress = pick(this.options, 'regress');
	private domElement = pick(this.options, 'domElement');
	private makeDefault = pick(this.options, 'makeDefault');

	controls = computed(() => {
		const [camera, defaultCamera] = [this.camera(), this.store.camera()];
		return new CameraControls(camera || defaultCamera);
	});

	constructor() {
		// to allow for tree shaking, we only import the subset of THREE that is used by camera-controls
		// see https://github.com/yomotsu/camera-controls#important
		CameraControls.install({
			THREE: {
				Box3: THREE.Box3,
				MathUtils: { clamp: THREE.MathUtils.clamp },
				Matrix4: THREE.Matrix4,
				Quaternion: THREE.Quaternion,
				Raycaster: THREE.Raycaster,
				Sphere: THREE.Sphere,
				Spherical: THREE.Spherical,
				Vector2: THREE.Vector2,
				Vector3: THREE.Vector3,
				Vector4: THREE.Vector4,
			},
		});

		effect((onCleanup) => {
			const makeDefault = this.makeDefault();
			if (!makeDefault) return;

			const controls = this.controls();
			const oldControls = this.store.snapshot.controls;
			this.store.update({ controls: controls as unknown as THREE.EventDispatcher });
			onCleanup(() => void this.store.update({ controls: oldControls }));
		});

		beforeRender(
			({ delta }) => {
				const controls = this.controls();
				controls?.update(delta);
			},
			{ priority: -1 },
		);

		effect((onCleanup) => {
			const [domElement, eventsElement, glDomElement, controls] = [
				this.domElement(),
				this.store.events.connected?.(),
				this.store.gl.domElement(),
				this.controls(),
			];
			controls.connect(domElement || eventsElement || glDomElement);
			onCleanup(() => controls.disconnect());
		});

		effect((onCleanup) => {
			const controls = this.controls();
			if (!controls) return;

			const [regress, performanceRegress, invalidate] = [
				this.regress(),
				this.store.performance.regress(),
				this.store.invalidate(),
			];

			const invalidateAndRegress = () => {
				invalidate();
				if (regress) performanceRegress();
			};

			const control = (e: any) => {
				invalidateAndRegress();
				this.control.emit(e);
			};

			const controlStart = (e: any) => {
				invalidateAndRegress();
				this.controlStart.emit(e);
			};

			const transitionStart = (e: any) => {
				invalidateAndRegress();
				this.transitionStart.emit(e);
			};

			const update = (e: any) => {
				invalidateAndRegress();
				this.update.emit(e);
			};

			const wake = (e: any) => {
				invalidateAndRegress();
				this.wake.emit(e);
			};

			const controlEnd = this.controlEnd.emit.bind(this.controlEnd);
			const rest = this.rest.emit.bind(this.rest);
			const sleep = this.sleep.emit.bind(this.sleep);

			controls.addEventListener('update', update);
			controls.addEventListener('controlstart', controlStart);
			controls.addEventListener('controlend', controlEnd);
			controls.addEventListener('control', control);
			controls.addEventListener('transitionstart', transitionStart);
			controls.addEventListener('wake', wake);
			controls.addEventListener('rest', rest);
			controls.addEventListener('sleep', sleep);

			onCleanup(() => {
				controls.removeEventListener('update', update);
				controls.removeEventListener('controlstart', controlStart);
				controls.removeEventListener('controlend', controlEnd);
				controls.removeEventListener('control', control);
				controls.removeEventListener('transitionstart', transitionStart);
				controls.removeEventListener('wake', wake);
				controls.removeEventListener('rest', rest);
				controls.removeEventListener('sleep', sleep);
			});
		});
	}
}
