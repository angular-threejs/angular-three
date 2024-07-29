import {
	CUSTOM_ELEMENTS_SCHEMA,
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	afterNextRender,
	computed,
	inject,
	input,
	viewChild,
} from '@angular/core';
import { NgtArgs, NgtGroup, extend, omit, pick } from 'angular-three';
import { getVersion } from 'angular-three-soba/misc';
import { injectAutoEffect } from 'ngxtension/auto-effect';
import { mergeInputs } from 'ngxtension/inject-inputs';
import { DirectionalLight, Group, MathUtils, Object3D, OrthographicCamera, Vector2, Vector3 } from 'three';
import { NgtsAccumulativeShadows } from './accumulative-shadows';

export interface NgtsRandomizedLightsOptions extends Partial<NgtGroup> {
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

@Component({
	selector: 'ngts-randomized-lights',
	standalone: true,
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
	parameters = omit(this.options, Object.keys(defaultOptions) as Array<keyof NgtsRandomizedLightsOptions>);

	lightsRef = viewChild.required<ElementRef<Group>>('lights');

	private accumulativeShadows = inject(NgtsAccumulativeShadows);

	castShadow = pick(this.options, 'castShadow');
	bias = pick(this.options, 'bias');
	intensity = pick(this.options, 'intensity');
	amount = pick(this.options, 'amount');

	private mapSize = pick(this.options, 'mapSize');
	shadowMapSize = computed(() => [this.mapSize(), this.mapSize()]);

	private position = pick(this.options, 'position');
	length = computed(() => new Vector3(...this.position()).length());

	count = computed(() => Array.from({ length: this.amount() }, (_, index) => index));

	private size = pick(this.options, 'size');
	private near = pick(this.options, 'near');
	private far = pick(this.options, 'far');
	cameraArgs = computed(() => [-this.size(), this.size(), this.size(), -this.size(), this.near(), this.far()]);

	constructor() {
		extend({ Group, DirectionalLight, OrthographicCamera, Vector2 });

		const autoEffect = injectAutoEffect();

		afterNextRender(() => {
			autoEffect(() => {
				const lights = this.lightsRef().nativeElement;
				this.accumulativeShadows.lightsMap.set(lights.uuid, this.update.bind(this));
				return () => this.accumulativeShadows.lightsMap.delete(lights.uuid);
			});
		});
	}

	update() {
		let light: Object3D | undefined;
		const lights = this.lightsRef().nativeElement;
		if (lights) {
			const [{ ambient, radius, position }, length] = [this.options(), this.length()];

			for (let i = 0; i < lights.children.length; i++) {
				light = lights.children[i];
				if (Math.random() > ambient) {
					light.position.set(
						position[0] + MathUtils.randFloatSpread(radius),
						position[1] + MathUtils.randFloatSpread(radius),
						position[2] + MathUtils.randFloatSpread(radius),
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
