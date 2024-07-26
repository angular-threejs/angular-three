import {
	CUSTOM_ELEMENTS_SCHEMA,
	ChangeDetectionStrategy,
	Component,
	ComponentMirror,
	ComponentRef,
	DestroyRef,
	Directive,
	ElementRef,
	EnvironmentInjector,
	InjectionToken,
	Provider,
	Signal,
	Type,
	ViewContainerRef,
	afterNextRender,
	createEnvironmentInjector,
	inject,
	input,
	reflectComponentType,
	untracked,
	viewChild,
} from '@angular/core';
import { Args, Decorator, moduleMetadata } from '@storybook/angular';
import {
	NgtAnyRecord,
	NgtArgs,
	NgtCanvas,
	NgtPerformance,
	extend,
	injectBeforeRender,
	resolveRef,
} from 'angular-three';
import { injectAutoEffect } from 'ngxtension/auto-effect';
import { mergeInputs } from 'ngxtension/inject-inputs';
import * as THREE from 'three';
import { Object3D } from 'three';
import { NgtsOrbitControls } from '../controls/src/lib/orbit-controls';
import { NgtsLoader } from '../loaders/src/lib/loader';

extend(THREE);

type OrthographicCameraOptions = {
	orthographic: true;
	camera: { position?: [number, number, number]; zoom?: number };
};

type PerspectiveCameraOptions = {
	orthographic: false;
	camera: { position?: [number, number, number]; fov?: number };
};

export type SetupCanvasOptions = {
	performance: Partial<Omit<NgtPerformance, 'regress'>>;
	background: string;
	controls: boolean | { makeDefault?: boolean };
	lights: boolean;
} & (OrthographicCameraOptions | PerspectiveCameraOptions);

const defaultCanvasOptions: SetupCanvasOptions = {
	camera: { position: [-5, 5, 5], fov: 75 },
	orthographic: false,
	performance: { current: 1, min: 0.5, max: 1, debounce: 200 },
	background: 'black',
	controls: true,
	lights: true,
};

const CANVAS_OPTIONS = new InjectionToken<SetupCanvasOptions>('canvas options');
const STORY_COMPONENT = new InjectionToken<Type<unknown>>('story component');
const STORY_COMPONENT_MIRROR = new InjectionToken<ComponentMirror<Type<unknown>>>('story component mirror');
const STORY_OPTIONS = new InjectionToken<Signal<Record<string, unknown>>>('story inputs');

@Component({
	standalone: true,
	template: `
		<ngt-color *args="[canvasOptions.background]" attach="background" />

		<ng-container #anchor />

		@if (canvasOptions.lights) {
			<ngt-ambient-light [intensity]="0.8" />
			<ngt-point-light [intensity]="Math.PI" [position]="[0, 6, 0]" [decay]="0" />
		}

		@if (canvasOptions.controls) {
			<ngts-orbit-controls [options]="{ makeDefault: canvasOptions.controls['makeDefault'] ?? true }" />
		}
	`,
	imports: [NgtsOrbitControls, NgtArgs],
	changeDetection: ChangeDetectionStrategy.OnPush,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	host: { class: 'storybook-scene' },
})
export class StorybookScene {
	Math = Math;

	autoEffect = injectAutoEffect();
	canvasOptions = inject(CANVAS_OPTIONS);
	story = inject(STORY_COMPONENT);
	storyMirror = inject(STORY_COMPONENT_MIRROR);
	storyOptions = inject(STORY_OPTIONS);

	anchor = viewChild.required('anchor', { read: ViewContainerRef });

	constructor() {
		let ref: ComponentRef<unknown>;

		afterNextRender(() => {
			untracked(() => {
				ref = this.anchor().createComponent(this.story);

				const componentInputs = this.storyMirror.inputs.map((input) => input.propName);
				this.autoEffect(() => {
					const storyOptions = this.storyOptions();
					for (const key of componentInputs) {
						ref.setInput(key, storyOptions[key]);
					}
				});

				ref.changeDetectorRef.detectChanges();
			});
		});

		inject(DestroyRef).onDestroy(() => {
			ref?.destroy();
		});
	}
}

@Component({
	selector: 'storybook-setup',
	standalone: true,
	template: `
		<ng-container #anchor />
		@if (withLoader()) {
			<ngts-loader />
		}
	`,
	imports: [NgtsLoader],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StorybookSetup {
	story = input.required<Type<unknown>>();
	storyOptions = input<NgtAnyRecord>({});
	canvasOptions = input(defaultCanvasOptions, { transform: mergeInputs(defaultCanvasOptions) });
	withLoader = input(false);

	anchor = viewChild.required('anchor', { read: ViewContainerRef });

	constructor() {
		const envInjector = inject(EnvironmentInjector);
		let ref: ComponentRef<unknown>;
		let refEnvInjector: EnvironmentInjector;

		afterNextRender(() => {
			untracked(() => {
				refEnvInjector = createEnvironmentInjector(
					[
						{ provide: CANVAS_OPTIONS, useValue: this.canvasOptions() },
						{ provide: STORY_COMPONENT, useValue: this.story() },
						{ provide: STORY_COMPONENT_MIRROR, useValue: reflectComponentType(this.story()) },
						{ provide: STORY_OPTIONS, useValue: this.storyOptions },
					],
					envInjector,
				);

				ref = this.anchor().createComponent(NgtCanvas, { environmentInjector: refEnvInjector });
				ref.setInput('shadows', true);
				ref.setInput('performance', this.canvasOptions().performance);
				ref.setInput('camera', this.canvasOptions().camera);
				ref.setInput('sceneGraph', StorybookScene);
				ref.setInput('orthographic', this.canvasOptions().orthographic);
				ref.changeDetectorRef.detectChanges();
			});
		});

		inject(DestroyRef).onDestroy(() => {
			console.log('storybook-setup destroy');
			ref?.destroy();
			refEnvInjector?.destroy();
		});
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

export function makeCanvasOptions(options: DeepPartial<SetupCanvasOptions> = {}) {
	const orthographic = options.orthographic ?? defaultCanvasOptions.orthographic;
	let camera: Partial<SetupCanvasOptions['camera']> = {};

	if (orthographic) {
		camera = (options.camera || {}) as SetupCanvasOptions['camera'];
	} else {
		camera = { ...defaultCanvasOptions.camera, ...(options.camera || {}) } as SetupCanvasOptions['camera'];
	}

	return {
		...defaultCanvasOptions,
		orthographic,
		camera,
		performance: { ...defaultCanvasOptions.performance, ...(options.performance || {}) },
		background: options.background ?? defaultCanvasOptions.background,
		controls: options.controls ?? defaultCanvasOptions.controls,
		lights: options.lights ?? defaultCanvasOptions.lights,
	} as Required<SetupCanvasOptions>;
}

export function makeStoryFunction(
	story: Type<unknown>,
	canvasOptions: DeepPartial<SetupCanvasOptions> & { withLoader?: boolean } = {},
	templateFn: (base: string) => string = (base) => base,
) {
	return (args: Args) => ({
		props: {
			canvasOptions: makeCanvasOptions(canvasOptions),
			withLoader: canvasOptions.withLoader ?? false,
			storyOptions: args || {},
			story,
		},
		template: templateFn(
			`<storybook-setup [story]="story" [storyOptions]="storyOptions" [canvasOptions]="canvasOptions" [withLoader]="withLoader" />`,
		),
	});
}

export function makeStoryObject(
	story: Type<unknown>,
	{
		canvasOptions = {},
		templateFn = (base) => base,
		argsOptions = {},
		args = {},
		argTypes = {},
		parameters = {},
		name,
	}: {
		canvasOptions?: DeepPartial<SetupCanvasOptions> & { withLoader?: boolean };
		templateFn?: (base: string) => string;
		args?: Record<string, any>;
		argTypes?: Record<string, any>;
		argsOptions?: Record<string, any | { defaultValue: any; control: { control: any } }>;
		parameters?: Record<string, any>;
		name?: string;
	} = {},
) {
	for (const [argKey, argOption] of Object.entries(argsOptions)) {
		if (argKey === 'options') {
			args['options'] = {};
			for (const [key, option] of Object.entries(argOption)) {
				if ((option as any)['defaultValue']) {
					args['options'][key] = (option as any)['defaultValue'];
					argTypes[`options.${key}`] = (option as any)['control'];
				} else {
					args['options'][key] = option;
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

	return { name, render: makeStoryFunction(story, canvasOptions, templateFn), args, argTypes, parameters };
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

export function makeDecorators(providers: Provider[] = [], ...decoratorFns: Decorator[]): Decorator[] {
	return [moduleMetadata({ imports: [StorybookSetup], providers }), ...decoratorFns];
}

@Directive({ selector: '[turnable]', standalone: true })
export class Turnable {
	constructor() {
		const element = inject<ElementRef<Object3D>>(ElementRef);
		injectTurnable(() => element);
	}
}

export function injectTurnable(object: () => Object3D | ElementRef<Object3D> | undefined | null) {
	return injectBeforeRender(() => {
		const obj = resolveRef(object());
		if (!obj) return;
		obj.rotation.y += 0.01;
	});
}
