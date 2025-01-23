import {
	ChangeDetectionStrategy,
	Component,
	computed,
	CUSTOM_ELEMENTS_SCHEMA,
	effect,
	ElementRef,
	input,
	output,
	viewChild,
} from '@angular/core';
import {
	extend,
	getInstanceState,
	injectStore,
	NgtArgs,
	NgtThreeElement,
	NgtThreeElements,
	omit,
	pick,
	resolveRef,
} from 'angular-three';
import * as THREE from 'three';
import { Group } from 'three';
import { TransformControls } from 'three-stdlib';

interface ControlsProto {
	enabled: boolean;
}

export type NgtsTransformControlsObject = NgtThreeElement<typeof TransformControls>;

export type NgtsTransformControlsOptions = Partial<NgtsTransformControlsObject> &
	Partial<NgtThreeElements['ngt-group']> & {
		enabled?: boolean;
		axis?: string | null;
		domElement?: HTMLElement;
		mode?: 'translate' | 'rotate' | 'scale';
		translationSnap?: number | null;
		rotationSnap?: number | null;
		scaleSnap?: number | null;
		space?: 'world' | 'local';
		size?: number;
		showX?: boolean;
		showY?: boolean;
		showZ?: boolean;
		camera?: THREE.Camera;
		makeDefault?: boolean;
	};

@Component({
	selector: 'ngts-transform-controls',
	template: `
		<ngt-primitive *args="[controls()]" [parameters]="controlsOptions()" />

		<ngt-group #group [parameters]="parameters()">
			<ng-content />
		</ngt-group>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs],
})
export class NgtsTransformControls {
	object = input<THREE.Object3D | ElementRef<THREE.Object3D> | undefined | null>(null);
	options = input({} as Partial<NgtsTransformControlsOptions>);
	protected parameters = omit(this.options, [
		'enabled',
		'axis',
		'mode',
		'translationSnap',
		'rotationSnap',
		'scaleSnap',
		'space',
		'size',
		'showX',
		'showY',
		'showZ',
		'domElement',
		'makeDefault',
		'camera',
	]);

	protected controlsOptions = pick(this.options, [
		'enabled',
		'axis',
		'mode',
		'translationSnap',
		'rotationSnap',
		'scaleSnap',
		'space',
		'size',
		'showX',
		'showY',
		'showZ',
	]);

	private camera = pick(this.options, 'camera');
	private domElement = pick(this.options, 'domElement');
	private makeDefault = pick(this.options, 'makeDefault');

	change = output<THREE.Event>();
	mouseDown = output<THREE.Event>();
	mouseUp = output<THREE.Event>();
	objectChange = output<THREE.Event>();

	groupRef = viewChild.required<ElementRef<THREE.Group>>('group');

	private store = injectStore();

	controls = computed(() => {
		let camera = this.camera();
		if (!camera) {
			camera = this.store.camera();
		}

		let domElement = this.domElement();
		if (!domElement) {
			domElement = this.store.events().connected || this.store.gl.domElement();
		}

		return new TransformControls(camera, domElement);
	});

	constructor() {
		extend({ Group });
		effect((onCleanup) => {
			const cleanup = this.attachControlsEffect();
			onCleanup(() => cleanup?.());
		});
		effect((onCleanup) => {
			const cleanup = this.disableDefaultControlsEffect();
			onCleanup(() => cleanup?.());
		});
		effect((onCleanup) => {
			const cleanup = this.setupControlsEventsEffect();
			onCleanup(() => cleanup?.());
		});
		effect((onCleanup) => {
			const cleanup = this.updateDefaultControlsEffect();
			onCleanup(() => cleanup?.());
		});
	}

	private attachControlsEffect() {
		const group = this.groupRef().nativeElement;
		if (!group) return;

		const instanceState = getInstanceState(group);
		if (!instanceState) return;

		const [object, controls] = [resolveRef(this.object()), this.controls(), instanceState.objects()];
		if (object) {
			controls.attach(object);
		} else {
			controls.attach(group);
		}

		return () => controls.detach();
	}

	private disableDefaultControlsEffect() {
		const defaultControls = this.store.controls() as unknown as ControlsProto;
		if (!defaultControls) return;

		const controls = this.controls();
		const callback = (event: any) => {
			defaultControls.enabled = !event.value;
		};

		// @ts-expect-error - three-stdlib types are not up-to-date
		controls.addEventListener('dragging-changed', callback);
		return () => {
			// @ts-expect-error - three-stdlib types are not up-to-date
			controls.removeEventListener('dragging-changed', callback);
		};
	}

	private setupControlsEventsEffect() {
		const [controls, invalidate] = [this.controls(), this.store.invalidate()];
		const onChange = (event: THREE.Event) => {
			invalidate();
			if (!this.change['destroyed']) {
				this.change.emit(event);
			}
		};
		const onMouseDown = this.mouseDown.emit.bind(this.mouseDown);
		const onMouseUp = this.mouseUp.emit.bind(this.mouseUp);
		const onObjectChange = this.objectChange.emit.bind(this.objectChange);

		// @ts-expect-error - three-stdlib types are not up-to-date
		controls.addEventListener('change', onChange);
		// @ts-expect-error - three-stdlib types are not up-to-date
		controls.addEventListener('mouseDown', onMouseDown);
		// @ts-expect-error - three-stdlib types are not up-to-date
		controls.addEventListener('mouseUp', onMouseUp);
		// @ts-expect-error - three-stdlib types are not up-to-date
		controls.addEventListener('objectChange', onObjectChange);

		return () => {
			// @ts-expect-error - three-stdlib types are not up-to-date
			controls.removeEventListener('change', onChange);
			// @ts-expect-error - three-stdlib types are not up-to-date
			controls.removeEventListener('mouseDown', onMouseDown);
			// @ts-expect-error - three-stdlib types are not up-to-date
			controls.removeEventListener('mouseUp', onMouseUp);
			// @ts-expect-error - three-stdlib types are not up-to-date
			controls.removeEventListener('objectChange', onObjectChange);
		};
	}

	private updateDefaultControlsEffect() {
		const [controls, makeDefault] = [this.controls(), this.makeDefault()];
		if (!makeDefault) return;

		const oldControls = this.store.snapshot.controls;
		this.store.update({ controls });
		return () => this.store.update(() => ({ controls: oldControls }));
	}
}
