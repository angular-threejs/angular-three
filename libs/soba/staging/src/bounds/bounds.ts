import {
	CUSTOM_ELEMENTS_SCHEMA,
	Component,
	EventEmitter,
	Input,
	Output,
	Signal,
	computed,
	effect,
	forwardRef,
	untracked,
} from '@angular/core';
import {
	createInjectionToken,
	extend,
	injectBeforeRender,
	injectNgtRef,
	injectNgtStore,
	is,
	signalStore,
	type NgtGroup,
} from 'angular-three';
import * as THREE from 'three';
import { Group } from 'three';

extend({ Group });

export type NgtsBoundsSize = {
	box: THREE.Box3;
	size: THREE.Vector3;
	center: THREE.Vector3;
	distance: number;
};

type ControlsProto = {
	update(): void;
	target: THREE.Vector3;
	maxDistance: number;
	addEventListener: (event: string, callback: (event: any) => void) => void;
	removeEventListener: (event: string, callback: (event: any) => void) => void;
};

const isBox3 = (def: any): def is THREE.Box3 => def && (def as THREE.Box3).isBox3;

function equals(a: THREE.Vector3, b: THREE.Vector3, eps: number) {
	return Math.abs(a.x - b.x) < eps && Math.abs(a.y - b.y) < eps && Math.abs(a.z - b.z) < eps;
}

function damp(v: THREE.Vector3, t: THREE.Vector3, lambda: number, delta: number) {
	v.x = THREE.MathUtils.damp(v.x, t.x, lambda, delta);
	v.y = THREE.MathUtils.damp(v.y, t.y, lambda, delta);
	v.z = THREE.MathUtils.damp(v.z, t.z, lambda, delta);
}

export type NgtsBoundsState = {
	damping: number;
	fit: boolean;
	clip: boolean;
	observe: boolean;
	margin: number;
	eps: number;
};

declare global {
	interface HTMLElementTagNameMap {
		/**
		 * @extends ngt-group
		 */
		'ngts-bounds': NgtsBoundsState & NgtGroup;
	}
}

export const [injectNgtsBoundsApi, provideNgtsBoundsApi] = createInjectionToken((bounds: NgtsBounds) => bounds.api, {
	isRoot: false,
	deps: [forwardRef(() => NgtsBounds)],
});

@Component({
	selector: 'ngts-bounds',
	standalone: true,
	template: `
		<ngt-group [ref]="boundsRef">
			<ng-content />
		</ngt-group>

	`,
	providers: [provideNgtsBoundsApi()],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsBounds {
	private inputs = signalStore<NgtsBoundsState>({
		damping: 6,
		fit: false,
		clip: false,
		observe: false,
		margin: 1.2,
		eps: 0.01,
	});

	@Input() boundsRef = injectNgtRef<Group>();

	@Input({ alias: 'damping' }) set _damping(damping: number) {
		this.inputs.set({ damping });
	}

	@Input({ alias: 'fit' }) set _fit(fit: boolean) {
		this.inputs.set({ fit });
	}

	@Input({ alias: 'clip' }) set _clip(clip: boolean) {
		this.inputs.set({ clip });
	}

	@Input({ alias: 'observe' }) set _observe(observe: boolean) {
		this.inputs.set({ observe });
	}

	@Input({ alias: 'margin' }) set _margin(margin: number) {
		this.inputs.set({ margin });
	}

	@Input({ alias: 'eps' }) set _eps(eps: number) {
		this.inputs.set({ eps });
	}

	@Output() fitted = new EventEmitter<NgtsBoundsSize>();

	private store = injectNgtStore();
	private controls = this.store.select('controls') as unknown as Signal<ControlsProto>;
	private size = this.store.select('size');
	private camera = this.store.select('camera');
	private invalidate = this.store.select('invalidate');

	private fit = this.inputs.select('fit');
	private clip = this.inputs.select('clip');
	private observe = this.inputs.select('observe');
	private margin = this.inputs.select('margin');
	private damping = this.inputs.select('damping');

	private current = { animating: false, focus: new THREE.Vector3(), camera: new THREE.Vector3(), zoom: 1 };
	private goal = { focus: new THREE.Vector3(), camera: new THREE.Vector3(), zoom: 1 };
	private box = new THREE.Box3();

	api = computed(() => {
		const { box, boundsRef, current, goal, fitted } = this;
		const [camera, margin, controls, invalidate, damping] = [
			this.camera(),
			this.margin(),
			this.controls(),
			this.invalidate(),
			this.damping(),
		];

		function getSize() {
			const size = box.getSize(new THREE.Vector3());
			const center = box.getCenter(new THREE.Vector3());
			const maxSize = Math.max(size.x, size.y, size.z);
			const fitHeightDistance = is.orthographicCamera(camera)
				? maxSize * 4
				: maxSize / (2 * Math.atan((Math.PI * camera.fov) / 360));
			const fitWidthDistance = is.orthographicCamera(camera) ? maxSize * 4 : fitHeightDistance / camera.aspect;
			const distance = margin * Math.max(fitHeightDistance, fitWidthDistance);
			return { box, size, center, distance };
		}

		return {
			getSize,
			refresh(object?: THREE.Object3D | THREE.Box3) {
				if (isBox3(object)) box.copy(object);
				else {
					const target = object || boundsRef.nativeElement;
					if (!target) return this;
					target.updateWorldMatrix(true, true);
					box.setFromObject(target);
				}
				if (box.isEmpty()) {
					const max = camera.position.length() || 10;
					box.setFromCenterAndSize(new THREE.Vector3(), new THREE.Vector3(max, max, max));
				}

				if (controls?.constructor.name === 'OrthographicTrackballControls') {
					// Put camera on a sphere along which it should move
					const { distance } = getSize();
					const direction = camera.position.clone().sub(controls.target).normalize().multiplyScalar(distance);
					const newPos = controls.target.clone().add(direction);
					camera.position.copy(newPos);
				}

				return this;
			},
			clip() {
				const { distance } = getSize();
				if (controls) controls.maxDistance = distance * 10;
				camera.near = distance / 100;
				camera.far = distance * 100;
				camera.updateProjectionMatrix();
				if (controls) controls.update();
				invalidate();
				return this;
			},
			to({ position, target }: { position: [number, number, number]; target?: [number, number, number] }) {
				current.camera.copy(camera.position);
				const { center } = getSize();
				goal.camera.set(...position);

				if (target) {
					goal.focus.set(...target);
				} else {
					goal.focus.copy(center);
				}

				if (damping) {
					current.animating = true;
				} else {
					camera.position.set(...position);
				}

				return this;
			},
			fit() {
				current.camera.copy(camera.position);
				if (controls) current.focus.copy(controls.target);

				const { center, distance } = getSize();
				const direction = center.clone().sub(camera.position).normalize().multiplyScalar(distance);

				goal.camera.copy(center).sub(direction);
				goal.focus.copy(center);

				if (is.orthographicCamera(camera)) {
					current.zoom = camera.zoom;

					let maxHeight = 0,
						maxWidth = 0;
					const vertices = [
						new THREE.Vector3(box.min.x, box.min.y, box.min.z),
						new THREE.Vector3(box.min.x, box.max.y, box.min.z),
						new THREE.Vector3(box.min.x, box.min.y, box.max.z),
						new THREE.Vector3(box.min.x, box.max.y, box.max.z),
						new THREE.Vector3(box.max.x, box.max.y, box.max.z),
						new THREE.Vector3(box.max.x, box.max.y, box.min.z),
						new THREE.Vector3(box.max.x, box.min.y, box.max.z),
						new THREE.Vector3(box.max.x, box.min.y, box.min.z),
					];
					// Transform the center and each corner to camera space
					center.applyMatrix4(camera.matrixWorldInverse);
					for (const v of vertices) {
						v.applyMatrix4(camera.matrixWorldInverse);
						maxHeight = Math.max(maxHeight, Math.abs(v.y - center.y));
						maxWidth = Math.max(maxWidth, Math.abs(v.x - center.x));
					}
					maxHeight *= 2;
					maxWidth *= 2;
					const zoomForHeight = (camera.top - camera.bottom) / maxHeight;
					const zoomForWidth = (camera.right - camera.left) / maxWidth;
					goal.zoom = Math.min(zoomForHeight, zoomForWidth) / margin;
					if (!damping) {
						camera.zoom = goal.zoom;
						camera.updateProjectionMatrix();
					}
				}

				if (damping) {
					current.animating = true;
				} else {
					camera.position.copy(goal.camera);
					camera.lookAt(goal.focus);
					if (controls) {
						controls.target.copy(goal.focus);
						controls.update();
					}
				}

				if (fitted.observed) {
					fitted.emit(this.getSize());
				}
				invalidate();
				return this;
			},
		};
	});

	constructor() {
		this.preventDragHijacking();
		this.scalePointer();
		this.beforeRender();
	}

	private preventDragHijacking() {
		effect((onCleanup) => {
			const controls = this.controls();
			if (controls) {
				const callback = () => (this.current.animating = false);
				controls.addEventListener('start', callback);
				onCleanup(() => controls.removeEventListener('start', callback));
			}
		});
	}

	private scalePointer() {
		let count = 0;
		effect(() => {
			const [observe, fit, clip, api] = [
				this.observe(),
				this.fit(),
				this.clip(),
				untracked(this.api),
				this.camera(),
				this.controls(),
				this.size(),
			];

			if (observe || count++ === 0) {
				api.refresh();
				if (fit) api.fit();
				if (clip) api.clip();
			}
		});
	}

	private beforeRender() {
		injectBeforeRender(({ delta }) => {
			const [{ damping, eps }, camera, controls, invalidate] = [
				this.inputs.get(),
				this.camera(),
				this.controls(),
				this.invalidate(),
			];

			if (this.current.animating) {
				damp(this.current.focus, this.goal.focus, damping, delta);
				damp(this.current.camera, this.goal.camera, damping, delta);
				this.current.zoom = THREE.MathUtils.damp(this.current.zoom, this.goal.zoom, damping, delta);
				camera.position.copy(this.current.camera);

				if (is.orthographicCamera(camera)) {
					camera.zoom = this.current.zoom;
					camera.updateProjectionMatrix();
				}

				if (!controls) {
					camera.lookAt(this.current.focus);
				} else {
					controls.target.copy(this.current.focus);
					controls.update();
				}

				invalidate();
				if (is.orthographicCamera(camera) && !(Math.abs(this.current.zoom - this.goal.zoom) < eps)) return;
				if (!is.orthographicCamera(camera) && !equals(this.current.camera, this.goal.camera, eps)) return;
				if (controls && !equals(this.current.focus, this.goal.focus, eps)) return;
				this.current.animating = false;
			}
		});
	}
}
