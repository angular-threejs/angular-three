import { CUSTOM_ELEMENTS_SCHEMA, Component, Input, computed, effect } from '@angular/core';
import { NgtArgs, NgtRepeat, extend, injectNgtRef, signalStore, type NgtGroup } from 'angular-three';
import * as THREE from 'three';
import { DirectionalLight, Group, OrthographicCamera, Vector2 } from 'three';
import { injectNgtsAccumulativeShadowsApi } from './accumulative-shadows';

extend({ Group, DirectionalLight, OrthographicCamera, Vector2 });

export type NgtsRandomizedLightsState = {
	/** How many frames it will jiggle the lights, 1.
	 *  Frames is context aware, if a provider like AccumulativeShadows exists, frames will be taken from there!  */
	frames: number;
	/** Light position, [0, 0, 0] */
	position: [x: number, y: number, z: number];
	/** Radius of the jiggle, higher values make softer light, 5 */
	radius: number;
	/** Amount of lights, 8 */
	amount: number;
	/** Light intensity, 1 */
	intensity: number;
	/** Ambient occlusion, lower values mean less AO, hight more, you can mix AO and directional light, 0.5 */
	ambient: number;
	/** If the lights cast shadows, this is true by default */
	castShadow: boolean;
	/** Default shadow bias, 0 */
	bias: number;
	/** Default map size, 512 */
	mapSize: number;
	/** Default size of the shadow camera, 10 */
	size: number;
	/** Default shadow camera near, 0.5 */
	near: number;
	/** Default shadow camera far, 500 */
	far: number;
};

declare global {
	interface HTMLElementTagNameMap {
		/**
		 * @extends ngt-group
		 */
		'ngts-randomized-lights': NgtsRandomizedLightsState & NgtGroup;
	}
}

@Component({
	selector: 'ngts-randomized-lights',
	standalone: true,
	template: `
		<ngt-group ngtCompound [ref]="lightsRef">
			<ngt-directional-light
				*ngFor="let i; repeat: amount()"
				[castShadow]="castShadow()"
				[intensity]="intensity() / amount()"
			>
				<ngt-value [rawValue]="bias()" attach="shadow.bias" />
				<ngt-vector2 *args="shadowsMapSize()" attach="shadow.mapSize" />
				<ngt-orthographic-camera *args="cameraArgs()" attach="shadow.camera" />
			</ngt-directional-light>
			<ng-content />
		</ngt-group>
	`,
	imports: [NgtRepeat, NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsRandomizedLights {
	private inputs = signalStore<NgtsRandomizedLightsState>({
		castShadow: true,
		bias: 0.001,
		mapSize: 512,
		size: 5,
		near: 0.5,
		far: 500,
		frames: 1,
		position: [0, 0, 0],
		radius: 1,
		amount: 8,
		intensity: 1,
		ambient: 0.5,
	});
	Math = Math;

	@Input() lightsRef = injectNgtRef<Group>();
	/** How many frames it will jiggle the lights, 1.
	 *  Frames is context aware, if a provider like AccumulativeShadows exists, frames will be taken from there!  */
	@Input({ alias: 'frames' }) set _frames(frames: number) {
		this.inputs.set({ frames });
	}

	/** Light position, [0, 0, 0] */
	@Input({ alias: 'position' }) set _position(position: [x: number, y: number, z: number]) {
		this.inputs.set({ position });
	}

	/** Radius of the jiggle, higher values make softer light, 5 */
	@Input({ alias: 'radius' }) set _radius(radius: number) {
		this.inputs.set({ radius });
	}

	/** Amount of lights, 8 */
	@Input({ alias: 'amount' }) set _amount(amount: number) {
		this.inputs.set({ amount });
	}

	/** Light intensity, 1 */
	@Input({ alias: 'intensity' }) set _intensity(intensity: number) {
		this.inputs.set({ intensity });
	}

	/** Ambient occlusion, lower values mean less AO, hight more, you can mix AO and directional light, 0.5 */
	@Input({ alias: 'ambient' }) set _ambient(ambient: number) {
		this.inputs.set({ ambient });
	}

	/** If the lights cast shadows, this is true by default */
	@Input({ alias: 'castShadow' }) set _castShadow(castShadow: boolean) {
		this.inputs.set({ castShadow });
	}

	/** Default shadow bias, 0 */
	@Input({ alias: 'bias' }) set _bias(bias: number) {
		this.inputs.set({ bias });
	}

	/** Default map size, 512 */
	@Input({ alias: 'mapSize' }) set _mapSize(mapSize: number) {
		this.inputs.set({ mapSize });
	}

	/** Default size of the shadow camera, 10 */
	@Input({ alias: 'size' }) set _size(size: number) {
		this.inputs.set({ size });
	}

	/** Default shadow camera near, 0.5 */
	@Input({ alias: 'near' }) set _near(near: number) {
		this.inputs.set({ near });
	}

	/** Default shadow camera far, 500 */
	@Input({ alias: 'far' }) set _far(far: number) {
		this.inputs.set({ far });
	}

	private position = this.inputs.select('position');
	private ambient = this.inputs.select('ambient');
	private radius = this.inputs.select('radius');
	private mapSize = this.inputs.select('mapSize');
	private size = this.inputs.select('size');
	private near = this.inputs.select('near');
	private far = this.inputs.select('far');

	private length = computed(() => new THREE.Vector3(...this.position()).length());

	private shadowsApi = injectNgtsAccumulativeShadowsApi();

	amount = this.inputs.select('amount');
	castShadow = this.inputs.select('castShadow');
	intensity = this.inputs.select('intensity');
	bias = this.inputs.select('bias');

	shadowsMapSize = computed(() => [this.mapSize(), this.mapSize()]);
	cameraArgs = computed(() => [-this.size(), this.size(), this.size(), -this.size(), this.near(), this.far()]);

	api = computed(() => {
		const [lights, ambient, radius, length, position] = [
			this.lightsRef.nativeElement,
			this.ambient(),
			this.radius(),
			this.length(),
			this.position(),
		];

		const update = () => {
			if (lights) {
				for (let l = 0; l < lights.children.length; l++) {
					const light = lights.children[l] as THREE.DirectionalLight;
					if (Math.random() > ambient) {
						light.position.set(
							position[0] + THREE.MathUtils.randFloatSpread(radius),
							position[1] + THREE.MathUtils.randFloatSpread(radius),
							position[2] + THREE.MathUtils.randFloatSpread(radius),
						);
					} else {
						const lambda = Math.acos(2 * Math.random() - 1) - Math.PI / 2.0;
						const phi = 2 * Math.PI * Math.random();
						light.position.set(
							Math.cos(lambda) * Math.cos(phi) * length,
							Math.abs(Math.cos(lambda) * Math.sin(phi) * length),
							Math.sin(lambda) * length,
						);
					}
				}
			}
		};

		return { update };
	});

	constructor() {
		this.updateLightMap();
	}

	private updateLightMap() {
		effect((onCleanup) => {
			const lights = this.lightsRef.nativeElement;
			if (!lights) return;
			const shadowsApi = this.shadowsApi();
			if (shadowsApi) {
				shadowsApi.lights.set(lights.uuid, this.api);
				onCleanup(() => shadowsApi.lights.delete(lights.uuid));
			}
		});
	}
}
