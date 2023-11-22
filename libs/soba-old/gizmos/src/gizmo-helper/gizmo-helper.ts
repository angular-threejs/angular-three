import { NgTemplateOutlet } from '@angular/common';
import {
	CUSTOM_ELEMENTS_SCHEMA,
	Component,
	ContentChild,
	EventEmitter,
	Input,
	Output,
	TemplateRef,
	computed,
	effect,
	type Signal,
} from '@angular/core';
import {
	NgtPortal,
	NgtPortalContent,
	createApiToken,
	extend,
	injectBeforeRender,
	injectNgtRef,
	injectNgtStore,
	signalStore,
	type NgtGroup,
} from 'angular-three-old';
import { NgtsOrthographicCamera } from 'angular-three-soba-old/cameras';
import { NgtsSobaContent } from 'angular-three-soba-old/utils';
import { Group, Matrix4, Object3D, OrthographicCamera, Quaternion, Vector3 } from 'three';
import { OrbitControls } from 'three-stdlib';

export type NgtsGizmoHelperState = {
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
};

type ControlsProto = { update(): void; target: THREE.Vector3 };

const isOrbitControls = (controls: ControlsProto): controls is OrbitControls => {
	return 'minPolarAngle' in (controls as OrbitControls);
};

extend({ Group });

declare global {
	interface HTMLElementTagNameMap {
		'ngts-gizmo-helper': NgtsGizmoHelperState & NgtGroup;
	}
}

export const [injectNgtsGizmoHelperApi, provideNgtsGizmoHelperApi] = createApiToken(() => NgtsGizmoHelper);

@Component({
	selector: 'ngts-gizmo-helper',
	standalone: true,
	template: `
		<ngt-portal [renderPriority]="renderPriority()">
			<ng-template ngtPortalContent>
				<ngts-orthographic-camera [makeDefault]="true" [position]="[0, 0, 200]" [cameraRef]="virtualCamRef" />
				<ngt-group [ref]="gizmoRef" [position]="gizmoPosition()">
					<ng-container *ngTemplateOutlet="content" />
				</ngt-group>
			</ng-template>
		</ngt-portal>
	`,
	imports: [NgtPortal, NgtPortalContent, NgtsOrthographicCamera, NgTemplateOutlet],
	providers: [provideNgtsGizmoHelperApi()],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsGizmoHelper {
	private inputs = signalStore<NgtsGizmoHelperState>({
		alignment: 'bottom-right',
		margin: [80, 80],
		renderPriority: 1,
	});

	@Input() gizmoRef = injectNgtRef<Group>();

	@Input({ alias: 'alignment' }) set _alignment(
		alignment:
			| 'top-left'
			| 'top-right'
			| 'bottom-right'
			| 'bottom-left'
			| 'bottom-center'
			| 'center-right'
			| 'center-left'
			| 'center-center'
			| 'top-center',
	) {
		this.inputs.set({ alignment });
	}

	@Input({ alias: 'margin' }) set _margin(margin: [number, number]) {
		this.inputs.set({ margin });
	}

	@Input({ alias: 'renderPriority' }) set _renderPriority(renderPriority: number) {
		this.inputs.set({ renderPriority });
	}

	@Input({ alias: 'autoClear' }) set _autoClear(autoClear: boolean) {
		this.inputs.set({ autoClear });
	}

	@Output() update = new EventEmitter();

	@ContentChild(NgtsSobaContent, { static: true, read: TemplateRef }) content!: TemplateRef<unknown>;

	private store = injectNgtStore();
	private mainCamera = this.store.select('camera');
	// @ts-expect-error
	private defaultControls = this.store.select('controls') as Signal<ControlsProto>;
	private invalidate = this.store.select('invalidate');
	private size = this.store.select('size');

	private animating = false;
	private q1 = new Quaternion();
	private q2 = new Quaternion();
	private turnRate = 2 * Math.PI; // turn rate in angles per second
	private matrix = new Matrix4();

	private radius = 0;
	private focusPoint = new Vector3(0, 0, 0);
	private defaultUp = new Vector3(0, 0, 0);
	private target = new Vector3();
	private targetPosition = new Vector3();
	private dummy = new Object3D();

	private margin = this.inputs.select('margin');
	private alignment = this.inputs.select('alignment');

	virtualCamRef = injectNgtRef<OrthographicCamera>();
	renderPriority = this.inputs.select('renderPriority');

	gizmoPosition = computed(() => {
		const [{ width, height }, [marginX, marginY], alignment] = [this.size(), this.margin(), this.alignment()];
		const x = alignment.endsWith('-center')
			? 0
			: alignment.endsWith('-left')
			  ? -width / 2 + marginX
			  : width / 2 - marginX;
		const y = alignment.startsWith('center-')
			? 0
			: alignment.startsWith('top-')
			  ? height / 2 - marginY
			  : -height / 2 + marginY;
		return [x, y, 0];
	});

	api = {
		tweenCamera: (direction: Vector3) => {
			const [defaultControls, mainCamera, invalidate] = [
				this.defaultControls(),
				this.mainCamera(),
				this.invalidate(),
			];
			this.animating = true;
			if (defaultControls) this.focusPoint = defaultControls?.target;
			this.radius = mainCamera.position.distanceTo(this.target);

			// Rotate from current camera orientation
			this.q1.copy(mainCamera.quaternion);

			// To new current camera orientation
			this.targetPosition.copy(direction).multiplyScalar(this.radius).add(this.target);

			this.dummy.lookAt(this.targetPosition);
			this.dummy.up.copy(mainCamera.up);

			this.q2.copy(this.dummy.quaternion);

			invalidate();
		},
	};

	constructor() {
		this.trackMainCameraUp();
		this.beforeRender();
	}

	private trackMainCameraUp() {
		effect(() => {
			const mainCamera = this.mainCamera();
			this.defaultUp.copy(mainCamera.up);
		});
	}

	private beforeRender() {
		injectBeforeRender(({ delta }) => {
			const [gizmo, virtualCam, defaultControls, mainCamera, invalidate] = [
				this.gizmoRef.nativeElement,
				this.virtualCamRef.nativeElement,
				this.defaultControls(),
				this.mainCamera(),
				this.invalidate(),
			];

			if (gizmo && virtualCam) {
				// Animate step
				if (this.animating) {
					if (this.q1.angleTo(this.q2) < 0.01) {
						this.animating = false;
						// Orbit controls uses UP vector as the orbit axes,
						// so we need to reset it after the animation is done
						// moving it around for the controls to work correctly
						if (isOrbitControls(defaultControls)) {
							mainCamera.up.copy(this.defaultUp);
						}
					} else {
						const step = delta * this.turnRate;
						// animate position by doing a slerp and then scaling the position on the unit sphere
						this.q1.rotateTowards(this.q2, step);
						// animate orientation
						mainCamera.position
							.set(0, 0, 1)
							.applyQuaternion(this.q1)
							.multiplyScalar(this.radius)
							.add(this.focusPoint);
						mainCamera.up.set(0, 1, 0).applyQuaternion(this.q1).normalize();
						mainCamera.quaternion.copy(this.q1);
						if (this.update.observed) this.update.emit();
						else if (defaultControls) defaultControls.update();
						invalidate();
					}
				}

				// Sync Gizmo with main camera orientation
				this.matrix.copy(mainCamera.matrix).invert();
				gizmo.quaternion.setFromRotationMatrix(this.matrix);
			}
		});
	}
}
