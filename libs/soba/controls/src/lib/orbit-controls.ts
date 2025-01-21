import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, effect, input, output } from '@angular/core';
import { injectBeforeRender, injectStore, NgtArgs, NgtCamera, NgtVector3, omit, pick } from 'angular-three';
import { mergeInputs } from 'ngxtension/inject-inputs';
import * as THREE from 'three';
import { OrbitControls } from 'three-stdlib';

export interface NgtsOrbitControlsOptions {
	camera?: THREE.Camera;
	domElement?: HTMLElement;
	target?: NgtVector3;
	makeDefault: boolean;
	regress: boolean;
	enableDamping: boolean;
	keyEvents: boolean | HTMLElement;
}

const defaultOptions: Partial<OrbitControls> & NgtsOrbitControlsOptions = {
	enableDamping: true,
	regress: false,
	makeDefault: false,
	keyEvents: false,
};

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

	changed = output<THREE.Event>();
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
		injectBeforeRender(
			() => {
				const controls = this.controls();
				if (controls?.enabled) {
					controls.update();
				}
			},
			{ priority: -1 },
		);

		effect((onCleanup) => {
			const makeDefault = this.makeDefault();
			if (!makeDefault) return;

			const controls = this.controls();
			if (!controls) return;

			const oldControls = this.store.snapshot.controls;
			this.store.update({ controls });
			onCleanup(() => void this.store.update({ controls: oldControls }));
		});

		effect((onCleanup) => {
			const controls = this.controls();
			if (!controls) return;

			const [keyEvents, domElement] = [
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
			const controls = this.controls();
			if (!controls) return;

			const [invalidate, performanceRegress, regress] = [
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
	}
}
