import { NgIf } from '@angular/common';
import {
	CUSTOM_ELEMENTS_SCHEMA,
	ChangeDetectionStrategy,
	Component,
	DestroyRef,
	EnvironmentInjector,
	InjectionToken,
	Injector,
	Input,
	ViewChild,
	ViewContainerRef,
	createEnvironmentInjector,
	effect,
	inject,
	reflectComponentType,
	signal,
	type ComponentMirror,
	type ComponentRef,
	type OnInit,
	type Signal,
	type Type,
} from '@angular/core';
import { Decorator, moduleMetadata, type Args } from '@storybook/angular';
import { NgtArgs, NgtCanvas, extend, safeDetectChanges, type NgtPerformance } from 'angular-three';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
// import { NgtsLoader } from 'angular-three-soba/loaders';
import * as THREE from 'three';

interface CanvasOptions {
	camera?: {
		position?: [number, number, number];
		fov?: number;
	};
	performance?: Partial<Omit<NgtPerformance, 'regress'>>;
	whiteBackground?: boolean;
	controls?:
		| boolean
		| {
				makeDefault?: boolean;
		  };
	lights?: boolean;
	compoundPrefixes?: string[];
	loader?: boolean;
}

const defaultCanvasOptions: CanvasOptions = {
	camera: {
		position: [-5, 5, 5],
		fov: 75,
	},
	performance: {
		current: 1,
		min: 0.5,
		max: 1,
		debounce: 200,
	},
	whiteBackground: false,
	controls: true,
	lights: true,
	loader: false,
};

extend(THREE);

const CANVAS_OPTIONS = new InjectionToken<CanvasOptions>('canvas options');
const STORY_COMPONENT = new InjectionToken<Type<unknown>>('story component');
const STORY_COMPONENT_MIRROR = new InjectionToken<ComponentMirror<Type<unknown>>>('story component mirror');
const STORY_INPUTS = new InjectionToken<Signal<Record<string, unknown>>>('story inputs');

@Component({
	standalone: true,
	template: `
		<ng-container *ngIf="canvasOptions.whiteBackground">
			<ngt-color *args="['white']" attach="background" />
		</ng-container>

		<ng-container *ngIf="canvasOptions.lights">
			<ngt-ambient-light [intensity]="0.8" />
			<ngt-point-light [intensity]="1" [position]="[0, 6, 0]" />
		</ng-container>

		<ng-container *ngIf="canvasOptions.controls">
			<ngts-orbit-controls [makeDefault]="canvasOptions.controls?.makeDefault" />
		</ng-container>

		<ng-container #anchor />
	`,
	imports: [NgIf, NgtArgs, NgtsOrbitControls],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class StorybookScene implements OnInit {
	canvasOptions = inject(CANVAS_OPTIONS);

	private story = inject(STORY_COMPONENT);
	private storyMirror = inject(STORY_COMPONENT_MIRROR);
	private inputs = inject(STORY_INPUTS);
	private injector = inject(Injector);

	@ViewChild('anchor', { read: ViewContainerRef, static: true })
	anchor!: ViewContainerRef;

	private ref?: ComponentRef<unknown>;

	constructor() {
		inject(DestroyRef).onDestroy(() => {
			this.ref?.destroy();
		});
	}

	ngOnInit() {
		this.ref = this.anchor.createComponent(this.story);
		const componentInputs = this.storyMirror.inputs.map((input) => input.propName);

		effect(
			() => {
				const inputs = this.inputs();
				for (const key of componentInputs) {
					this.ref?.setInput(key, inputs[key]);
				}
				safeDetectChanges(this.ref?.changeDetectorRef);
			},
			{ injector: this.injector },
		);

		safeDetectChanges(this.ref.changeDetectorRef);
	}
}

@Component({
	selector: 'storybook-setup[story]',
	standalone: true,
	template: `
		<ng-container #anchor />
		<!-- <ngts-loader *ngIf="options.loader" /> -->
	`,
	imports: [NgIf],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StorybookSetup implements OnInit {
	@Input() options: CanvasOptions = defaultCanvasOptions;
	@Input() story!: Type<unknown>;

	readonly #inputs = signal<Record<string, unknown>>({});
	@Input() set inputs(inputs: Record<string, unknown>) {
		this.#inputs.set(inputs);
	}

	@ViewChild('anchor', { read: ViewContainerRef, static: true })
	anchor!: ViewContainerRef;

	readonly #envInjector = inject(EnvironmentInjector);

	#ref?: ComponentRef<unknown>;
	#refEnvInjector?: EnvironmentInjector;

	constructor() {
		inject(DestroyRef).onDestroy(() => {
			this.#ref?.destroy();
			this.#refEnvInjector?.destroy();
		});
	}

	ngOnInit() {
		this.#refEnvInjector = createEnvironmentInjector(
			[
				{ provide: CANVAS_OPTIONS, useValue: this.options },
				{ provide: STORY_COMPONENT, useValue: this.story },
				{ provide: STORY_COMPONENT_MIRROR, useValue: reflectComponentType(this.story) },
				{ provide: STORY_INPUTS, useValue: this.#inputs },
			],
			this.#envInjector,
		);
		this.#ref = this.anchor.createComponent(NgtCanvas, { environmentInjector: this.#refEnvInjector });
		this.#ref.setInput('shadows', true);
		this.#ref.setInput('performance', this.options.performance);
		this.#ref.setInput('camera', this.options.camera);
		this.#ref.setInput('compoundPrefixes', this.options.compoundPrefixes || []);
		this.#ref.setInput('sceneGraph', StorybookScene);
		safeDetectChanges(this.#ref.changeDetectorRef);
	}
}

type DeepPartial<T> = T extends Function
	? T
	: T extends Array<infer ArrayItemType>
	? DeepPartialArray<ArrayItemType>
	: T extends object
	? DeepPartialObject<T>
	: T | undefined;

type DeepPartialArray<T> = Array<DeepPartial<T>>;

type DeepPartialObject<T> = {
	[Key in keyof T]?: DeepPartial<T[Key]>;
};

export function makeCanvasOptions(options: DeepPartial<CanvasOptions> = {}) {
	const mergedOptions = {
		...defaultCanvasOptions,
		camera: { ...defaultCanvasOptions.camera, ...(options.camera || {}) },
		performance: { ...defaultCanvasOptions.performance, ...(options.performance || {}) },
		whiteBackground: options.whiteBackground ?? defaultCanvasOptions.whiteBackground,
		controls: options.controls ?? defaultCanvasOptions.controls,
		lights: options.lights ?? defaultCanvasOptions.lights,
		compoundPrefixes: options.compoundPrefixes ?? defaultCanvasOptions.compoundPrefixes,
	} as Required<CanvasOptions>;
	return mergedOptions;
}

export function makeStoryFunction(story: Type<unknown>, canvasOptions: DeepPartial<CanvasOptions> = {}) {
	return (args: Args) => {
		return {
			props: { options: makeCanvasOptions(canvasOptions), inputs: args || {}, story },
			template: `<storybook-setup  [story]="story" [inputs]="inputs" [options]="options" />`,
		};
	};
}

export function makeStoryObject(
	story: Type<unknown>,
	{
		canvasOptions = {},
		argsOptions = {},
		args = {},
		argTypes = {},
	}: {
		canvasOptions?: DeepPartial<CanvasOptions>;
		args?: Record<string, any>;
		argTypes?: Record<string, any>;
		argsOptions?: Record<string, any | { defaultValue: any; control: { control: any } }>;
	} = {},
) {
	const render = makeStoryFunction(story, canvasOptions);

	for (const [argKey, argOption] of Object.entries(argsOptions)) {
		if (argOption['defaultValue']) {
			args[argKey] = argOption.defaultValue;
			argTypes[argKey] = argOption.control;
		} else {
			args[argKey] = argOption;
		}
	}

	return { render, args, argTypes };
}

export function number(defaultValue: number): number;
export function number(
	defaultValue: number,
	options: { min?: number; max?: number; step?: number; range?: true },
): {
	defaultValue: number;
	control: { control: { type: 'range' | 'number'; min?: number; max?: number; step?: number } };
};
export function number(
	defaultValue: number,
	options: { min?: number; max?: number; step?: number; range?: true } = {},
) {
	if (Object.keys(options).length === 0) return defaultValue;
	const { range, ...rest } = options;
	return { defaultValue, control: { control: { type: range ? 'range' : 'number', ...rest } } };
}

export function color(defaultValue: string, { presetColors = [] }: { presetColors?: string[] } = {}) {
	return { defaultValue, control: { control: { type: 'color', presetColors } } };
}

export function select(defaultValue: string | string[], { multi, options }: { options: string[]; multi?: true }) {
	return { defaultValue, control: { control: multi ? 'multi-select' : 'select', options } };
}

export function turn(object: THREE.Object3D) {
	object.rotation.y += 0.01;
}

export function makeDecorators(...decoratorFns: Decorator[]): Decorator[] {
	return [moduleMetadata({ imports: [StorybookSetup] }), ...decoratorFns];
}
