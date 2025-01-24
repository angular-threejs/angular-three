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
import { extend, getInstanceState, injectBeforeRender, injectStore, is, NgtAnyRecord, omit, pick } from 'angular-three';
import { calculateScaleFactor } from 'angular-three-soba/misc';
import { mergeInputs } from 'ngxtension/inject-inputs';
import * as THREE from 'three';
import { Group } from 'three';
import { NgtsAxisArrow } from './axis-arrow';
import { NgtsAxisRotator } from './axis-rotator';
import { NgtsPlaneSlider } from './plane-slider';
import { NgtsScalingSphere } from './scaling-sphere';

export interface OnDragStartParameters {
	component: 'Arrow' | 'Slider' | 'Rotator' | 'Sphere';
	axis: 0 | 1 | 2;
	origin: THREE.Vector3;
	directions: THREE.Vector3[];
}

export interface OnDragParameters {
	l: THREE.Matrix4;
	deltaL: THREE.Matrix4;
	w: THREE.Matrix4;
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

export interface NgtsPivotControlsOptions {
	/** Enables/disables the control, true */
	enabled: boolean;
	/** Scale of the gizmo, 1 */
	scale: number;
	/** Width of the gizmo lines, this is a THREE.Line2 prop, 2.5 */
	lineWidth: number;
	/** If fixed is true is remains constant in size, scale is now in pixels, false */
	fixed: boolean;
	/** Pivot does not act as a group, it won't shift contents but can offset in position */
	offset: [number, number, number];
	/** Starting rotation */
	rotation: [number, number, number];

	/** Starting matrix */
	matrix?: THREE.Matrix4;
	/** BBAnchor, each axis can be between -1/0/+1 */
	anchor?: [number, number, number];
	/** If autoTransform is true, automatically apply the local transform on drag, true */
	autoTransform: boolean;
	/** Allows you to switch individual axes off */
	activeAxes: [boolean, boolean, boolean];

	/** Allows you to switch individual transformations off */
	disableAxes: boolean;
	disableSliders: boolean;
	disableRotations: boolean;
	disableScaling: boolean;

	/** Limits */
	translationLimits?: [[number, number] | undefined, [number, number] | undefined, [number, number] | undefined];
	rotationLimits?: [[number, number] | undefined, [number, number] | undefined, [number, number] | undefined];
	scaleLimits?: [[number, number] | undefined, [number, number] | undefined, [number, number] | undefined];

	/** RGB colors */
	axisColors: [string | number, string | number, string | number];
	/** Color of the hovered item */
	hoveredColor: string | number;
	/** HTML value annotations, default: false */
	annotations: boolean;
	/** CSS Classname applied to the HTML annotations */
	annotationsClass?: string;
	/** Set this to false if you want the gizmo to be visible through faces */
	depthTest: boolean;
	opacity?: number;
	visible: boolean;
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
};

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
		injectBeforeRender(({ camera, size, invalidate }) => {
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

	onDragStart(parameters: OnDragStartParameters) {
		const group = this.groupRef().nativeElement;
		mL0.copy(group.matrix);
		mW0.copy(group.matrixWorld);
		this.dragStarted.emit(parameters);
		this.store.snapshot.invalidate();
	}

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

	onDragEnd() {
		this.dragEnded.emit();
		this.store.snapshot.invalidate();
	}
}
