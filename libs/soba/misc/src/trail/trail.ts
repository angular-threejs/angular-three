import {
	CUSTOM_ELEMENTS_SCHEMA,
	Component,
	Input,
	computed,
	effect,
	runInInjectionContext,
	type Injector,
} from '@angular/core';
import {
	NgtPortal,
	NgtPortalContent,
	NgtRef,
	assertInjectionContext,
	extend,
	injectBeforeRender,
	injectNgtRef,
	injectNgtStore,
	is,
	signalStore,
} from 'angular-three';
import { MeshLineGeometry, MeshLineMaterial } from 'meshline';
import * as THREE from 'three';
import { Group, Mesh } from 'three';

const shiftLeft = (collection: Float32Array, steps = 1): Float32Array => {
	collection.set(collection.subarray(steps));
	collection.fill(-Infinity, -steps);
	return collection;
};

export type NgtsTrailSettings = {
	width: number;
	length: number;
	decay: number;
	/**
	 * Wether to use the target's world or local positions
	 */
	local: boolean;
	// Min distance between previous and current points
	stride: number;
	// Number of frames to wait before next calculation
	interval: number;
};

const defaultSettings: NgtsTrailSettings = {
	width: 0.2,
	length: 1,
	decay: 1,
	local: false,
	stride: 0,
	interval: 1,
};

export function injectNgtsTrail(
	targetFactory: () => NgtRef<THREE.Object3D> | null,
	settingsFactory: () => Partial<NgtsTrailSettings>,
	{ injector }: { injector?: Injector } = {},
) {
	injector = assertInjectionContext(injectNgtsTrail, injector);
	return runInInjectionContext(injector, () => {
		const points = injectNgtRef<Float32Array>();
		let frameCount = 0;

		const prevPosition = new THREE.Vector3();
		const worldPosition = new THREE.Vector3();

		const _target = computed(() => {
			const _target = targetFactory();
			if (is.ref(_target)) return _target.nativeElement;
			return _target;
		});

		const _settings = computed(() => ({ ...defaultSettings, ...settingsFactory() }));
		const _length = computed(() => _settings().length);

		effect(() => {
			const [target, length] = [_target(), _length()];
			if (target) {
				points.nativeElement = Float32Array.from({ length: length * 10 * 3 }, (_, i) =>
					target.position.getComponent(i % 3),
				);
			}
		});

		injectBeforeRender(() => {
			const [target, _points, { local, decay, stride, interval }] = [
				_target(),
				points.nativeElement,
				_settings(),
			];
			if (!target) return;
			if (!_points) return;

			if (frameCount === 0) {
				let newPosition: THREE.Vector3;
				if (local) {
					newPosition = target.position;
				} else {
					target.getWorldPosition(worldPosition);
					newPosition = worldPosition;
				}

				const steps = 1 * decay;
				for (let i = 0; i < steps; i++) {
					if (newPosition.distanceTo(prevPosition) < stride) continue;

					shiftLeft(_points, 3);
					_points.set(newPosition.toArray(), _points.length - 3);
				}
				prevPosition.copy(newPosition);
			}

			frameCount++;
			frameCount = frameCount % interval;
		});

		return points;
	});
}

export type NgtsTrailState = {
	color: THREE.ColorRepresentation;
	attenuation: (width: number) => number;
	settings: NgtsTrailSettings;
	target?: NgtRef<THREE.Object3D>;
};

declare global {
	interface HTMLElementTagNameMap {
		'ngts-trail': NgtsTrailState;
	}
}

extend({ Group, Mesh });

@Component({
	selector: 'ngts-trail',
	standalone: true,
	template: `
		<ngt-group>
			<ngt-portal [container]="scene()" [autoRender]="false">
				<ng-template ngtPortalContent>
					<ngt-mesh [ref]="trailRef" [geometry]="geometry" [material]="material()" />
				</ng-template>
			</ngt-portal>
			<ngt-group [ref]="groupRef">
				<ng-content />
			</ngt-group>
		</ngt-group>
	`,
	imports: [NgtPortal, NgtPortalContent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsTrail {
	private inputs = signalStore<NgtsTrailState>({ settings: defaultSettings, color: 'hotpink' });

	@Input() trailRef = injectNgtRef<Mesh>();

	@Input({ alias: 'color' }) set _color(color: THREE.ColorRepresentation) {
		this.inputs.set({ color });
	}

	@Input({ alias: 'attenuation' }) set _attenuation(attenuation: (width: number) => number) {
		this.inputs.set({ attenuation });
	}

	@Input({ alias: 'target' }) set _target(target: NgtRef<THREE.Object3D>) {
		this.inputs.set({ target });
	}

	@Input({ alias: 'settings' }) set _settings(settings: Partial<NgtsTrailSettings>) {
		this.inputs.set({ settings: { ...defaultSettings, ...settings } });
	}

	groupRef = injectNgtRef<Group>();

	private children = this.groupRef.children('both');

	private store = injectNgtStore();
	private size = this.store.select('size');

	private target = this.inputs.select('target');
	private settings = this.inputs.select('settings');
	private width = computed(() => this.settings().width);
	private color = this.inputs.select('color');
	private attenuation = this.inputs.select('attenuation');

	private anchor = computed(() => {
		const target = this.target();
		if (target) return target;
		const group = this.groupRef.nativeElement;
		if (group) {
			return group.children.find((child) => child instanceof THREE.Object3D) || null;
		}
		return null;
	});

	private points = injectNgtsTrail(this.anchor, this.settings);

	scene = this.store.select('scene');
	geometry = new MeshLineGeometry();
	material = computed(() => {
		const [width, color, size] = [this.width(), this.color(), this.size()];

		const m = new MeshLineMaterial({
			lineWidth: 0.1 * width,
			color,
			sizeAttenuation: 1,
			resolution: new THREE.Vector2(size.width, size.height),
		});

		// TODO: understand this first
		// Get and apply first <meshLineMaterial /> from children
		// let matOverride: React.ReactElement | undefined;
		// if (children) {
		// 	if (Array.isArray(children)) {
		// 		matOverride = children.find((child: React.ReactNode) => {
		// 			const c = child as React.ReactElement;
		// 			return typeof c.type === 'string' && c.type === 'meshLineMaterial';
		// 		}) as React.ReactElement | undefined;
		// 	} else {
		// 		const c = children as React.ReactElement;
		// 		if (typeof c.type === 'string' && c.type === 'meshLineMaterial') {
		// 			matOverride = c;
		// 		}
		// 	}
		// }
		// if (typeof matOverride?.props === 'object') {
		// 	m.setValues(matOverride.props);
		// }

		return m;
	});

	constructor() {
		this.setMaterialSize();
		this.beforeRender();
	}

	private setMaterialSize() {
		effect(() => {
			const [material, size] = [this.material(), this.size()];
			material.uniforms['resolution'].value.set(size.width, size.height);
		});
	}

	private beforeRender() {
		injectBeforeRender(() => {
			const [points, attenuation] = [this.points.nativeElement, this.attenuation()];
			if (!points) return;
			this.geometry.setPoints(points, attenuation);
		});
	}
}
