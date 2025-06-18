import {
	ChangeDetectionStrategy,
	Component,
	computed,
	CUSTOM_ELEMENTS_SCHEMA,
	DOCUMENT,
	effect,
	inject,
	input,
	output,
	untracked,
} from '@angular/core';
import { injectStore, NgtArgs, NgtOverwrite, NgtThreeElement, omit, pick } from 'angular-three';
import { mergeInputs } from 'ngxtension/inject-inputs';
import * as THREE from 'three';
import { PointerLockControls } from 'three-stdlib';

export type NgtsPointerLockControlsOptions = Omit<
	NgtOverwrite<
		NgtThreeElement<typeof PointerLockControls>,
		{
			camera?: THREE.Camera;
			domElement?: HTMLElement;
			makeDefault: boolean;
			enabled: boolean;
			selector?: string;
		}
	>,
	'attach' | 'addEventListener' | 'removeEventListener' | 'parameters' | '___ngt_args__' | '_domElementKeyEvents'
>;

const defaultOptions: NgtsPointerLockControlsOptions = {
	enabled: true,
	makeDefault: false,
};

@Component({
	selector: 'ngts-pointer-lock-controls',
	template: `
		<ngt-primitive *args="[controls()]" [parameters]="parameters()">
			<ng-content />
		</ngt-primitive>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsPointerLockControls {
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });

	lock = output<THREE.Event>();
	unlock = output<THREE.Event>();
	change = output<THREE.Event>();

	protected parameters = omit(this.options, ['camera', 'domElement', 'makeDefault', 'enabled', 'selector']);

	private document = inject(DOCUMENT);
	private store = injectStore();

	private camera = pick(this.options, 'camera');
	private domElement = pick(this.options, 'domElement');
	private makeDefault = pick(this.options, 'makeDefault');
	private enabled = pick(this.options, 'enabled');
	private selector = pick(this.options, 'selector');

	controls = computed(() => {
		const [camera, defaultCamera] = [this.camera(), this.store.camera()];
		const controlsCamera = camera || defaultCamera;
		return new PointerLockControls(controlsCamera);
	});

	private element = computed(() => {
		const domElement = this.domElement();
		if (domElement) return domElement;

		const connected = this.store.events.connected?.();
		if (connected) return connected;

		return this.store.gl.domElement();
	});

	constructor() {
		effect((onCleanup) => {
			const makeDefault = this.makeDefault();
			if (!makeDefault) return;

			const controls = this.controls();
			const oldControls = this.store.snapshot.controls;
			this.store.update({ controls });
			onCleanup(() => void this.store.update({ controls: oldControls }));
		});

		effect((onCleanup) => {
			const controls = this.controls();
			if (!controls) return;

			const enabled = this.enabled();
			if (!enabled) return;

			controls.connect(untracked(this.element));
			// force events to be centered while PLC is active
			const oldComputeOffsets = this.store.snapshot.events.compute;

			this.store.update((prevState) => ({
				events: {
					...prevState.events,
					compute(event, root) {
						const state = root.snapshot;
						const offsetX = state.size.width / 2;
						const offsetY = state.size.height / 2;
						state.pointer.set((offsetX / state.size.width) * 2 - 1, -(offsetY / state.size.height) * 2 + 1);
						state.raycaster.setFromCamera(state.pointer, state.camera);
					},
				},
			}));

			onCleanup(() => {
				controls.disconnect();
				this.store.update((prevState) => ({
					events: { ...prevState.events, compute: oldComputeOffsets },
				}));
			});
		});

		effect((onCleanup) => {
			const [controls, invalidate, selector] = [this.controls(), this.store.invalidate(), this.selector()];

			const callback = (e: THREE.Event) => {
				invalidate();
				if (this.change) this.change.emit(e);
			};

			const lockCallback = this.lock.emit.bind(this.lock);
			const unlockCallback = this.unlock.emit.bind(this.unlock);

			controls.addEventListener('change', callback);
			controls.addEventListener('lock', lockCallback);
			controls.addEventListener('unlock', unlockCallback);

			// enforce previous interaction
			const handler = controls.lock.bind(controls);
			const elements = selector ? Array.from(this.document.querySelectorAll(selector)) : [this.document];
			for (const element of elements) {
				if (!element) continue;
				element.addEventListener('click', handler);
			}

			onCleanup(() => {
				controls.removeEventListener('change', callback);
				controls.removeEventListener('lock', lockCallback);
				controls.removeEventListener('unlock', unlockCallback);

				for (const element of elements) {
					if (!element) continue;
					element.removeEventListener('click', handler);
				}
			});
		});
	}
}
