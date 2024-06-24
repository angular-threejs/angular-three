import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, effect, input, output } from '@angular/core';
import {
	exclude,
	injectBeforeRender,
	injectNgtRef,
	injectNgtStore,
	NgtArgs,
	NgtCamera,
	NgtInjectedRef,
	NgtVector3,
	pick,
} from 'angular-three';
import { mergeInputs } from 'ngxtension/inject-inputs';
import { Camera, Event } from 'three';
import { OrbitControls } from 'three-stdlib';

export interface NgtsOrbitControlsOptions {
	camera?: Camera;
	domElement?: HTMLElement;
	target?: NgtVector3;
	makeDefault: boolean;
	regress: boolean;
	enableDamping: boolean;
	keyEvents: boolean | HTMLElement;
}

declare global {
	interface HTMLElementTagNameMap {
		/**
		 * @extends three-stdlib|OrbitControls
		 */
		'ngts-orbit-controls': OrbitControls & NgtsOrbitControlsOptions;
	}
}

const defaultOptions: Partial<OrbitControls> & NgtsOrbitControlsOptions = {
	enableDamping: true,
	regress: false,
	makeDefault: false,
	keyEvents: false,
};

@Component({
	selector: 'ngts-orbit-controls',
	standalone: true,
	template: `
		<ngt-primitive ngtCompound *args="args()" [parameters]="parameters()" [enableDamping]="enableDamping()">
			<ng-content />
		</ngt-primitive>
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsOrbitControls {
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });
	parameters = exclude(this.options, ['makeDefault', 'camera', 'regress', 'domElement', 'keyEvents', 'enableDamping']);
	controlsRef = input<NgtInjectedRef<OrbitControls>>(injectNgtRef());

	changed = output<Event>();
	started = output<Event>();
	ended = output<Event>();

	private store = injectNgtStore();
	private invalidate = this.store.select('invalidate');
	private performanceRegress = this.store.select('performance', 'regress');
	private defaultCamera = this.store.select('camera');
	private glDomElement = this.store.select('gl', 'domElement');

	private camera = pick(this.options, 'camera');
	private regress = pick(this.options, 'regress');
	private keyEvents = pick(this.options, 'keyEvents');
	private domElement = pick(this.options, 'domElement');
	private makeDefault = pick(this.options, 'makeDefault');

	protected args = computed(() => [this.controlsRef().nativeElement]);
	protected enableDamping = pick(this.options, 'enableDamping');

	constructor() {
		injectBeforeRender(
			() => {
				const controls = this.controlsRef().nativeElement;
				if (controls?.enabled) {
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
			const [camera, defaultCamera, controlsRef] = [this.camera(), this.defaultCamera(), this.controlsRef()];
			const controlsCamera = camera || defaultCamera;
			if (!controlsRef.nativeElement || controlsRef.nativeElement.object !== controlsCamera) {
				controlsRef.nativeElement = new OrbitControls(controlsCamera as NgtCamera);
			}
		});
	}

	private connectElement() {
		effect((onCleanup) => {
			const [keyEvents, domElement, controls] = [
				this.keyEvents(),
				this.domElement() || this.store.get('events', 'connected') || this.glDomElement(),
				this.controlsRef().nativeElement,
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
			const [controls, makeDefault] = [this.controlsRef().nativeElement, this.makeDefault()];
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
				this.controlsRef().nativeElement,
				this.invalidate(),
				this.performanceRegress(),
				this.regress(),
			];
			if (!controls) return;
			const changeCallback: (e: Event) => void = (e) => {
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
