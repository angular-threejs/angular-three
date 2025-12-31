import {
	ChangeDetectionStrategy,
	Component,
	computed,
	CUSTOM_ELEMENTS_SCHEMA,
	effect,
	input,
	output,
} from '@angular/core';
import {
	beforeRender,
	injectStore,
	NgtArgs,
	NgtOverwrite,
	NgtThreeElement,
	NgtVector3,
	omit,
	pick,
} from 'angular-three';
import { mergeInputs } from 'ngxtension/inject-inputs';
import * as THREE from 'three';
import { TrackballControls } from 'three-stdlib';

/**
 * Configuration options for the NgtsTrackballControls component.
 *
 * Extends the standard TrackballControls options with Angular-specific
 * configuration for camera control, DOM element binding, and performance settings.
 */
export type NgtsTrackballControlsOptions = Omit<
	NgtOverwrite<
		NgtThreeElement<typeof TrackballControls>,
		{
			/**
			 * The target point to orbit around.
			 */
			target?: NgtVector3;
			/**
			 * The camera to control. Defaults to the store's camera.
			 */
			camera?: THREE.Camera;
			/**
			 * The DOM element to attach controls to. Defaults to the canvas.
			 */
			domElement?: HTMLElement;
			/**
			 * Whether to trigger performance regression when controls are active.
			 * @default false
			 */
			regress: boolean;
			/**
			 * Whether to make these the default controls in the store.
			 * @default false
			 */
			makeDefault: boolean;
		}
	>,
	'attach' | 'addEventListener' | 'removeEventListener' | 'parameters' | '___ngt_args__'
>;

const defaultOptions: NgtsTrackballControlsOptions = {
	regress: false,
	makeDefault: false,
};

/**
 * A component that provides trackball-style camera controls for the Three.js scene.
 *
 * TrackballControls allow users to rotate, zoom, and pan the camera using mouse
 * or touch input. Unlike OrbitControls, TrackballControls have no restrictions
 * on vertical rotation, allowing the camera to flip upside down.
 *
 * @example
 * ```html
 * <ngts-trackball-controls [options]="{ makeDefault: true }" />
 * ```
 *
 * @example
 * ```html
 * <ngts-trackball-controls
 *   [options]="{ regress: true }"
 *   (changed)="onControlsChange($event)"
 *   (started)="onDragStart($event)"
 *   (ended)="onDragEnd($event)"
 * />
 * ```
 */
@Component({
	selector: 'ngts-trackball-controls',
	template: `
		<ngt-primitive *args="[controls()]" [parameters]="parameters()">
			<ng-content />
		</ngt-primitive>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs],
})
export class NgtsTrackballControls {
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });
	protected parameters = omit(this.options, ['makeDefault', 'camera', 'regress', 'domElement']);

	changed = output<THREE.Event>();
	started = output<THREE.Event>();
	ended = output<THREE.Event>();

	private store = injectStore();

	private camera = pick(this.options, 'camera');
	private regress = pick(this.options, 'regress');
	private domElement = pick(this.options, 'domElement');
	private makeDefault = pick(this.options, 'makeDefault');

	protected controls = computed(() => {
		const camera = this.camera();
		if (camera) return new TrackballControls(camera as THREE.PerspectiveCamera);
		return new TrackballControls(this.store.camera());
	});

	constructor() {
		beforeRender(
			() => {
				const controls = this.controls();
				if (controls.enabled) controls.update();
			},
			{ priority: -1 },
		);

		effect((onCleanup) => {
			const makeDefault = this.makeDefault();
			if (!makeDefault) return;

			const controls = this.controls();
			const oldControls = this.store.snapshot.controls;
			this.store.update({ controls });
			onCleanup(() => void this.store.update({ controls: oldControls }));
		});

		effect((onCleanup) => {
			const [controls, domElement] = [
				this.controls(),
				this.domElement() || this.store.snapshot.events.connected || this.store.gl.domElement(),
				this.store.invalidate(),
				this.regress(),
			];
			controls.connect(domElement);
			onCleanup(() => void controls.dispose());
		});

		effect((onCleanup) => {
			const [controls, invalidate, performanceRegress, regress] = [
				this.controls(),
				this.store.invalidate(),
				this.store.performance.regress(),
				this.regress(),
			];

			const changeCallback: (e: THREE.Event) => void = (e) => {
				invalidate();
				if (regress) performanceRegress();
				this.changed.emit(e);
			};

			const startCallback = this.started.emit.bind(this.started);
			const endCallback = this.ended.emit.bind(this.ended);

			controls.addEventListener('change', changeCallback);
			controls.addEventListener('start', startCallback);
			controls.addEventListener('end', endCallback);

			onCleanup(() => {
				controls.removeEventListener('change', changeCallback);
				controls.removeEventListener('start', startCallback);
				controls.removeEventListener('end', endCallback);
			});
		});

		effect(() => {
			const [controls] = [this.controls(), this.store.viewport()];
			controls.handleResize();
		});
	}
}
