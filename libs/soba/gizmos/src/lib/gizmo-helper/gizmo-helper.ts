import { NgTemplateOutlet } from '@angular/common';
import {
	ChangeDetectionStrategy,
	Component,
	computed,
	contentChild,
	CUSTOM_ELEMENTS_SCHEMA,
	Directive,
	effect,
	ElementRef,
	Injector,
	input,
	output,
	TemplateRef,
	viewChild,
} from '@angular/core';
import { beforeRender, extend, hasListener, injectStore, NgtPortal, NgtPortalAutoRender, pick } from 'angular-three';
import { NgtsOrthographicCamera } from 'angular-three-soba/cameras';
import CameraControls from 'camera-controls';
import { mergeInputs } from 'ngxtension/inject-inputs';
import * as THREE from 'three';
import { Group } from 'three';
import { OrbitControls } from 'three-stdlib';

const turnRate = 2 * Math.PI; // turn rate in angles per second
const dummy = new THREE.Object3D();
const matrix = new THREE.Matrix4();
const [q1, q2] = [new THREE.Quaternion(), new THREE.Quaternion()];
const target = new THREE.Vector3();
const targetPosition = new THREE.Vector3();

@Directive({ selector: 'ng-template[gizmoHelperContent]' })
export class NgtsGizmoHelperContent {
	static ngTemplateContextGuard(
		_: NgtsGizmoHelperContent,
		ctx: unknown,
	): ctx is { container: THREE.Object3D; injector: Injector } {
		return true;
	}
}

type ControlsProto = { update(delta?: number): void; target: THREE.Vector3 };

export interface NgtsGizmoHelperOptions {
	alignment:
		| 'top-left'
		| 'top-right'
		| 'bottom-right'
		| 'bottom-left'
		| 'bottom-center'
		| 'center-right'
		| 'center-left'
		| 'center-center'
		| 'top-center';
	margin: [number, number];
	renderPriority: number;
	autoClear?: boolean;
}

const defaultOptions: NgtsGizmoHelperOptions = {
	alignment: 'bottom-right',
	margin: [80, 80],
	renderPriority: 1,
};

@Component({
	selector: 'ngts-gizmo-helper',
	template: `
		@let _renderPriority = renderPriority();

		<ngt-portal
			[container]="scene"
			[autoRender]="_renderPriority"
			[state]="{ events: { priority: _renderPriority + 1 } }"
		>
			<ng-template portalContent let-injector="injector">
				<ngts-orthographic-camera [options]="{ makeDefault: true, position: [0, 0, 200] }" />
				<ngt-group #gizmo [position]="[x(), y(), 0]">
					<ng-container
						[ngTemplateOutlet]="content()"
						[ngTemplateOutletContext]="{ container: scene, injector }"
						[ngTemplateOutletInjector]="injector"
					/>
				</ngt-group>
			</ng-template>
		</ngt-portal>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtPortal, NgtPortalAutoRender, NgtsOrthographicCamera, NgTemplateOutlet],
})
export class NgtsGizmoHelperImpl {
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });
	update = output<void>();

	protected renderPriority = pick(this.options, 'renderPriority');
	protected margin = pick(this.options, 'margin');
	protected alignment = pick(this.options, 'alignment');

	protected scene = new THREE.Scene();

	protected content = contentChild.required(NgtsGizmoHelperContent, { read: TemplateRef });

	private gizmoRef = viewChild<ElementRef<THREE.Group>>('gizmo');
	private virtualCameraRef = viewChild(NgtsOrthographicCamera);

	private store = injectStore();

	protected x = computed(() => {
		const alignment = this.alignment();
		if (alignment.endsWith('-center')) return 0;

		const [width, [marginX]] = [this.store.size.width(), this.margin()];
		return alignment.endsWith('-left') ? -width / 2 + marginX : width / 2 - marginX;
	});
	protected y = computed(() => {
		const alignment = this.alignment();
		if (alignment.startsWith('center-')) return 0;

		const [height, [marginY]] = [this.store.size.height(), this.margin()];
		return alignment.startsWith('top-') ? height / 2 - marginY : -height / 2 + marginY;
	});

	private animating = false;
	private radius = 0;
	private focusPoint = new THREE.Vector3(0, 0, 0);
	private defaultUp = new THREE.Vector3(0, 0, 0);

	constructor() {
		extend({ Group });

		effect(() => {
			this.updateDefaultUpEffect();
		});

		beforeRender(({ delta }) => {
			const [virtualCamera, gizmo] = [
				this.virtualCameraRef()?.cameraRef()?.nativeElement,
				this.gizmoRef()?.nativeElement,
			];

			if (!virtualCamera || !gizmo) return;

			const [defaultControls, mainCamera, invalidate] = [
				this.store.snapshot.controls as unknown as ControlsProto,
				this.store.snapshot.camera,
				this.store.snapshot.invalidate,
			];

			// Animate step
			if (this.animating) {
				if (q1.angleTo(q2) < 0.01) {
					this.animating = false;
					// Orbit controls uses UP vector as the orbit axes,
					// so we need to reset it after the animation is done
					// moving it around for the controls to work correctly
					if (this.isOrbitControls(defaultControls)) {
						mainCamera.up.copy(this.defaultUp);
					}
				} else {
					const step = delta * turnRate;
					// animate position by doing a slerp and then scaling the position on the unit sphere
					q1.rotateTowards(q2, step);
					// animate orientation
					mainCamera.position
						.set(0, 0, 1)
						.applyQuaternion(q1)
						.multiplyScalar(this.radius)
						.add(this.focusPoint);
					mainCamera.up.set(0, 1, 0).applyQuaternion(q1).normalize();
					mainCamera.quaternion.copy(q1);

					if (this.isCameraControls(defaultControls)) {
						void defaultControls.setPosition(
							mainCamera.position.x,
							mainCamera.position.y,
							mainCamera.position.z,
						);
					}

					if (hasListener(this.update)) this.update.emit();
					else if (defaultControls) defaultControls.update(delta);

					invalidate();
				}
			}

			// Sync Gizmo with main camera orientation
			matrix.copy(mainCamera.matrix).invert();
			gizmo.quaternion.setFromRotationMatrix(matrix);
		});
	}

	tweenCamera(direction: THREE.Vector3) {
		const [defaultControls, invalidate, mainCamera] = [
			this.store.snapshot.controls as unknown as ControlsProto,
			this.store.snapshot.invalidate,
			this.store.snapshot.camera,
		];

		this.animating = true;
		if (defaultControls) {
			this.focusPoint = this.isCameraControls(defaultControls)
				? defaultControls.getTarget(this.focusPoint)
				: defaultControls.target;
		}
		this.radius = mainCamera.position.distanceTo(target);

		// Rotate from current camera orientation
		q1.copy(mainCamera.quaternion);

		// To new current camera orientation
		targetPosition.copy(direction).multiplyScalar(this.radius).add(target);
		dummy.lookAt(targetPosition);
		q2.copy(dummy.quaternion);

		invalidate();
	}

	private updateDefaultUpEffect() {
		const mainCamera = this.store.camera();
		this.defaultUp.copy(mainCamera.up);
		dummy.up.copy(mainCamera.up);
	}

	private isOrbitControls(controls: ControlsProto): controls is OrbitControls {
		return 'minPolarAngle' in (controls as OrbitControls);
	}

	private isCameraControls(controls: CameraControls | ControlsProto): controls is CameraControls {
		return 'getTarget' in (controls as CameraControls);
	}
}

export const NgtsGizmoHelper = [NgtsGizmoHelperImpl, NgtsGizmoHelperContent] as const;
