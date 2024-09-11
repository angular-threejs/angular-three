import {
	ChangeDetectionStrategy,
	Component,
	computed,
	CUSTOM_ELEMENTS_SCHEMA,
	effect,
	ElementRef,
	input,
	output,
	Signal,
	viewChild,
} from '@angular/core';
import {
	extend,
	getLocalState,
	injectStore,
	NgtArgs,
	NgtGroup,
	NgtObject3DNode,
	omit,
	pick,
	resolveRef,
} from 'angular-three';
import { Camera, Group, Object3D, Event as ThreeEvent } from 'three';
import { TransformControls } from 'three-stdlib';

interface ControlsProto {
	enabled: boolean;
}

export type NgtsTransformControlsObject = NgtObject3DNode<TransformControls, typeof TransformControls>;

export type NgtsTransformControlsOptions = Partial<NgtsTransformControlsObject> &
	Partial<NgtGroup> & {
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
		camera?: Camera;
		makeDefault?: boolean;
	};

@Component({
	selector: 'ngts-transform-controls',
	standalone: true,
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
	object = input<Object3D | ElementRef<Object3D> | undefined | null>(null);
	options = input({} as Partial<NgtsTransformControlsOptions>);
	parameters = omit(this.options, [
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

	change = output<ThreeEvent>();
	mouseDown = output<ThreeEvent>();
	mouseUp = output<ThreeEvent>();
	objectChange = output<ThreeEvent>();

	private groupRef = viewChild.required<ElementRef<Group>>('group');

	private store = injectStore();
	private glDomElement = this.store.select('gl', 'domElement');
	private defaultCamera = this.store.select('camera');
	private events = this.store.select('events');
	private defaultControls = this.store.select('controls') as unknown as Signal<ControlsProto>;
	private invalidate = this.store.select('invalidate');

	controls = computed(() => {
		let camera = this.camera();
		if (!camera) {
			camera = this.defaultCamera();
		}

		let domElement = this.domElement();
		if (!domElement) {
			domElement = this.events().connected || this.glDomElement();
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

		const localState = getLocalState(group);
		if (!localState) return;

		const [object, controls] = [resolveRef(this.object()), this.controls(), localState.objects()];
		if (object) {
			controls.attach(object);
		} else {
			controls.attach(group);
		}

		return () => controls.detach();
	}

	private disableDefaultControlsEffect() {
		const defaultControls = this.defaultControls();
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
		const [controls, invalidate] = [this.controls(), this.invalidate()];
		const onChange = (event: ThreeEvent) => {
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
