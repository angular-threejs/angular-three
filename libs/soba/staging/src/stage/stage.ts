import { NgIf } from '@angular/common';
import {
	CUSTOM_ELEMENTS_SCHEMA,
	Component,
	Directive,
	EventEmitter,
	Input,
	Output,
	computed,
	type OnChanges,
} from '@angular/core';
import { NgtArgs, extend, signalStore } from 'angular-three';
import { AmbientLight, Group, PointLight, SpotLight, Vector2 } from 'three';
import {
	NgtsAccumulativeShadows,
	type NgtsAccumulativeShadowsState,
} from '../accumulative-shadows/accumulative-shadows';
import { NgtsRandomizedLights, type NgtsRandomizedLightsState } from '../accumulative-shadows/randomized-lights';
import { NgtsBounds, injectNgtsBoundsApi } from '../bounds/bounds';
import { NgtsCenter, type NgtsCenterState, type NgtsCenteredEvent } from '../center/center';
import { NgtsContactShadows, type NgtsContactShadowsState } from '../contact-shadows/contact-shadows';
import type { NgtsEnvironmentPresetsType } from '../environment/assets';
import { NgtsEnvironment } from '../environment/environment';
import { type NgtsEnvironmentInputState } from '../environment/environment-input';

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
};

type NgtsStageShadowsState = Partial<NgtsAccumulativeShadowsState> &
	Partial<NgtsRandomizedLightsState> &
	Partial<NgtsContactShadowsState> & {
		type: 'contact' | 'accumulative';
		/** Shadow plane offset, default: 0 */
		offset?: number;
		/** Shadow bias, default: -0.0001 */
		bias?: number;
		/** Shadow normal bias, default: 0 */
		normalBias?: number;
		/** Shadow map size, default: 1024 */
		size?: number;
	};

export type NgtsStageState = {
	/** Lighting setup, default: "rembrandt" */
	preset:
		| 'rembrandt'
		| 'portrait'
		| 'upfront'
		| 'soft'
		| { main: [x: number, y: number, z: number]; fill: [x: number, y: number, z: number] };
	/** Controls the ground shadows, default: "contact" */
	shadows: boolean | 'contact' | 'accumulative' | NgtsStageShadowsState;
	/** Optionally wraps and thereby centers the models using <Bounds>, can also be a margin, default: true */
	adjustCamera: boolean | number;
	/** The default environment, default: "city" */
	environment: NgtsEnvironmentPresetsType | Partial<NgtsEnvironmentInputState>;
	/** The lighting intensity, default: 0.5 */
	intensity: number;
	/** To adjust centering, default: undefined */
	center?: Partial<NgtsCenterState>;
};

declare global {
	interface HTMLElementTagNameMap {
		'ngts-stage': NgtsStageState;
	}
}

extend({ AmbientLight, SpotLight, Vector2, PointLight, Group });

@Directive({ selector: 'ngts-stage-refit', standalone: true })
export class NgtsStageRefit implements OnChanges {
	boundsApi = injectNgtsBoundsApi();

	@Input() radius = 0;
	@Input() adjustCamera: boolean | number = true;

	ngOnChanges() {
		if (this.adjustCamera) {
			this.boundsApi().refresh().clip().fit();
		}
	}
}

@Component({
	selector: 'ngts-stage',
	standalone: true,
	template: `
		<ngt-ambient-light [intensity]="intensity() / 3" />
		<ngt-spot-light
			[penumbra]="1"
			[position]="[
				config().main[0] * boundingState.get('radius'),
				config().main[1] * boundingState.get('radius'),
				config().main[2] * boundingState.get('radius')
			]"
			[intensity]="intensity() * 2"
			[castShadow]="!!shadows()"
		>
			<ngt-value [rawValue]="shadowsState().shadowBias" attach="shadow.bias" />
			<ngt-value [rawValue]="shadowsState().normalBias" attach="shadow.normalBias" />
			<ngt-vector2 *args="[shadowsState().shadowSize, shadowsState().shadowSize]" attach="shadow.mapSize" />
		</ngt-spot-light>
		<ngt-point-light
			[position]="[
				config().fill[0] * boundingState.get('radius'),
				config().fill[1] * boundingState.get('radius'),
				config().fill[2] * boundingState.get('radius')
			]"
			[intensity]="intensity()"
		/>

		<ngts-bounds
			[fit]="!!adjustCamera()"
			[clip]="!!adjustCamera()"
			[margin]="Number(adjustCamera())"
			[observe]="true"
		>
			<ngts-stage-refit [radius]="boundingState.get('radius')" [adjustCamera]="adjustCamera()" />
			<ngts-center
				[position]="[0, shadowsState().shadowOffset / 2, 0]"
				[top]="!!center()?.top"
				[right]="!!center()?.right"
				[bottom]="!!center()?.bottom"
				[left]="!!center()?.left"
				[front]="!!center()?.front"
				[back]="!!center()?.back"
				[disableX]="!!center()?.disableX"
				[disableY]="!!center()?.disableY"
				[disableZ]="!!center()?.disableZ"
				[precise]="!!center()?.precise"
				(centered)="onCentered($event)"
			>
				<ng-content />
			</ngts-center>
		</ngts-bounds>

		<ngt-group [position]="[0, -boundingState.get('height') / 2 - shadowsState().shadowOffset / 2, 0]">
			<ngts-contact-shadows
				*ngIf="shadowsState().contactShadow"
				[scale]="boundingState.get('radius') * 4"
				[far]="boundingState.get('radius')"
				[blur]="2"
				[opacity]="shadowsState().opacity!"
				[width]="shadowsState().width!"
				[height]="shadowsState().height!"
				[smooth]="shadowsState().smooth!"
				[resolution]="shadowsState().resolution!"
				[frames]="shadowsState().frames!"
				[scale]="shadowsState().scale!"
				[color]="shadowsState().color!"
				[depthWrite]="shadowsState().depthWrite!"
				[renderOrder]="shadowsState().renderOrder!"
			/>
			<ngts-accumulative-shadows
				*ngIf="shadowsState().accumulativeShadow"
				[temporal]="true"
				[frames]="100"
				[alphaTest]="0.9"
				[toneMapped]="true"
				[scale]="boundingState.get('radius') * 4"
				[opacity]="shadowsState().opacity!"
				[alphaTest]="shadowsState().alphaTest!"
				[color]="shadowsState().color!"
				[colorBlend]="shadowsState().colorBlend!"
				[resolution]="shadowsState().resolution!"
			>
				<ngts-randomized-lights
					[amount]="shadowsState().amount ?? 8"
					[radius]="shadowsState().radius ?? boundingState.get('radius')"
					[ambient]="shadowsState().ambient ?? 0.5"
					[intensity]="shadowsState().intensity ?? 1"
					[position]="[
						config().main[0] * boundingState.get('radius'),
						config().main[1] * boundingState.get('radius'),
						config().main[2] * boundingState.get('radius')
					]"
					[size]="boundingState.get('radius') * 4"
					[bias]="-shadowsState().shadowBias"
					[mapSize]="shadowsState().shadowSize"
				/>
			</ngts-accumulative-shadows>
		</ngt-group>

		<ngts-environment
			*ngIf="environmentState() as environment"
			[frames]="environment.frames"
			[near]="environment.near"
			[far]="environment.far"
			[resolution]="environment.resolution"
			[background]="environment.background"
			[blur]="environment.blur"
			[map]="environment.map"
			[files]="environment.files"
			[path]="environment.path"
			[preset]="environment.preset"
			[scene]="environment.scene"
			[extensions]="environment.extensions"
			[ground]="environment.ground"
			[encoding]="environment.encoding"
		/>
	`,
	imports: [
		NgtArgs,
		NgIf,
		NgtsBounds,
		NgtsStageRefit,
		NgtsCenter,
		NgtsContactShadows,
		NgtsAccumulativeShadows,
		NgtsRandomizedLights,
		NgtsEnvironment,
	],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsStage {
	Number = Number;

	private inputs = signalStore<NgtsStageState>({
		adjustCamera: true,
		intensity: 0.5,
		shadows: 'contact',
		environment: 'city',
		preset: 'rembrandt',
	});

	@Input({ alias: 'preset' }) set _preset(preset: NgtsStageState['preset']) {
		this.inputs.set({ preset });
	}

	@Input({ alias: 'shadows' }) set _shadows(shadows: NgtsStageState['shadows']) {
		this.inputs.set({ shadows });
	}

	@Input({ alias: 'adjustCamera' }) set _adjustCamera(adjustCamera: NgtsStageState['adjustCamera']) {
		this.inputs.set({ adjustCamera });
	}

	@Input({ alias: 'environment' }) set _environment(environment: NgtsStageState['environment']) {
		this.inputs.set({ environment });
	}

	@Input({ alias: 'intensity' }) set _intensity(intensity: NgtsStageState['intensity']) {
		this.inputs.set({ intensity });
	}

	@Input({ alias: 'center' }) set _center(center: NgtsStageState['center']) {
		this.inputs.set({ center });
	}

	@Output() centered = new EventEmitter<NgtsCenteredEvent>();

	private preset = this.inputs.select('preset');
	private environment = this.inputs.select('environment');

	boundingState = signalStore({ radius: 0, width: 0, height: 0, depth: 0 });
	config = computed(() => {
		const preset = this.preset();
		return typeof preset === 'string' ? presets[preset] : preset;
	});
	shadows = this.inputs.select('shadows');
	intensity = this.inputs.select('intensity');
	adjustCamera = this.inputs.select('adjustCamera');
	center = this.inputs.select('center');

	shadowsState = computed(() => {
		const shadows = this.shadows();
		const {
			bias: shadowBias = -0.0001,
			normalBias = 0,
			size: shadowSize = 1024,
			offset: shadowOffset = 0,
			...restProps
		} = (typeof shadows === 'string' ? {} : shadows || {}) as NgtsStageShadowsState;
		return {
			contactShadow: shadows === 'contact' || restProps.type === 'contact',
			accumulativeShadow: shadows === 'accumulative' || restProps.type === 'accumulative',
			shadowBias,
			normalBias,
			shadowSize,
			shadowOffset,
			...restProps,
		};
	});
	environmentState = computed(() => {
		const environment = this.environment();
		return !environment ? null : typeof environment === 'string' ? { preset: environment } : environment;
	});

	onCentered($event: NgtsCenteredEvent) {
		const { width, height, depth, boundingSphere } = $event;
		this.boundingState.set({ radius: boundingSphere.radius, width, height, depth });
		if (this.centered.observed) this.centered.emit($event);
	}
}
