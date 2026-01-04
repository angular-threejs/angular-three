import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, effect, input, output } from '@angular/core';
import {
	beforeRender,
	injectStore,
	NgtArgs,
	NgtCamera,
	NgtOverwrite,
	NgtThreeElement,
	NgtVector3,
	omit,
	pick,
} from 'angular-three';
import { mergeInputs } from 'ngxtension/inject-inputs';
import * as THREE from 'three';
import { OrbitControls } from 'three-stdlib';

type ExtractCallback<T, E extends string> = T extends { addEventListener(event: E, callback: infer C): void }
	? C
	: never;

/**
 * Event emitted when the OrbitControls change (camera moves).
 */
export type OrbitControlsChangeEvent = Parameters<ExtractCallback<OrbitControls, 'change'>>[0];

/**
 * Configuration options for the NgtsOrbitControls component.
 *
 * Extends the standard OrbitControls options with Angular-specific
 * configuration for camera control, DOM element binding, and performance settings.
 */
export type NgtsOrbitControlsOptions = Omit<
	NgtOverwrite<
		NgtThreeElement<typeof OrbitControls>,
		{
			/**
			 * The camera to control. Defaults to the store's camera.
			 */
			camera?: THREE.Camera;
			/**
			 * The DOM element to attach controls to. Defaults to the canvas.
			 */
			domElement?: HTMLElement;
			/**
			 * The target point to orbit around.
			 */
			target?: NgtVector3;
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
			/**
			 * Whether to enable damping (inertia) for smooth camera movement.
			 * @default true
			 */
			enableDamping: boolean;
			/**
			 * Whether to enable keyboard controls, or a specific element to listen for key events.
			 * @default false
			 */
			keyEvents: boolean | HTMLElement;
		}
	>,
	'attach' | 'addEventListener' | 'removeEventListener' | 'parameters' | '___ngt_args__' | '_domElementKeyEvents'
>;

const defaultOptions: NgtsOrbitControlsOptions = {
	enableDamping: true,
	regress: false,
	makeDefault: false,
	keyEvents: false,
};

/**
 * A component that provides orbit-style camera controls for the Three.js scene.
 *
 * OrbitControls allow users to rotate, zoom, and pan the camera around a target point
 * using mouse or touch input. The camera is constrained to orbit around the target,
 * preventing it from flipping upside down.
 *
 * @example
 * ```html
 * <ngts-orbit-controls [options]="{ makeDefault: true }" />
 * ```
 *
 * @example
 * ```html
 * <ngts-orbit-controls
 *   [options]="{ enableDamping: true, regress: true }"
 *   (changed)="onControlsChange($event)"
 *   (started)="onDragStart($event)"
 *   (ended)="onDragEnd($event)"
 * />
 * ```
 */
@Component({
	selector: 'ngts-orbit-controls',
	template: `
		<ngt-primitive *args="[controls()]" [parameters]="parameters()" [enableDamping]="enableDamping()">
			<ng-content />
		</ngt-primitive>
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsOrbitControls {
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });
	protected parameters = omit(this.options, [
		'makeDefault',
		'camera',
		'regress',
		'domElement',
		'keyEvents',
		'enableDamping',
	]);

	changed = output<OrbitControlsChangeEvent>();
	started = output<THREE.Event>();
	ended = output<THREE.Event>();

	private store = injectStore();

	private camera = pick(this.options, 'camera');
	private regress = pick(this.options, 'regress');
	private keyEvents = pick(this.options, 'keyEvents');
	private domElement = pick(this.options, 'domElement');
	private makeDefault = pick(this.options, 'makeDefault');

	controls = computed(() => {
		const [camera, defaultCamera] = [this.camera(), this.store.camera()];
		const controlsCamera = camera || defaultCamera;
		return new OrbitControls(controlsCamera as NgtCamera);
	});

	protected enableDamping = pick(this.options, 'enableDamping');

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
			const [controls, keyEvents, domElement] = [
				this.controls(),
				this.keyEvents(),
				this.domElement() || this.store.snapshot.events.connected || this.store.gl.domElement(),
				this.store.invalidate(),
				this.regress(),
			];

			if (keyEvents) {
				controls.connect(keyEvents === true ? domElement : keyEvents);
			} else {
				controls.connect(domElement);
			}
			onCleanup(() => void controls.dispose());
		});

		effect((onCleanup) => {
			const [controls, invalidate, performanceRegress, regress] = [
				this.controls(),
				this.store.invalidate(),
				this.store.performance.regress(),
				this.regress(),
			];

			const changeCallback: (e: OrbitControlsChangeEvent) => void = (e) => {
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
	}
}
