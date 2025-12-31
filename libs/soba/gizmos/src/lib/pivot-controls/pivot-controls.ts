import {
	ChangeDetectionStrategy,
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	effect,
	ElementRef,
	input,
	output,
	viewChild,
} from '@angular/core';
import { beforeRender, extend, getInstanceState, injectStore, is, NgtAnyRecord, omit, pick } from 'angular-three';
import { calculateScaleFactor } from 'angular-three-soba/misc';
import { mergeInputs } from 'ngxtension/inject-inputs';
import * as THREE from 'three';
import { Group } from 'three';
import { NgtsAxisArrow } from './axis-arrow';
import { NgtsAxisRotator } from './axis-rotator';
import { NgtsPlaneSlider } from './plane-slider';
import { NgtsScalingSphere } from './scaling-sphere';

/**
 * Parameters passed when a drag operation starts on the pivot controls.
 */
export interface OnDragStartParameters {
	/**
	 * The type of component being dragged.
	 */
	component: 'Arrow' | 'Slider' | 'Rotator' | 'Sphere';
	/**
	 * The axis index (0 = X, 1 = Y, 2 = Z).
	 */
	axis: 0 | 1 | 2;
	/**
	 * The world-space origin of the drag operation.
	 */
	origin: THREE.Vector3;
	/**
	 * Direction vectors relevant to the drag operation.
	 */
	directions: THREE.Vector3[];
}

/**
 * Parameters passed during a drag operation on the pivot controls.
 */
export interface OnDragParameters {
	/**
	 * The current local transformation matrix.
	 */
	l: THREE.Matrix4;
	/**
	 * The delta (change) in local transformation.
	 */
	deltaL: THREE.Matrix4;
	/**
	 * The current world transformation matrix.
	 */
	w: THREE.Matrix4;
	/**
	 * The delta (change) in world transformation.
	 */
	deltaW: THREE.Matrix4;
}

const mL0 = new THREE.Matrix4();
const mW0 = new THREE.Matrix4();
const mP = new THREE.Matrix4();
const mPInv = new THREE.Matrix4();
const mW = new THREE.Matrix4();
const mL = new THREE.Matrix4();
const mL0Inv = new THREE.Matrix4();
const mdL = new THREE.Matrix4();
const mG = new THREE.Matrix4();

const bb = new THREE.Box3();
const bbObj = new THREE.Box3();
const vCenter = new THREE.Vector3();
const vSize = new THREE.Vector3();
const vAnchorOffset = new THREE.Vector3();
const vPosition = new THREE.Vector3();
const vScale = new THREE.Vector3();

const xDir = new THREE.Vector3(1, 0, 0);
const yDir = new THREE.Vector3(0, 1, 0);
const zDir = new THREE.Vector3(0, 0, 1);

/**
 * Configuration options for the NgtsPivotControls component.
 *
 * These options control the behavior, appearance, and constraints of the
 * interactive pivot gizmo used for manipulating 3D objects.
 */
export interface NgtsPivotControlsOptions {
	/**
	 * Enables/disables the control.
	 * @default true
	 */
	enabled: boolean;
	/**
	 * Scale of the gizmo.
	 * @default 1
	 */
	scale: number;
	/**
	 * Width of the gizmo lines (THREE.Line2 prop).
	 * @default 4
	 */
	lineWidth: number;
	/**
	 * If true, the gizmo remains constant in screen size. Scale is then in pixels.
	 * @default false
	 */
	fixed: boolean;
	/**
	 * Position offset of the pivot point. Does not shift content, only the gizmo position.
	 * @default [0, 0, 0]
	 */
	offset: [number, number, number];
	/**
	 * Starting rotation of the gizmo in radians [x, y, z].
	 * @default [0, 0, 0]
	 */
	rotation: [number, number, number];

	/**
	 * Starting transformation matrix. If provided, the group uses this matrix.
	 */
	matrix?: THREE.Matrix4;
	/**
	 * Bounding box anchor point. Each axis can be -1 (min), 0 (center), or +1 (max).
	 */
	anchor?: [number, number, number];
	/**
	 * If true, automatically applies the local transform on drag.
	 * @default true
	 */
	autoTransform: boolean;
	/**
	 * Which axes are active and can be manipulated [x, y, z].
	 * @default [true, true, true]
	 */
	activeAxes: [boolean, boolean, boolean];

	/**
	 * Disables all translation arrows.
	 * @default false
	 */
	disableAxes: boolean;
	/**
	 * Disables all plane sliders.
	 * @default false
	 */
	disableSliders: boolean;
	/**
	 * Disables all rotation handles.
	 * @default false
	 */
	disableRotations: boolean;
	/**
	 * Disables all scaling spheres.
	 * @default false
	 */
	disableScaling: boolean;

	/**
	 * Translation limits for each axis as [min, max] pairs. Undefined means no limit.
	 */
	translationLimits?: [[number, number] | undefined, [number, number] | undefined, [number, number] | undefined];
	/**
	 * Rotation limits for each axis as [min, max] pairs in radians. Undefined means no limit.
	 */
	rotationLimits?: [[number, number] | undefined, [number, number] | undefined, [number, number] | undefined];
	/**
	 * Scale limits for each axis as [min, max] pairs. Undefined means no limit.
	 */
	scaleLimits?: [[number, number] | undefined, [number, number] | undefined, [number, number] | undefined];

	/**
	 * Colors for the X, Y, and Z axes.
	 * @default ['#ff2060', '#20df80', '#2080ff']
	 */
	axisColors: [string | number, string | number, string | number];
	/**
	 * Color when a gizmo element is hovered.
	 * @default '#ffff40'
	 */
	hoveredColor: string | number;
	/**
	 * Whether to show HTML value annotations during drag.
	 * @default false
	 */
	annotations: boolean;
	/**
	 * CSS class name applied to the HTML annotations.
	 */
	annotationsClass?: string;
	/**
	 * Whether the gizmo should be occluded by scene geometry.
	 * @default true
	 */
	depthTest: boolean;
	/**
	 * Render order for the gizmo.
	 * @default 500
	 */
	renderOrder: number;
	/**
	 * Opacity of the gizmo elements.
	 * @default 1
	 */
	opacity?: number;
	/**
	 * Whether the gizmo is visible.
	 * @default true
	 */
	visible: boolean;
	/**
	 * Custom user data to attach to gizmo meshes.
	 */
	userData?: NgtAnyRecord;
}

const defaultOptions: NgtsPivotControlsOptions = {
	enabled: true,
	autoTransform: true,
	disableAxes: false,
	disableSliders: false,
	disableRotations: false,
	disableScaling: false,
	activeAxes: [true, true, true],
	offset: [0, 0, 0],
	rotation: [0, 0, 0],
	scale: 1,
	lineWidth: 4,
	fixed: false,
	depthTest: true,
	axisColors: ['#ff2060', '#20df80', '#2080ff'],
	hoveredColor: '#ffff40',
	annotations: false,
	opacity: 1,
	visible: true,
	renderOrder: 500,
};

/**
 * A component that provides an interactive pivot-style gizmo for manipulating 3D objects.
 *
 * NgtsPivotControls creates a multi-axis gizmo with arrows for translation, plane sliders
 * for 2D movement, rotators for rotation, and spheres for scaling. The gizmo can be
 * customized to enable/disable specific transformation types and constrained with limits.
 *
 * @example
 * ```html
 * <ngts-pivot-controls [options]="{ scale: 0.5 }">
 *   <ngt-mesh>
 *     <ngt-box-geometry />
 *     <ngt-mesh-standard-material />
 *   </ngt-mesh>
 * </ngts-pivot-controls>
 * ```
 *
 * @example
 * ```html
 * <ngts-pivot-controls
 *   [options]="{
 *     disableRotations: true,
 *     disableScaling: true,
 *     translationLimits: [[-1, 1], undefined, undefined]
 *   }"
 *   (dragged)="onDrag($event)"
 *   (dragStarted)="onDragStart($event)"
 *   (dragEnded)="onDragEnd()"
 * >
 *   <ngt-mesh />
 * </ngts-pivot-controls>
 * ```
 */
@Component({
	selector: 'ngts-pivot-controls',
	template: `
		<ngt-group #parent>
			<ngt-group #group [matrix]="matrix()" [matrixAutoUpdate]="false" [parameters]="parameters()">
				<ngt-group #gizmo [visible]="visible()" [position]="offset()" [rotation]="rotation()">
					@if (enabled()) {
						@let _disableAxes = disableAxes();
						@let _disableSliders = disableSliders();
						@let _disableRotations = disableRotations();
						@let _disableScaling = disableScaling();
						@let _activeAxes = activeAxes();

						@if (!_disableAxes && _activeAxes[0]) {
							<ngts-axis-arrow [axis]="0" [direction]="xDir" />
						}
						@if (!_disableAxes && _activeAxes[1]) {
							<ngts-axis-arrow [axis]="1" [direction]="yDir" />
						}
						@if (!_disableAxes && _activeAxes[2]) {
							<ngts-axis-arrow [axis]="2" [direction]="zDir" />
						}

						@if (!_disableSliders && _activeAxes[0] && _activeAxes[1]) {
							<ngts-plane-slider [axis]="2" [dir1]="xDir" [dir2]="yDir" />
						}
						@if (!_disableSliders && _activeAxes[0] && _activeAxes[2]) {
							<ngts-plane-slider [axis]="1" [dir1]="zDir" [dir2]="xDir" />
						}
						@if (!_disableSliders && _activeAxes[2] && _activeAxes[1]) {
							<ngts-plane-slider [axis]="0" [dir1]="yDir" [dir2]="zDir" />
						}

						@if (!_disableRotations && _activeAxes[0] && _activeAxes[1]) {
							<ngts-axis-rotator [axis]="2" [dir1]="xDir" [dir2]="yDir" />
						}
						@if (!_disableRotations && _activeAxes[0] && _activeAxes[2]) {
							<ngts-axis-rotator [axis]="1" [dir1]="zDir" [dir2]="xDir" />
						}
						@if (!_disableRotations && _activeAxes[2] && _activeAxes[1]) {
							<ngts-axis-rotator [axis]="0" [dir1]="yDir" [dir2]="zDir" />
						}

						@if (!_disableScaling && _activeAxes[0]) {
							<ngts-scaling-sphere [axis]="0" [direction]="xDir" />
						}
						@if (!_disableScaling && _activeAxes[1]) {
							<ngts-scaling-sphere [axis]="1" [direction]="yDir" />
						}
						@if (!_disableScaling && _activeAxes[2]) {
							<ngts-scaling-sphere [axis]="2" [direction]="zDir" />
						}
					}
				</ngt-group>
				<ngt-group #children>
					<ng-content />
				</ngt-group>
			</ngt-group>
		</ngt-group>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtsAxisArrow, NgtsPlaneSlider, NgtsAxisRotator, NgtsScalingSphere],
})
export class NgtsPivotControls {
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });
	protected parameters = omit(this.options, [
		'enabled',
		'matrix',
		'autoTransform',
		'anchor',
		'disableAxes',
		'disableSliders',
		'disableRotations',
		'disableScaling',
		'activeAxes',
		'offset',
		'rotation',
		'scale',
		'lineWidth',
		'fixed',
		'translationLimits',
		'rotationLimits',
		'scaleLimits',
		'depthTest',
		'axisColors',
		'hoveredColor',
		'annotations',
		'annotationsClass',
		'opacity',
		'visible',
		'userData',
		'renderOrder',
	]);

	dragStarted = output<OnDragStartParameters>();
	dragEnded = output<void>();
	dragged = output<OnDragParameters>();

	private autoTransform = pick(this.options, 'autoTransform');
	protected matrix = pick(this.options, 'matrix');
	protected offset = pick(this.options, 'offset');
	protected rotation = pick(this.options, 'rotation');
	protected visible = pick(this.options, 'visible');
	protected enabled = pick(this.options, 'enabled');
	protected disableAxes = pick(this.options, 'disableAxes');
	protected disableSliders = pick(this.options, 'disableSliders');
	protected disableRotations = pick(this.options, 'disableRotations');
	protected disableScaling = pick(this.options, 'disableScaling');
	protected activeAxes = pick(this.options, 'activeAxes');

	annotations = pick(this.options, 'annotations');
	annotationsClass = pick(this.options, 'annotationsClass');
	translationLimits = pick(this.options, 'translationLimits');
	rotationLimits = pick(this.options, 'rotationLimits');
	scaleLimits = pick(this.options, 'scaleLimits');
	fixed = pick(this.options, 'fixed');
	hoveredColor = pick(this.options, 'hoveredColor');
	axisColors = pick(this.options, 'axisColors');
	lineWidth = pick(this.options, 'lineWidth');
	scale = pick(this.options, 'scale');
	userData = pick(this.options, 'userData');
	opacity = pick(this.options, 'opacity');
	depthTest = pick(this.options, 'depthTest');
	renderOrder = pick(this.options, 'renderOrder');

	protected xDir = xDir;
	protected yDir = yDir;
	protected zDir = zDir;

	parentRef = viewChild.required<ElementRef<THREE.Group>>('parent');
	groupRef = viewChild.required<ElementRef<THREE.Group>>('group');
	gizmoRef = viewChild.required<ElementRef<THREE.Group>>('gizmo');
	childrenRef = viewChild.required<ElementRef<THREE.Group>>('children');

	private store = injectStore();

	translation: [number, number, number] = [0, 0, 0];

	private anchor = pick(this.options, 'anchor');
	private cameraScale = new THREE.Vector3(1, 1, 1);
	private gizmoScale = new THREE.Vector3(1, 1, 1);

	constructor() {
		extend({ Group });

		effect(() => {
			const anchor = this.anchor();
			if (!anchor) return;

			const childrenContainer = this.childrenRef().nativeElement;
			const instanceState = getInstanceState(childrenContainer);
			if (!instanceState) return;

			const [gizmo, offset, invalidate] = [
				this.gizmoRef().nativeElement,
				this.offset(),
				this.store.invalidate(),
				this.options(),
				[instanceState.objects(), instanceState.nonObjects()],
			];
			childrenContainer.updateWorldMatrix(true, true);

			mPInv.copy(childrenContainer.matrixWorld).invert();
			bb.makeEmpty();

			childrenContainer.traverse((obj) => {
				if (!(obj as THREE.Mesh).geometry) return;
				if (!(obj as THREE.Mesh).geometry.boundingBox) (obj as THREE.Mesh).geometry.computeBoundingBox();
				mL.copy(obj.matrixWorld).premultiply(mPInv);
				const boundingBox = (obj as THREE.Mesh).geometry.boundingBox;
				if (boundingBox) {
					bbObj.copy(boundingBox);
					bbObj.applyMatrix4(mL);
					bb.union(bbObj);
				}
			});

			vCenter.copy(bb.max).add(bb.min).multiplyScalar(0.5);
			vSize.copy(bb.max).sub(bb.min).multiplyScalar(0.5);
			vAnchorOffset
				.copy(vSize)
				.multiply(new THREE.Vector3(...anchor))
				.add(vCenter);
			vPosition.set(...offset).add(vAnchorOffset);
			gizmo.position.copy(vPosition);
			invalidate();
		});

		const vec = new THREE.Vector3();
		beforeRender(({ camera, size, invalidate }) => {
			const [{ fixed, scale, matrix }, gizmo, group] = [
				this.options(),
				this.gizmoRef().nativeElement,
				this.groupRef().nativeElement,
			];

			if (fixed) {
				const sf = calculateScaleFactor(gizmo.getWorldPosition(vec), scale, camera, size);
				this.cameraScale.setScalar(sf);
			}

			if (is.three<THREE.Matrix4>(matrix, 'isMatrix4')) {
				group.matrix = matrix;
			}

			// Update gizmo scale in accordance with matrix changes
			// Without this, there might be noticeable turbulence if scaling happens fast enough
			gizmo.updateWorldMatrix(true, true);

			mG.makeRotationFromEuler(gizmo.rotation).setPosition(gizmo.position).premultiply(group.matrixWorld);
			this.gizmoScale.setFromMatrixScale(mG);

			vScale.copy(this.cameraScale).divide(this.gizmoScale);

			if (
				Math.abs(gizmo.scale.x - vScale.x) > 1e-4 ||
				Math.abs(gizmo.scale.y - vScale.y) > 1e-4 ||
				Math.abs(gizmo.scale.z - vScale.z) > 1e-4
			) {
				gizmo.scale.copy(vScale);
				invalidate();
			}
		});
	}

	/**
	 * Called when a drag operation starts. Captures the initial transform state.
	 *
	 * @param parameters - Information about the drag operation
	 */
	onDragStart(parameters: OnDragStartParameters) {
		const group = this.groupRef().nativeElement;
		mL0.copy(group.matrix);
		mW0.copy(group.matrixWorld);
		this.dragStarted.emit(parameters);
		this.store.snapshot.invalidate();
	}

	/**
	 * Called during a drag operation. Updates the transform and emits the dragged event.
	 *
	 * @param mdW - The world-space delta transformation matrix
	 */
	onDrag(mdW: THREE.Matrix4) {
		const [parent, group, autoTransform] = [
			this.parentRef().nativeElement,
			this.groupRef().nativeElement,
			this.autoTransform(),
		];

		mP.copy(parent.matrixWorld);
		mPInv.copy(mP).invert();
		// After applying the delta
		mW.copy(mW0).premultiply(mdW);
		mL.copy(mW).premultiply(mPInv);
		mL0Inv.copy(mL0).invert();
		mdL.copy(mL).multiply(mL0Inv);

		if (autoTransform) {
			group.matrix.copy(mL);
		}

		this.dragged.emit({ l: mL, deltaL: mdL, w: mW, deltaW: mdW });
		this.store.snapshot.invalidate();
	}

	/**
	 * Called when a drag operation ends. Emits the dragEnded event.
	 */
	onDragEnd() {
		this.dragEnded.emit();
		this.store.snapshot.invalidate();
	}
}
