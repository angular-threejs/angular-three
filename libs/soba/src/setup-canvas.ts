import {
	afterNextRender,
	ChangeDetectionStrategy,
	Component,
	ComponentRef,
	computed,
	CUSTOM_ELEMENTS_SCHEMA,
	DestroyRef,
	Directive,
	effect,
	ElementRef,
	inject,
	Injector,
	input,
	isSignal,
	Provider,
	reflectComponentType,
	Type,
	untracked,
	viewChild,
	ViewContainerRef,
} from '@angular/core';
import { applicationConfig, Args, Decorator, moduleMetadata } from '@storybook/angular';
import { extend, injectBeforeRender, NgtAnyRecord, NgtArgs, NgtCanvasOptions, resolveRef } from 'angular-three';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import { NgtsLoader } from 'angular-three-soba/loaders';
import { NgtCanvas, NgtCanvasContent, provideNgtRenderer } from 'angular-three/dom';
import { mergeInputs } from 'ngxtension/inject-inputs';
import * as THREE from 'three';

@Component({
	selector: 'storybook-scene-graph',
	template: `
		<ngt-color *args="[setup.background()]" attach="background" />

		<ng-container #anchor />

		@if (setup.lights()) {
			<ngt-ambient-light [intensity]="0.8" />
			<ngt-point-light [intensity]="Math.PI" [position]="[0, 6, 0]" [decay]="0" />
		}

		@let makeDefault = setup.controls();
		@if (makeDefault !== null) {
			<ngts-orbit-controls [options]="{ makeDefault }" />
		}
	`,
	imports: [NgtArgs, NgtsOrbitControls],
	changeDetection: ChangeDetectionStrategy.OnPush,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class StorybookSceneGraph {
	protected readonly Math = Math;

	private injector = inject(Injector);
	protected setup = inject(StorybookSetup);
	private anchor = viewChild.required('anchor', { read: ViewContainerRef });

	private ref?: ComponentRef<unknown>;
	private inputsMirror?: string[];

	constructor() {
		afterNextRender(() => {
			const anchor = this.anchor();

			this.ref = anchor.createComponent(this.setup.story());
			this.ref.changeDetectorRef.detectChanges();

			effect(
				() => {
					this.setStoryOptions(this.setup.storyOptions());
				},
				{ injector: this.injector },
			);
		});

		inject(DestroyRef).onDestroy(() => {
			this.ref?.destroy();
		});
	}

	private setStoryOptions(options: NgtAnyRecord) {
		if (!this.ref) return;
		if (!this.inputsMirror) {
			this.inputsMirror = untracked(this.setup.storyMirror)?.inputs.map((input) => input.propName);
		}

		if (!this.inputsMirror) return;

		const component = this.ref.instance as NgtAnyRecord;

		for (const key of this.inputsMirror) {
			const maybeSignalInput = component[key];
			const isSignalInput = maybeSignalInput && isSignal(maybeSignalInput);

			const value =
				isSignalInput && options[key] === undefined && untracked(maybeSignalInput) !== undefined
					? untracked(maybeSignalInput)
					: options[key];

			this.ref.setInput(key, value);
		}
	}
}

const defaultPerformanceOptions: NgtCanvasOptions['performance'] = { current: 1, min: 0.5, max: 1, debounce: 200 };
const defaultCameraOptions: NgtCanvasOptions['camera'] = { position: [-5, 5, 5], fov: 75 };

@Component({
	selector: 'storybook-setup',
	template: `
		<ngt-canvas shadows [performance]="performance()" [camera]="camera()" [orthographic]="orthographic()">
			<storybook-scene-graph *canvasContent />
		</ngt-canvas>

		@if (loader()) {
			<ngts-loader />
		}
	`,
	imports: [NgtCanvas, NgtCanvasContent, StorybookSceneGraph, NgtsLoader],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StorybookSetup {
	loader = input(false);

	/* canvas options */
	performance = input(defaultPerformanceOptions, { transform: mergeInputs(defaultPerformanceOptions) });
	camera = input(defaultCameraOptions, { transform: mergeInputs(defaultCameraOptions) });
	orthographic = input(false);

	/* scene graph options */
	background = input<THREE.ColorRepresentation>('black');
	lights = input(true);
	controls = input<boolean | null>(true);
	story = input.required<Type<unknown>>();
	storyOptions = input<NgtAnyRecord>({});

	storyMirror = computed(() => reflectComponentType(this.story()));

	constructor() {
		extend(THREE);
	}
}

type StoryOptions = {
	templateFn: (base: string) => string;
	loader: boolean;
	performance: NgtCanvasOptions['performance'];
	camera: NgtCanvasOptions['camera'];
	background: THREE.ColorRepresentation;
	orthographic: boolean;
	controls: boolean;
	lights: boolean;
};

const defaultStoryOptions: StoryOptions = {
	templateFn: (base) => base,
	loader: false,
	performance: defaultPerformanceOptions,
	camera: defaultCameraOptions,
	orthographic: false,
	background: 'black',
	controls: true,
	lights: true,
};

export function storyFunction(
	story: Type<unknown>,
	{
		templateFn = defaultStoryOptions.templateFn,
		loader = defaultStoryOptions.loader,
		performance = defaultStoryOptions.performance,
		camera = defaultStoryOptions.camera,
		orthographic = defaultStoryOptions.orthographic,
		background = defaultStoryOptions.background,
		controls = defaultStoryOptions.controls,
		lights = defaultStoryOptions.lights,
	}: Partial<StoryOptions> = {},
) {
	return (args: Args) => ({
		props: {
			storyOptions: args || {},
			story,
			loader,
			performance,
			camera,
			orthographic,
			background,
			controls,
			lights,
		},
		template: templateFn(`
      <storybook-setup
        [story]="story"
        [storyOptions]="storyOptions"
        [loader]="loader"
        [performance]="performance"
        [camera]="camera"
        [orthographic]="orthographic"
        [background]="background"
        [controls]="controls"
        [lights]="lights"
      />
    `),
	});
}

export function storyObject(
	story: Type<unknown>,
	{
		templateFn = defaultStoryOptions.templateFn,
		loader = defaultStoryOptions.loader,
		performance = defaultStoryOptions.performance,
		camera = defaultStoryOptions.camera,
		orthographic = defaultStoryOptions.orthographic,
		background = defaultStoryOptions.background,
		controls = defaultStoryOptions.controls,
		lights = defaultStoryOptions.lights,
		args = {},
		argsOptions = {},
		argTypes = {},
		parameters = {},
		name,
	}: Partial<StoryOptions> & {
		args?: NgtAnyRecord;
		argTypes?: NgtAnyRecord;
		argsOptions?: Record<string, any | { defaultValue: any; control: { control: any } }>;
		parameters?: NgtAnyRecord;
		name?: string;
	} = {},
) {
	for (const argKey in argsOptions) {
		const argOption = argsOptions[argKey];
		if (argKey === 'options') {
			args['options'] = {};
			for (const optKey in argOption) {
				const opt = argOption[optKey];
				if (opt['defaultValue']) {
					args['options'][optKey] = opt['defaultValue'];
					argTypes[`options.${optKey}`] = opt['control'];
				} else {
					args['options'][optKey] = opt;
				}
			}
			continue;
		}

		if (argOption['defaultValue']) {
			args[argKey] = argOption.defaultValue;
			argTypes[argKey] = argOption.control;
		} else {
			args[argKey] = argOption;
		}
	}

	return {
		name,
		args,
		argTypes,
		parameters,
		render: storyFunction(story, {
			templateFn,
			loader,
			performance,
			camera,
			orthographic,
			background,
			controls,
			lights,
		}),
	};
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

export function storyDecorators(providers: Provider[] = [], ...decorators: Decorator[]): Decorator[] {
	return [
		moduleMetadata({ imports: [StorybookSetup], providers }),
		applicationConfig({ providers: [provideNgtRenderer()] }),
		...decorators,
	];
}

@Directive({ selector: '[turnable]' })
export class Turnable {
	constructor() {
		const element = inject<ElementRef<THREE.Object3D>>(ElementRef);
		injectTurnable(() => element);
	}
}

export function injectTurnable(object: () => THREE.Object3D | ElementRef<THREE.Object3D> | undefined | null) {
	return injectBeforeRender(() => {
		const obj = resolveRef(object());
		if (!obj) return;
		obj.rotation.y += 0.01;
	});
}
