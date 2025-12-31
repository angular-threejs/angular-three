import {
	ChangeDetectionStrategy,
	Component,
	computed,
	CUSTOM_ELEMENTS_SCHEMA,
	Directive,
	effect,
	inject,
	input,
	output,
	signal,
} from '@angular/core';
import { extend, NgtArgs, NgtThreeElements, omit, pick } from 'angular-three';
import { mergeInputs } from 'ngxtension/inject-inputs';
import { AmbientLight, Group, PointLight, SpotLight, Vector2 } from 'three';
import { NgtsAccumulativeShadows, NgtsAccumulativeShadowsOptions } from './accumulative-shadows';
import { NgtsBounds } from './bounds';
import { NgtsCenter, NgtsCenterOptions, NgtsCenterState } from './center';
import { NgtsContactShadows, NgtsContactShadowsOptions } from './contact-shadows';
import { NgtsEnvironment, NgtsEnvironmentOptions } from './environment/environment';
import { type NgtsEnvironmentPresets } from './environment/environment-resource';
import { NgtsRandomizedLights, NgtsRandomizedLightsOptions } from './randomized-lights';

/**
 * Predefined lighting presets for the stage.
 * Each preset defines main and fill light positions as [x, y, z] multipliers of the scene radius.
 */
const presets = {
	rembrandt: { main: [1, 2, 1], fill: [-2, -0.5, -2] },
	portrait: { main: [-1, 2, 0.5], fill: [-1, 0.5, -1.5] },
	upfront: { main: [0, 2, 1], fill: [-1, 0.5, -1.5] },
	soft: { main: [-2, 4, 4], fill: [-1, 0.5, -1.5] },
} as const;

/**
 * Configuration options for stage shadows.
 * Combines options from both accumulative and contact shadow components.
 */
type NgtsStageShadowsOptions = Partial<NgtsAccumulativeShadowsOptions> &
	Partial<NgtsRandomizedLightsOptions> &
	Partial<NgtsContactShadowsOptions> & {
		/**
		 * Type of shadow to use.
		 * 'contact' - Fast, simple contact shadows.
		 * 'accumulative' - Soft, accumulated shadows from multiple samples.
		 */
		type: 'contact' | 'accumulative';
		/**
		 * Vertical offset for the shadow plane.
		 * @default 0
		 */
		offset: number;
		/**
		 * Shadow bias to prevent shadow acne.
		 * @default -0.0001
		 */
		bias: number;
		/**
		 * Shadow normal bias.
		 * @default 0
		 */
		normalBias: number;
		/**
		 * Shadow map size in pixels.
		 * @default 1024
		 */
		size: number;
	};

/**
 * Configuration options for the NgtsStage component.
 * Extends the base group element options from Three.js.
 */
export interface NgtsStageOptions extends Partial<NgtThreeElements['ngt-group']> {
	/**
	 * Lighting preset or custom light configuration.
	 * Available presets: 'rembrandt', 'portrait', 'upfront', 'soft'.
	 * Or provide custom { main: [x, y, z], fill: [x, y, z] } positions.
	 * @default 'rembrandt'
	 */
	preset:
		| 'rembrandt'
		| 'portrait'
		| 'upfront'
		| 'soft'
		| { main: [x: number, y: number, z: number]; fill: [x: number, y: number, z: number] };
	/**
	 * Shadow configuration. Can be:
	 * - false: No shadows
	 * - 'contact': Simple contact shadows
	 * - 'accumulative': Soft accumulated shadows
	 * - NgtsStageShadowsOptions: Full shadow configuration
	 * @default 'contact'
	 */
	shadows: boolean | 'contact' | 'accumulative' | NgtsStageShadowsOptions;
	/**
	 * Whether to automatically adjust the camera to fit the content.
	 * Can be a boolean or a number representing the margin.
	 * @default true
	 */
	adjustCamera: boolean | number;
	/**
	 * Environment map configuration.
	 * Can be a preset name, full environment options, or null to disable.
	 * @default 'city'
	 */
	environment: NgtsEnvironmentPresets | Partial<NgtsEnvironmentOptions> | null;
	/**
	 * Overall lighting intensity multiplier.
	 * @default 0.5
	 */
	intensity: number;
	/**
	 * Options for centering the content within the stage.
	 */
	center?: Partial<NgtsCenterOptions>;
}

const defaultOptions: NgtsStageOptions = {
	preset: 'rembrandt',
	shadows: 'contact',
	adjustCamera: true,
	environment: 'city',
	intensity: 0.5,
};

/**
 * Internal directive that triggers camera refitting when the stage radius changes.
 *
 * @internal
 */
@Directive({ selector: 'ngts-stage-refit' })
export class NgtsStageRefit {
	/** Current radius of the scene bounds, used to trigger camera refit. */
	radius = input.required<number>();
	/** Whether automatic camera adjustment is enabled. */
	adjustCamera = input.required<boolean>();

	constructor() {
		const bounds = inject(NgtsBounds);

		effect(() => {
			const [, adjustCamera] = [this.radius(), this.adjustCamera()];
			if (adjustCamera) bounds.refresh().clip().fit();
		});
	}
}

/**
 * A complete stage setup for presenting 3D models with lighting, shadows, and environment.
 * Automatically centers content, sets up professional lighting presets, and configures shadows.
 *
 * This is a convenience component that combines:
 * - Bounds for auto-fitting the camera
 * - Center for centering content
 * - Environment map for reflections
 * - Contact or accumulative shadows
 * - Three-point lighting setup
 *
 * @example
 * ```html
 * <ngts-stage [options]="{ preset: 'rembrandt', shadows: 'contact', environment: 'city' }">
 *   <ngt-mesh>
 *     <ngt-box-geometry />
 *     <ngt-mesh-standard-material />
 *   </ngt-mesh>
 * </ngts-stage>
 * ```
 */
@Component({
	selector: 'ngts-stage',
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
	/** Configuration options for the stage setup. */
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });
	private parameters = omit(this.options, [
		'preset',
		'shadows',
		'adjustCamera',
		'environment',
		'intensity',
		'center',
	]);

	/** Emits when the content has been centered, providing the calculated dimensions. */
	centered = output<NgtsCenterState>();

	private dims = signal({ radius: 0, width: 0, height: 0, depth: 0 });
	protected radius = pick(this.dims, 'radius');
	protected height = pick(this.dims, 'height');

	private center = pick(this.options, 'center');
	protected adjustCamera = pick(this.options, 'adjustCamera');
	private margin = computed(() => Number(this.adjustCamera()));
	protected intensity = pick(this.options, 'intensity');
	protected shadows = pick(this.options, 'shadows');
	protected environment = pick(this.options, 'environment');
	private preset = pick(this.options, 'preset');

	protected config = computed(() => {
		const preset = this.preset();
		return typeof preset === 'string' ? presets[preset] : preset;
	});

	protected shadowBias = computed(() => (this.shadows() as NgtsStageShadowsOptions).bias ?? -0.0001);
	protected normalBias = computed(() => (this.shadows() as NgtsStageShadowsOptions).normalBias ?? 0);
	protected shadowSize = computed(() => (this.shadows() as NgtsStageShadowsOptions).size ?? 1024);
	protected shadowOffset = computed(() => (this.shadows() as NgtsStageShadowsOptions).offset ?? 0);
	protected contactShadow = computed(
		() => this.shadows() === 'contact' || (this.shadows() as NgtsStageShadowsOptions)?.type === 'contact',
	);
	protected accumulativeShadow = computed(
		() => this.shadows() === 'accumulative' || (this.shadows() as NgtsStageShadowsOptions)?.type === 'accumulative',
	);
	protected shadowOptions = computed(() => {
		const shadows = this.shadows() as NgtsStageShadowsOptions;

		if (this.contactShadow()) {
			return { scale: this.radius() * 4, far: this.radius(), blur: 2, ...shadows };
		}

		if (this.accumulativeShadow()) {
			return {
				temporal: true,
				frames: 100,
				alphaTest: 0.9,
				toneMapped: true,
				scale: this.radius() * 4,
				...shadows,
			};
		}

		return typeof shadows === 'object' ? shadows : {};
	});
	protected randomizedLightsOptions = computed(() => {
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
	protected environmentOptions = computed(() => {
		const environment = this.environment();
		return !environment ? {} : typeof environment === 'string' ? { preset: environment } : environment;
	});

	protected boundsOptions = computed(() => ({
		fit: !!this.adjustCamera(),
		clip: !!this.adjustCamera(),
		margin: this.margin(),
		observe: true,
		...this.parameters(),
	}));
	protected centerOptions = computed(
		() =>
			({
				...(this.center() || {}),
				position: [0, this.shadowOffset() / 2, 0],
			}) as Partial<NgtsCenterOptions>,
	);

	constructor() {
		extend({ AmbientLight, SpotLight, PointLight, Group, Vector2 });
	}

	/**
	 * Handles the centered event from NgtsCenter.
	 * Updates internal dimensions and emits the centered event.
	 *
	 * @param $event - The center state containing dimensions and bounding sphere
	 */
	onCenter($event: NgtsCenterState) {
		const { width, height, depth, boundingSphere } = $event;
		this.dims.set({ radius: boundingSphere.radius, width, height, depth });
		this.centered.emit($event);
	}
}
