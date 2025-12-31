import {
	CUSTOM_ELEMENTS_SCHEMA,
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	computed,
	effect,
	inject,
	input,
	viewChild,
} from '@angular/core';
import { NgtArgs, NgtThreeElements, extend, omit, pick } from 'angular-three';
import { getVersion } from 'angular-three-soba/misc';
import { mergeInputs } from 'ngxtension/inject-inputs';
import * as THREE from 'three';
import { DirectionalLight, Group, OrthographicCamera, Vector2 } from 'three';
import { NgtsAccumulativeShadows } from './accumulative-shadows';

/**
 * Configuration options for the NgtsRandomizedLights component.
 * Extends the base group element options from Three.js.
 */
export interface NgtsRandomizedLightsOptions extends Partial<NgtThreeElements['ngt-group']> {
	/**
	 * How many frames it will jiggle the lights.
	 * Frames is context aware - if a provider like AccumulativeShadows exists, frames will be taken from there.
	 * @default 1
	 */
	frames: number;
	/**
	 * Light position in 3D space.
	 * @default [0, 0, 0]
	 */
	position: [x: number, y: number, z: number];
	/**
	 * Radius of the jiggle. Higher values make softer light.
	 * @default 1
	 */
	radius: number;
	/**
	 * Amount of directional lights to create.
	 * @default 8
	 */
	amount: number;
	/**
	 * Light intensity. Distributed among all lights.
	 * @default Math.PI (for Three.js >= 155) or 1
	 */
	intensity: number;
	/**
	 * Ambient occlusion factor. Lower values mean less AO, higher values mean more.
	 * You can mix AO and directional light.
	 * @default 0.5
	 */
	ambient: number;
	/**
	 * Whether the lights cast shadows.
	 * @default true
	 */
	castShadow: boolean;
	/**
	 * Shadow bias to prevent shadow acne.
	 * @default 0.001
	 */
	bias: number;
	/**
	 * Shadow map size in pixels.
	 * @default 512
	 */
	mapSize: number;
	/**
	 * Size of the shadow camera frustum.
	 * @default 5
	 */
	size: number;
	/**
	 * Shadow camera near plane distance.
	 * @default 0.5
	 */
	near: number;
	/**
	 * Shadow camera far plane distance.
	 * @default 500
	 */
	far: number;
}

const defaultOptions: NgtsRandomizedLightsOptions = {
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
	intensity: getVersion() >= 155 ? Math.PI : 1,
	ambient: 0.5,
};

/**
 * Creates multiple randomized directional lights that jiggle their positions each frame.
 * Used in combination with AccumulativeShadows to create soft, natural-looking shadows.
 *
 * Must be used as a child of NgtsAccumulativeShadows.
 *
 * @example
 * ```html
 * <ngts-accumulative-shadows>
 *   <ngts-randomized-lights [options]="{ amount: 8, radius: 4, intensity: 1 }" />
 * </ngts-accumulative-shadows>
 * ```
 */
@Component({
	selector: 'ngts-randomized-lights',
	template: `
		<ngt-group #lights [parameters]="parameters()">
			@for (i of count(); track $index) {
				<ngt-directional-light [castShadow]="castShadow()" [intensity]="intensity() / amount()">
					<ngt-value [rawValue]="bias()" attach="shadow.bias" />
					<ngt-vector2 *args="shadowMapSize()" attach="shadow.mapSize" />
					<ngt-orthographic-camera *args="cameraArgs()" attach="shadow.camera" />
				</ngt-directional-light>
			}
		</ngt-group>
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtsRandomizedLights {
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });
	protected parameters = omit(this.options, Object.keys(defaultOptions) as Array<keyof NgtsRandomizedLightsOptions>);

	lightsRef = viewChild.required<ElementRef<THREE.Group>>('lights');

	private accumulativeShadows = inject(NgtsAccumulativeShadows);

	protected castShadow = pick(this.options, 'castShadow');
	protected bias = pick(this.options, 'bias');
	protected intensity = pick(this.options, 'intensity');
	protected amount = pick(this.options, 'amount');

	private mapSize = pick(this.options, 'mapSize');
	protected shadowMapSize = computed(() => [this.mapSize(), this.mapSize()]);

	private position = pick(this.options, 'position');
	private length = computed(() => new THREE.Vector3(...this.position()).length());

	protected count = computed(() => Array.from({ length: this.amount() }, (_, index) => index));

	private size = pick(this.options, 'size');
	private near = pick(this.options, 'near');
	private far = pick(this.options, 'far');
	protected cameraArgs = computed(() => [
		-this.size(),
		this.size(),
		this.size(),
		-this.size(),
		this.near(),
		this.far(),
	]);

	constructor() {
		extend({ Group, DirectionalLight, OrthographicCamera, Vector2 });

		effect((onCleanup) => {
			const lights = this.lightsRef().nativeElement;
			this.accumulativeShadows.lightsMap.set(lights.uuid, this.update.bind(this));
			onCleanup(() => this.accumulativeShadows.lightsMap.delete(lights.uuid));
		});
	}

	/**
	 * Updates the positions of all randomized lights.
	 * Called automatically by AccumulativeShadows each frame.
	 * Randomizes light positions based on ambient and radius settings.
	 */
	update() {
		let light: THREE.Object3D | undefined;
		const lights = this.lightsRef().nativeElement;
		if (lights) {
			const [{ ambient, radius, position }, length] = [this.options(), this.length()];

			for (let i = 0; i < lights.children.length; i++) {
				light = lights.children[i];
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
	}
}
