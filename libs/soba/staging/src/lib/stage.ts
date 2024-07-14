import {
	afterNextRender,
	ChangeDetectionStrategy,
	Component,
	computed,
	CUSTOM_ELEMENTS_SCHEMA,
	Directive,
	inject,
	input,
	output,
	signal,
} from '@angular/core';
import { extend, NgtArgs, NgtGroup, omit, pick } from 'angular-three';
import { injectAutoEffect } from 'ngxtension/auto-effect';
import { mergeInputs } from 'ngxtension/inject-inputs';
import { AmbientLight, Group, PointLight, SpotLight, Vector2 } from 'three';
import { NgtsAccumulativeShadows, NgtsAccumulativeShadowsOptions } from './accumulative-shadows';
import { NgtsBounds } from './bounds';
import { NgtsCenter, NgtsCenterOptions, NgtsCenterState } from './center';
import { NgtsContactShadows, NgtsContactShadowsOptions } from './contact-shadows';
import { NgtsEnvironment, NgtsEnvironmentOptions, NgtsEnvironmentPresets } from './environment';
import { NgtsRandomizedLights, NgtsRandomizedLightsOptions } from './randomized-lights';

const presets = {
	rembrandt: {
		main: [1, 2, 1],
		fill: [-2, -0.5, -2],
	},
	portrait: {
		main: [-1, 2, 0.5],
		fill: [-1, 0.5, -1.5],
	},
	upfront: {
		main: [0, 2, 1],
		fill: [-1, 0.5, -1.5],
	},
	soft: {
		main: [-2, 4, 4],
		fill: [-1, 0.5, -1.5],
	},
} as const;

type NgtsStageShadowsOptions = Partial<NgtsAccumulativeShadowsOptions> &
	Partial<NgtsRandomizedLightsOptions> &
	Partial<NgtsContactShadowsOptions> & {
		type: 'contact' | 'accumulative';
		/** Shadow plane offset, default: 0 */
		offset: number;
		/** Shadow bias, default: -0.0001 */
		bias: number;
		/** Shadow normal bias, default: 0 */
		normalBias: number;
		/** Shadow map size, default: 1024 */
		size: number;
	};

export interface NgtsStageOptions extends Partial<NgtGroup> {
	/** Lighting setup, default: "rembrandt" */
	preset:
		| 'rembrandt'
		| 'portrait'
		| 'upfront'
		| 'soft'
		| { main: [x: number, y: number, z: number]; fill: [x: number, y: number, z: number] };
	/** Controls the ground shadows, default: "contact" */
	shadows: boolean | 'contact' | 'accumulative' | NgtsStageShadowsOptions;
	/** Optionally wraps and thereby centers the models using <Bounds>, can also be a margin, default: true */
	adjustCamera: boolean | number;
	/** The default environment, default: "city" */
	environment: NgtsEnvironmentPresets | Partial<NgtsEnvironmentOptions> | null;
	/** The lighting intensity, default: 0.5 */
	intensity: number;
	/** To adjust centering, default: undefined */
	center?: Partial<NgtsCenterOptions>;
}

const defaultOptions: NgtsStageOptions = {
	preset: 'rembrandt',
	shadows: 'contact',
	adjustCamera: true,
	environment: 'city',
	intensity: 0.5,
};

@Directive({ standalone: true, selector: 'ngts-stage-refit' })
export class NgtsStageRefit {
	radius = input.required<number>();
	adjustCamera = input.required<boolean>();

	constructor() {
		const autoEffect = injectAutoEffect();
		const bounds = inject(NgtsBounds);

		afterNextRender(() => {
			autoEffect(() => {
				const [, adjustCamera] = [this.radius(), this.adjustCamera()];
				if (adjustCamera) bounds.refresh().clip().fit();
			});
		});
	}
}

@Component({
	selector: 'ngts-stage',
	standalone: true,
	template: `
		<ngt-ambient-light [intensity]="intensity() / 3" />
		<ngt-spot-light
			[penumbra]="1"
			[position]="[config().main[0] * radius(), config().main[1] * radius(), config().main[2] * radius()]"
			[intensity]="intensity() * 2"
			[castShadow]="!!shadows()"
		>
			<ngt-value [rawValue]="shadowBias()" attach="shadow.bias" />
			<ngt-value [rawValue]="normalBias()" attach="shadow.normalBias" />
			<ngt-vector2 *args="[shadowSize(), shadowSize()]" attach="shadow.mapSize" />
		</ngt-spot-light>
		<ngt-point-light
			[position]="[config().fill[0] * radius(), config().fill[1] * radius(), config().fill[2] * radius()]"
			[intensity]="intensity()"
		/>

		<ngts-bounds [options]="boundsOptions()">
			<ngts-stage-refit [radius]="radius()" [adjustCamera]="!!adjustCamera()" />
			<ngts-center [options]="centerOptions()" (centered)="onCenter($event)">
				<ng-content />
			</ngts-center>
		</ngts-bounds>

		<ngt-group [position]="[0, -height() / 2 - shadowOffset() / 2, 0]">
			@if (contactShadow()) {
				<ngts-contact-shadows [options]="shadowOptions()" />
			}

			@if (accumulativeShadow()) {
				<ngts-accumulative-shadows [options]="shadowOptions()">
					<ngts-randomized-lights [options]="randomizedLightsOptions()" />
				</ngts-accumulative-shadows>
			}
		</ngt-group>

		@if (environment()) {
			<ngts-environment [options]="environmentOptions()" />
		}
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [
		NgtArgs,
		NgtsBounds,
		NgtsStageRefit,
		NgtsCenter,
		NgtsContactShadows,
		NgtsAccumulativeShadows,
		NgtsEnvironment,
		NgtsRandomizedLights,
	],
})
export class NgtsStage {
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });
	private parameters = omit(this.options, ['preset', 'shadows', 'adjustCamera', 'environment', 'intensity', 'center']);

	centered = output<NgtsCenterState>();

	private dims = signal({ radius: 0, width: 0, height: 0, depth: 0 });
	radius = pick(this.dims, 'radius');
	height = pick(this.dims, 'height');

	center = pick(this.options, 'center');
	adjustCamera = pick(this.options, 'adjustCamera');
	margin = computed(() => Number(this.adjustCamera()));
	intensity = pick(this.options, 'intensity');
	shadows = pick(this.options, 'shadows');
	environment = pick(this.options, 'environment');
	preset = pick(this.options, 'preset');

	config = computed(() => {
		const preset = this.preset();
		return typeof preset === 'string' ? presets[preset] : preset;
	});

	shadowBias = computed(() => (this.shadows() as NgtsStageShadowsOptions).bias ?? -0.0001);
	normalBias = computed(() => (this.shadows() as NgtsStageShadowsOptions).normalBias ?? 0);
	shadowSize = computed(() => (this.shadows() as NgtsStageShadowsOptions).size ?? 1024);
	shadowOffset = computed(() => (this.shadows() as NgtsStageShadowsOptions).offset ?? 0);
	contactShadow = computed(
		() => this.shadows() === 'contact' || (this.shadows() as NgtsStageShadowsOptions)?.type === 'contact',
	);
	accumulativeShadow = computed(
		() => this.shadows() === 'accumulative' || (this.shadows() as NgtsStageShadowsOptions)?.type === 'accumulative',
	);
	shadowOptions = computed(() => {
		const shadows = this.shadows() as NgtsStageShadowsOptions;

		if (this.contactShadow()) {
			return { scale: this.radius() * 4, far: this.radius(), blur: 2, ...shadows };
		}

		if (this.accumulativeShadow()) {
			return { temporal: true, frames: 100, alphaTest: 0.9, toneMapped: true, scale: this.radius() * 4, ...shadows };
		}

		return typeof shadows === 'object' ? shadows : {};
	});
	randomizedLightsOptions = computed(() => {
		if (!this.accumulativeShadow()) return {};
		const shadows = this.shadows() as NgtsStageShadowsOptions;
		return {
			amount: shadows.amount ?? 8,
			radius: shadows.radius ?? this.radius(),
			ambient: shadows.ambient ?? 0.5,
			intensity: shadows.intensity ?? 1,
			position: [
				this.config().main[0] * this.radius(),
				this.config().main[1] * this.radius(),
				this.config().main[2] * this.radius(),
			],
			size: this.radius() * 4,
			bias: -this.shadowBias(),
			mapSize: this.shadowSize(),
		} as Partial<NgtsRandomizedLightsOptions>;
	});
	environmentOptions = computed(() => {
		const environment = this.environment();
		return !environment ? {} : typeof environment === 'string' ? { preset: environment } : environment;
	});

	boundsOptions = computed(() => ({
		fit: !!this.adjustCamera(),
		clip: !!this.adjustCamera(),
		margin: Number(this.adjustCamera()),
		observe: true,
		...this.parameters(),
	}));
	centerOptions = computed(
		() =>
			({
				...(this.center() || {}),
				position: [0, this.shadowOffset() / 2, 0],
			}) as Partial<NgtsCenterOptions>,
	);

	constructor() {
		extend({ AmbientLight, SpotLight, PointLight, Group, Vector2 });
	}

	onCenter($event: NgtsCenterState) {
		const { width, height, depth, boundingSphere } = $event;
		this.dims.set({ radius: boundingSphere.radius, width, height, depth });
		this.centered.emit($event);
	}
}
