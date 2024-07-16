import {
	ChangeDetectionStrategy,
	Component,
	computed,
	CUSTOM_ELEMENTS_SCHEMA,
	effect,
	input,
	output,
} from '@angular/core';
import { extend, injectBeforeRender, injectStore, NgtArgs, NgtCamera, omit, pick } from 'angular-three';
import CameraControls from 'camera-controls';
import { mergeInputs } from 'ngxtension/inject-inputs';
import {
	Box3,
	EventDispatcher,
	MathUtils,
	Matrix4,
	Quaternion,
	Raycaster,
	Sphere,
	Spherical,
	Vector2,
	Vector3,
	Vector4,
} from 'three';

export interface NgtsCameraControlsOptions {
	camera?: NgtCamera;
	domElement?: HTMLElement;
	makeDefault: boolean;
	events: boolean;
	regress: boolean;
}

const defaultOptions: Partial<CameraControls> & NgtsCameraControlsOptions = {
	makeDefault: false,
	events: false,
	regress: false,
};

@Component({
	selector: 'ngts-camera-controls',
	standalone: true,
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
	parameters = omit(this.options, ['makeDefault', 'camera', 'regress', 'domElement']);

	changed = output<any>();
	started = output<any>();
	ended = output<any>();

	private store = injectStore();
	private invalidate = this.store.select('invalidate');
	private performanceRegress = this.store.select('performance', 'regress');
	private defaultCamera = this.store.select('camera');
	private glDomElement = this.store.select('gl', 'domElement');
	private eventsElement = this.store.select('events', 'connected');

	private camera = pick(this.options, 'camera');
	private regress = pick(this.options, 'regress');
	private domElement = pick(this.options, 'domElement');
	private makeDefault = pick(this.options, 'makeDefault');

	controls = computed(() => {
		const [camera, defaultCamera] = [this.camera(), this.defaultCamera()];
		return new CameraControls(camera || defaultCamera);
	});

	constructor() {
		// to allow for tree shaking, we only import the subset of THREE that is used by camera-controls
		// see https://github.com/yomotsu/camera-controls#important
		CameraControls.install({
			THREE: {
				Box3,
				MathUtils: { clamp: MathUtils.clamp },
				Matrix4,
				Quaternion,
				Raycaster,
				Sphere,
				Spherical,
				Vector2,
				Vector3,
				Vector4,
			},
		});
		extend({ CameraControls });

		injectBeforeRender(
			({ delta }) => {
				const controls = this.controls();
				if (controls?.enabled) {
					controls.update(delta);
				}
			},
			{ priority: -1 },
		);

		effect((onCleanup) => {
			const [domElement, eventsElement, glDomElement, controls] = [
				this.domElement(),
				this.eventsElement(),
				this.glDomElement(),
				this.controls(),
			];
			controls.connect(domElement || eventsElement || glDomElement);
			onCleanup(() => controls.disconnect());
		});

		effect((onCleanup) => {
			const [controls, regress, performanceRegress, invalidate] = [
				this.controls(),
				this.regress(),
				this.performanceRegress(),
				this.invalidate(),
			];

			const callback = (e: any) => {
				invalidate();
				if (regress) performanceRegress();
				this.changed.emit(e);
			};

			const startCallback = this.started.emit.bind(this.started);
			const endCallback = this.ended.emit.bind(this.ended);

			controls.addEventListener('update', callback);
			controls.addEventListener('controlstart', startCallback);
			controls.addEventListener('controlend', endCallback);
			controls.addEventListener('control', callback);
			controls.addEventListener('transitionstart', callback);
			controls.addEventListener('wake', callback);

			onCleanup(() => {
				controls.removeEventListener('update', callback);
				controls.removeEventListener('controlstart', startCallback);
				controls.removeEventListener('controlend', endCallback);
				controls.removeEventListener('control', callback);
				controls.removeEventListener('transitionstart', callback);
				controls.removeEventListener('wake', callback);
			});
		});

		effect((onCleanup) => {
			const [controls, makeDefault] = [this.controls(), this.makeDefault()];

			if (makeDefault) {
				const oldControls = this.store.snapshot.controls;
				this.store.update({ controls: controls as unknown as EventDispatcher });
				onCleanup(() => void this.store.update({ controls: oldControls }));
			}
		});
	}
}
