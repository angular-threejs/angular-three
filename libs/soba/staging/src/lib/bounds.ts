import {
	afterNextRender,
	ChangeDetectionStrategy,
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	ElementRef,
	input,
	Signal,
	untracked,
	viewChild,
} from '@angular/core';
import { extend, injectBeforeRender, injectStore, is, NgtGroup, pick } from 'angular-three';
import { injectAutoEffect } from 'ngxtension/auto-effect';
import { mergeInputs } from 'ngxtension/inject-inputs';
import { Box3, Group, Matrix4, Object3D, Quaternion, Vector3 } from 'three';

interface ControlsProto {
	update(): void;

	target: Vector3;
	maxDistance: number;
	addEventListener: (event: string, callback: (event: any) => void) => void;
	removeEventListener: (event: string, callback: (event: any) => void) => void;
}

enum AnimationState {
	NONE = 0,
	START = 1,
	ACTIVE = 2,
}

function isBox3(def: unknown): def is Box3 {
	return !!def && (def as Box3).isBox3;
}

function interpolateFuncDefault(t: number) {
	// Imitates the previously used THREE.MathUtils.damp
	return 1 - Math.exp(-5 * t) + 0.007 * t;
}

export interface NgtsBoundsOptions extends Partial<NgtGroup> {
	maxDuration: number;
	margin: number;
	observe: boolean;
	fit: boolean;
	clip: boolean;
	interpolateFunc: (t: number) => number;
}

const defaultOptions: NgtsBoundsOptions = {
	maxDuration: 1.0,
	margin: 1.2,
	interpolateFunc: interpolateFuncDefault,
	clip: false,
	fit: false,
	observe: false,
};

@Component({
	selector: 'ngts-bounds',
	standalone: true,
	template: `
		<ngt-group #group>
			<ng-content />
		</ngt-group>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtsBounds {
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });

	groupRef = viewChild.required<ElementRef<Group>>('group');

	private store = injectStore();
	private camera = this.store.select('camera');
	private invalidate = this.store.select('invalidate');
	private size = this.store.select('size');
	private controls = this.store.select('controls') as unknown as Signal<ControlsProto>;

	private clipOption = pick(this.options, 'clip');
	private fitOption = pick(this.options, 'fit');
	private observe = pick(this.options, 'observe');

	private origin = {
		camPos: new Vector3(),
		camRot: new Quaternion(),
		camZoom: 1,
	};
	private goal = {
		camPos: undefined as Vector3 | undefined,
		camRot: undefined as Quaternion | undefined,
		camZoom: undefined as number | undefined,
		camUp: undefined as Vector3 | undefined,
		target: undefined as Vector3 | undefined,
	};
	private animationState = AnimationState.NONE;

	// represent animation state from 0 to 1
	private t = 0;
	private box = new Box3();

	constructor() {
		extend({ Group });

		const autoEffect = injectAutoEffect();
		afterNextRender(() => {
			autoEffect(() => {
				const [controls, camera] = [this.controls(), untracked(this.camera)];
				if (!controls) return;
				const callback = () => {
					if (controls && this.goal.target && this.animationState !== AnimationState.NONE) {
						const front = new Vector3().setFromMatrixColumn(camera.matrix, 2);
						const d0 = this.origin.camPos.distanceTo(controls.target);
						const d1 = (this.goal.camPos || this.origin.camPos).distanceTo(this.goal.target);
						const d = (1 - this.t) * d0 + this.t * d1;

						controls.target.copy(camera.position).addScaledVector(front, -d);
						controls.update();
					}

					this.animationState = AnimationState.NONE;
				};

				controls.addEventListener('start', callback);
				return () => controls.removeEventListener('start', callback);
			});

			let count = 0;
			autoEffect(() => {
				const [clip, fit, observe] = [
					this.clipOption(),
					this.fitOption(),
					this.observe(),
					this.size(),
					this.camera(),
					this.controls(),
				];
				if (observe || count++ === 0) {
					this.refresh();
					if (fit) this.reset().fit();
					if (clip) this.clip();
				}
			});
		});

		injectBeforeRender(({ delta }) => {
			// This [additional animation step START] is needed to guarantee that delta used in animation isn't absurdly high (2-3 seconds) which is actually possible if rendering happens on demand...
			if (this.animationState === AnimationState.START) {
				this.animationState = AnimationState.ACTIVE;
				this.invalidate();
			} else if (this.animationState === AnimationState.ACTIVE) {
				const [{ maxDuration, interpolateFunc }, camera, controls, invalidate] = [
					this.options(),
					this.camera(),
					this.controls(),
					this.invalidate(),
				];
				this.t += delta / maxDuration;

				if (this.t >= 1) {
					this.goal.camPos && camera.position.copy(this.goal.camPos);
					this.goal.camRot && camera.quaternion.copy(this.goal.camRot);
					this.goal.camUp && camera.up.copy(this.goal.camUp);
					this.goal.camZoom && is.orthographicCamera(camera) && (camera.zoom = this.goal.camZoom);

					camera.updateMatrixWorld();
					camera.updateProjectionMatrix();

					if (controls && this.goal.target) {
						controls.target.copy(this.goal.target);
						controls.update();
					}

					this.animationState = AnimationState.NONE;
				} else {
					const k = interpolateFunc(this.t);

					this.goal.camPos && camera.position.lerpVectors(this.origin.camPos, this.goal.camPos, k);
					this.goal.camRot && camera.quaternion.slerpQuaternions(this.origin.camRot, this.goal.camRot, k);
					this.goal.camUp && camera.up.set(0, 1, 0).applyQuaternion(camera.quaternion);
					this.goal.camZoom &&
						is.orthographicCamera(camera) &&
						(camera.zoom = (1 - k) * this.origin.camZoom + k * this.goal.camZoom);

					camera.updateMatrixWorld();
					camera.updateProjectionMatrix();
				}

				invalidate();
			}
		});
	}

	getSize() {
		const [camera, { margin }] = [untracked(this.camera), untracked(this.options)];

		const boxSize = this.box.getSize(new Vector3());
		const center = this.box.getCenter(new Vector3());
		const maxSize = Math.max(boxSize.x, boxSize.y, boxSize.z);
		const fitHeightDistance = is.orthographicCamera(camera)
			? maxSize * 4
			: maxSize / (2 * Math.atan((Math.PI * camera.fov) / 360));
		const fitWidthDistance = is.orthographicCamera(camera) ? maxSize * 4 : fitHeightDistance / camera.aspect;
		const distance = margin * Math.max(fitHeightDistance, fitWidthDistance);

		return { box: this.box, size: boxSize, center, distance };
	}

	refresh(object?: Object3D | Box3) {
		const [group, camera] = [untracked(this.groupRef).nativeElement, untracked(this.camera)];

		if (isBox3(object)) this.box.copy(object);
		else {
			const target = object || group;
			if (!target) return this;
			target.updateWorldMatrix(true, true);
			this.box.setFromObject(target);
		}
		if (this.box.isEmpty()) {
			const max = camera.position.length() || 10;
			this.box.setFromCenterAndSize(new Vector3(), new Vector3(max, max, max));
		}

		this.origin.camPos.copy(camera.position);
		this.origin.camRot.copy(camera.quaternion);
		is.orthographicCamera(camera) && (this.origin.camZoom = camera.zoom);

		this.goal.camPos = undefined;
		this.goal.camRot = undefined;
		this.goal.camZoom = undefined;
		this.goal.camUp = undefined;
		this.goal.target = undefined;

		return this;
	}

	reset() {
		const [camera] = [untracked(this.camera)];
		const { center, distance } = this.getSize();

		const direction = camera.position.clone().sub(center).normalize();
		this.goal.camPos = center.clone().addScaledVector(direction, distance);
		this.goal.target = center.clone();
		const mCamRot = new Matrix4().lookAt(this.goal.camPos, this.goal.target, camera.up);
		this.goal.camRot = new Quaternion().setFromRotationMatrix(mCamRot);

		this.animationState = AnimationState.START;
		this.t = 0;

		return this;
	}

	moveTo(position: Vector3 | [number, number, number]) {
		this.goal.camPos = Array.isArray(position) ? new Vector3(...position) : position.clone();

		this.animationState = AnimationState.START;
		this.t = 0;

		return this;
	}

	lookAt({ target, up }: { target: Vector3 | [number, number, number]; up?: Vector3 | [number, number, number] }) {
		const [camera] = [untracked(this.camera)];

		this.goal.target = Array.isArray(target) ? new Vector3(...target) : target.clone();
		if (up) {
			this.goal.camUp = Array.isArray(up) ? new Vector3(...up) : up.clone();
		} else {
			this.goal.camUp = camera.up.clone();
		}
		const mCamRot = new Matrix4().lookAt(this.goal.camPos || camera.position, this.goal.target, this.goal.camUp);
		this.goal.camRot = new Quaternion().setFromRotationMatrix(mCamRot);

		this.animationState = AnimationState.START;
		this.t = 0;

		return this;
	}

	fit() {
		const [camera, controls, { margin }] = [untracked(this.camera), untracked(this.controls), untracked(this.options)];

		if (!is.orthographicCamera(camera)) {
			// For non-orthographic cameras, fit should behave exactly like reset
			return this.reset();
		}

		// For orthographic cameras, fit should only modify the zoom value
		let maxHeight = 0;
		let maxWidth = 0;
		const vertices = [
			new Vector3(this.box.min.x, this.box.min.y, this.box.min.z),
			new Vector3(this.box.min.x, this.box.max.y, this.box.min.z),
			new Vector3(this.box.min.x, this.box.min.y, this.box.max.z),
			new Vector3(this.box.min.x, this.box.max.y, this.box.max.z),
			new Vector3(this.box.max.x, this.box.max.y, this.box.max.z),
			new Vector3(this.box.max.x, this.box.max.y, this.box.min.z),
			new Vector3(this.box.max.x, this.box.min.y, this.box.max.z),
			new Vector3(this.box.max.x, this.box.min.y, this.box.min.z),
		];

		// Transform the center and each corner to camera space
		const pos = this.goal.camPos || camera.position;
		const target = this.goal.target || controls.target;
		const up = this.goal.camUp || camera.up;
		const mCamWInv = target
			? new Matrix4().lookAt(pos, target, up).setPosition(pos).invert()
			: camera.matrixWorldInverse;
		for (const v of vertices) {
			v.applyMatrix4(mCamWInv);
			maxHeight = Math.max(maxHeight, Math.abs(v.y));
			maxWidth = Math.max(maxWidth, Math.abs(v.x));
		}
		maxHeight *= 2;
		maxWidth *= 2;
		const zoomForHeight = (camera.top - camera.bottom) / maxHeight;
		const zoomForWidth = (camera.right - camera.left) / maxWidth;

		this.goal.camZoom = Math.min(zoomForHeight, zoomForWidth) / margin;

		this.animationState = AnimationState.START;
		this.t = 0;

		return this;
	}

	clip() {
		const [camera, controls, invalidate] = [
			untracked(this.camera),
			untracked(this.controls),
			untracked(this.invalidate),
		];
		const { distance } = this.getSize();

		camera.near = distance / 100;
		camera.far = distance * 100;
		camera.updateProjectionMatrix();

		if (controls) {
			controls.maxDistance = distance * 10;
			controls.update();
		}

		invalidate();

		return this;
	}
}
