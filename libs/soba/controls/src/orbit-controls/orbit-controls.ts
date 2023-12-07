import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, effect, EventEmitter, Input, Output } from '@angular/core';
import {
	injectBeforeRender,
	injectNgtRef,
	injectNgtStore,
	NgtArgs,
	signalStore,
	type NgtCamera,
	type NgtVector3,
} from 'angular-three';
import { OrbitControls } from 'three-stdlib';

export type NgtsOrbitControlsState = {
	camera?: THREE.Camera;
	domElement?: HTMLElement;
	target?: NgtVector3;
	makeDefault: boolean;
	regress: boolean;
	enableDamping: boolean;
	keyEvents: boolean | HTMLElement;
};

declare global {
	interface HTMLElementTagNameMap {
		/**
		 * @extends three-stdlib|OrbitControls
		 */
		'ngts-orbit-controls': OrbitControls & NgtsOrbitControlsState;
	}
}

@Component({
	selector: 'ngts-orbit-controls',
	standalone: true,
	template: `
		<ngt-primitive ngtCompound *args="args()" [enableDamping]="enableDamping()">
			<ng-content />
		</ngt-primitive>
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsOrbitControls {
	private options = signalStore<NgtsOrbitControlsState>({
		enableDamping: true,
		regress: false,
		makeDefault: false,
		keyEvents: false,
	});

	@Input({ alias: 'options' }) set _options(options: Partial<NgtsOrbitControlsState>) {
		this.options.update(options);
	}

	@Input() controlsRef = injectNgtRef<OrbitControls>();

	@Output() change = new EventEmitter<THREE.Event>();
	@Output() start = new EventEmitter<THREE.Event>();
	@Output() end = new EventEmitter<THREE.Event>();

	private store = injectNgtStore();
	private invalidate = this.store.select('invalidate');
	private performanceRegress = this.store.select('performance', 'regress');
	private defaultCamera = this.store.select('camera');
	private glDomElement = this.store.select('gl', 'domElement');
	private regress = this.options.select('regress');
	private camera = this.options.select('camera');
	private domElement = this.options.select('domElement');
	private keyEvents = this.options.select('keyEvents');
	private makeDefault = this.options.select('makeDefault');

	protected args = computed(() => [this.controlsRef.nativeElement]);
	protected enableDamping = this.options.select('enableDamping');

	constructor() {
		injectBeforeRender(
			() => {
				const controls = this.controlsRef.nativeElement;
				if (controls && controls.enabled) {
					controls.update();
				}
			},
			{ priority: -1 },
		);

		this.setControls();
		this.connectElement();
		this.makeControlsDefault();
		this.setEvents();
	}

	private setControls() {
		effect(() => {
			const [camera, defaultCamera, controls] = [this.camera(), this.defaultCamera(), this.controlsRef.nativeElement];
			const controlsCamera = camera || defaultCamera;
			if (!controls || controls.object !== controlsCamera) {
				this.controlsRef.nativeElement = new OrbitControls(controlsCamera as NgtCamera);
			}
		});
	}

	private connectElement() {
		effect((onCleanup) => {
			const [keyEvents, domElement, controls] = [
				this.keyEvents(),
				this.domElement() || this.store.get('events', 'connected') || this.glDomElement(),
				this.controlsRef.nativeElement,
				this.invalidate(),
				this.regress(),
			];
			if (!controls) return;
			if (keyEvents) {
				controls.connect(keyEvents === true ? domElement : keyEvents);
			} else {
				controls.connect(domElement);
			}
			onCleanup(() => void controls.dispose());
		});
	}

	private makeControlsDefault() {
		effect((onCleanup) => {
			const [controls, makeDefault] = [this.controlsRef.nativeElement, this.makeDefault()];
			if (!controls) return;
			if (makeDefault) {
				const oldControls = this.store.get('controls');
				this.store.update({ controls });
				onCleanup(() => void this.store.update({ controls: oldControls }));
			}
		});
	}

	private setEvents() {
		effect((onCleanup) => {
			const [controls, invalidate, performanceRegress, regress] = [
				this.controlsRef.nativeElement,
				this.invalidate(),
				this.performanceRegress(),
				this.regress(),
			];
			if (!controls) return;
			const changeCallback: (e: THREE.Event) => void = (e) => {
				invalidate();
				if (regress) performanceRegress();
				if (this.change.observed) this.change.emit(e);
			};

			const startCallback = this.start.observed ? this.start.emit.bind(this.start) : null;
			const endCallback = this.end.observed ? this.end.emit.bind(this.end) : null;

			controls.addEventListener('change', changeCallback);
			if (startCallback) controls.addEventListener('start', startCallback);
			if (endCallback) controls.addEventListener('end', endCallback);

			onCleanup(() => {
				controls.removeEventListener('change', changeCallback);
				if (startCallback) controls.removeEventListener('start', startCallback);
				if (endCallback) controls.removeEventListener('end', endCallback);
			});
		});
	}
}
