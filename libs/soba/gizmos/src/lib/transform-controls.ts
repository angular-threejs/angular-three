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

/**
 * Internal interface for controls with an enabled property.
 */
interface ControlsProto {
	enabled: boolean;
}

/**
 * Type representing the TransformControls Three.js element.
 */
export type NgtsTransformControlsObject = NgtThreeElement<typeof TransformControls>;

/**
 * Configuration options for the NgtsTransformControls component.
 *
 * These options control the behavior and appearance of the transform gizmo
 * used for manipulating 3D objects in the scene.
 */
export type NgtsTransformControlsOptions = Partial<NgtsTransformControlsObject> &
	Partial<NgtThreeElements['ngt-group']> & {
		/**
		 * Whether the controls are enabled.
		 * @default true
		 */
		enabled?: boolean;
		/**
		 * Restricts transformation to a specific axis ('X', 'Y', 'Z', 'XY', 'YZ', 'XZ', 'XYZ').
		 */
		axis?: string | null;
		/**
		 * The DOM element to attach controls to.
		 */
		domElement?: HTMLElement;
		/**
		 * The transformation mode.
		 * @default 'translate'
		 */
		mode?: 'translate' | 'rotate' | 'scale';
		/**
		 * Snap increment for translation in units.
		 */
		translationSnap?: number | null;
		/**
		 * Snap increment for rotation in radians.
		 */
		rotationSnap?: number | null;
		/**
		 * Snap increment for scaling.
		 */
		scaleSnap?: number | null;
		/**
		 * The coordinate space for transformations.
		 * @default 'world'
		 */
		space?: 'world' | 'local';
		/**
		 * The size of the gizmo.
		 * @default 1
		 */
		size?: number;
		/**
		 * Whether to show the X axis handle.
		 * @default true
		 */
		showX?: boolean;
		/**
		 * Whether to show the Y axis handle.
		 * @default true
		 */
		showY?: boolean;
		/**
		 * Whether to show the Z axis handle.
		 * @default true
		 */
		showZ?: boolean;
		/**
		 * The camera to use for the controls.
		 */
		camera?: THREE.Camera;
		/**
		 * Whether to make these the default controls in the store.
		 * @default false
		 */
		makeDefault?: boolean;
	};

/**
 * A component that provides interactive transform controls for manipulating 3D objects.
 *
 * NgtsTransformControls wraps Three.js TransformControls to provide an interactive
 * gizmo for translating, rotating, and scaling objects in the scene. It can be
 * attached to a specific object or wrap content as a group.
 *
 * @example
 * ```html
 * <ngts-transform-controls [options]="{ mode: 'translate' }">
 *   <ngt-mesh>
 *     <ngt-box-geometry />
 *     <ngt-mesh-standard-material />
 *   </ngt-mesh>
 * </ngts-transform-controls>
 * ```
 *
 * @example
 * ```html
 * <ngts-transform-controls
 *   [object]="meshRef"
 *   [options]="{ mode: 'rotate', showX: false }"
 *   (change)="onTransform($event)"
 *   (objectChange)="onObjectChange($event)"
 * />
 * ```
 */
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
			const cleanup = this.updateDefaultControlsEffect();
			onCleanup(() => cleanup?.());
		});
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
