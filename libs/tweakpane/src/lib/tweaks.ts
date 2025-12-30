import {
	type ComponentRef,
	DestroyRef,
	effect,
	inject,
	Injector,
	inputBinding,
	isSignal,
	signal,
	type Signal,
	twoWayBinding,
	untracked,
	type ViewContainerRef,
	type WritableSignal,
} from '@angular/core';
import { assertInjector } from 'ngxtension/assert-injector';
import { NumberInputParams, Point2dInputParams, Point3dInputParams, Point4dInputParams } from 'tweakpane';
import { TweakpaneAnchor, TweakpaneAnchorHost } from './anchor';
import { TweakpaneButton } from './button';
import { TweakpaneCheckbox } from './checkbox';
import { TweakpaneColor } from './color';
import { TweakpaneFolder } from './folder';
import { TweakpaneList } from './list';
import { TweakpaneNumber } from './number';
import { TweakpanePoint } from './point';
import { TweakpaneText } from './text';

// ============================================================================
// Config Types
// ============================================================================

/** Config for a number input with optional min/max/step */
export interface TweakNumberConfig {
	value: number | WritableSignal<number>;
	min?: number;
	max?: number;
	step?: number;
}

/** Config for a text input */
export interface TweakTextConfig {
	value: string | WritableSignal<string>;
}

/** Config for a color input */
export interface TweakColorConfig {
	value: string | WritableSignal<string>;
	/** Mark this as a color input */
	color: true;
}

/** Config for a checkbox/boolean input */
export interface TweakCheckboxConfig {
	value: boolean | WritableSignal<boolean>;
}

/** Config for a list/dropdown input */
export interface TweakListConfig<T> {
	value: T | WritableSignal<T>;
	options: T[] | Record<string, T>;
}

/** Config for a point (2D/3D/4D) input */
export interface TweakPointConfig<
	TVector extends [number, number] | [number, number, number] | [number, number, number, number] =
		| [number, number]
		| [number, number, number]
		| [number, number, number, number],
> {
	value: TVector | WritableSignal<TVector>;
	x?: Point2dInputParams['x'];
	y?: Point2dInputParams['y'];
	z?: Point3dInputParams['z'];
	w?: Point4dInputParams['w'];
}

/** Config for a button (action) */
export interface TweakButtonConfig {
	action: () => void;
	label?: string;
}

/** Config for a nested folder */
export interface TweakFolderConfig<T extends TweakConfig> {
	__folder: true;
	name: string;
	config: T;
	expanded?: boolean;
}

/** Union of all possible config values */
export type TweakConfigValue =
	| number
	| string
	| boolean
	| WritableSignal<number>
	| WritableSignal<string>
	| WritableSignal<boolean>
	| TweakNumberConfig
	| TweakTextConfig
	| TweakColorConfig
	| TweakCheckboxConfig
	| TweakListConfig<unknown>
	| TweakPointConfig
	| TweakButtonConfig
	| TweakFolderConfig<TweakConfig>;

/** A config object mapping keys to config values */
export type TweakConfig = Record<string, TweakConfigValue>;

// ============================================================================
// Result Types (what tweaks() returns)
// ============================================================================

/**
 * Infer the signal type from a config value.
 * Always returns Signal<T> (readonly) - never WritableSignal.
 * Users can use their original WritableSignal if they need write access.
 */
type InferSignalType<T> =
	// Direct WritableSignal - return readonly Signal
	T extends WritableSignal<infer U>
		? Signal<U>
		: // Primitive number
			T extends number
			? Signal<number>
			: // Primitive string
				T extends string
				? Signal<string>
				: // Primitive boolean
					T extends boolean
					? Signal<boolean>
					: // Number config
						T extends TweakNumberConfig
						? Signal<number>
						: // Text config
							T extends TweakTextConfig
							? Signal<string>
							: // Color config
								T extends TweakColorConfig
								? Signal<string>
								: // Checkbox config
									T extends TweakCheckboxConfig
									? Signal<boolean>
									: // List config
										T extends TweakListConfig<infer U>
										? Signal<U>
										: // Point config
											T extends TweakPointConfig<infer VectorType>
											? Signal<VectorType>
											: // Button - no return value
												T extends TweakButtonConfig
												? never
												: // Folder - recurse
													T extends TweakFolderConfig<infer C>
													? TweakResult<C>
													: never;

/** The result type for a config object */
export type TweakResult<T extends TweakConfig> = {
	[K in keyof T as T[K] extends TweakButtonConfig ? never : K]: InferSignalType<T[K]>;
};

// ============================================================================
// Type Guards
// ============================================================================

function isNumberConfig(config: TweakConfigValue): config is TweakNumberConfig {
	if (typeof config !== 'object' || config === null || !('value' in config)) return false;
	if ('color' in config || 'options' in config || 'action' in config || '__folder' in config) return false;
	if ('x' in config || 'y' in config) return false;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const value = isSignal(config.value) ? untracked(config.value as Signal<any>) : config.value;
	return typeof value === 'number';
}

function isTextConfig(config: TweakConfigValue): config is TweakTextConfig {
	if (typeof config !== 'object' || config === null || !('value' in config)) return false;
	if ('color' in config || 'options' in config || 'action' in config || '__folder' in config) return false;
	if ('min' in config || 'max' in config || 'step' in config) return false;
	if ('x' in config || 'y' in config) return false;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const value = isSignal(config.value) ? untracked(config.value as Signal<any>) : config.value;
	return typeof value === 'string';
}

function isColorConfig(config: TweakConfigValue): config is TweakColorConfig {
	return typeof config === 'object' && config !== null && 'color' in config && config.color === true;
}

function isCheckboxConfig(config: TweakConfigValue): config is TweakCheckboxConfig {
	if (typeof config !== 'object' || config === null || !('value' in config)) return false;
	if ('color' in config || 'options' in config || 'action' in config || '__folder' in config) return false;
	if ('min' in config || 'max' in config || 'step' in config) return false;
	if ('x' in config || 'y' in config) return false;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const value = isSignal(config.value) ? untracked(config.value as Signal<any>) : config.value;
	return typeof value === 'boolean';
}

function isListConfig(config: TweakConfigValue): config is TweakListConfig<unknown> {
	return typeof config === 'object' && config !== null && 'options' in config;
}

function isPointConfig(config: TweakConfigValue): config is TweakPointConfig {
	return (
		typeof config === 'object' &&
		config !== null &&
		'value' in config &&
		(('x' in config && 'y' in config) ||
			(Array.isArray(config.value) && config.value.length >= 2) ||
			(isSignal(config.value) && Array.isArray(untracked(config.value))))
	);
}

function isButtonConfig(config: TweakConfigValue): config is TweakButtonConfig {
	return typeof config === 'object' && config !== null && 'action' in config && typeof config.action === 'function';
}

function isFolderConfig(config: TweakConfigValue): config is TweakFolderConfig<TweakConfig> {
	return typeof config === 'object' && config !== null && '__folder' in config && config.__folder === true;
}

// ============================================================================
// Helper to create folder configs
// ============================================================================

/**
 * Creates a nested folder configuration for use with `tweaks()`.
 *
 * @example
 * ```typescript
 * const controls = tweaks('Settings', {
 *   basic: 42,
 *   advanced: tweaks.folder('Advanced', {
 *     iterations: { value: 4, min: 1, max: 10 },
 *     tolerance: { value: 0.001, min: 0, max: 1, step: 0.001 },
 *   }),
 * });
 *
 * // Access nested values
 * controls.advanced.iterations(); // Signal<number>
 * ```
 */
function folder<T extends TweakConfig>(
	name: string,
	config: T,
	options?: { expanded?: boolean },
): TweakFolderConfig<T> {
	return {
		__folder: true,
		name,
		config,
		expanded: options?.expanded,
	};
}

// ============================================================================
// Folder Options
// ============================================================================

export interface TweakFolderOptions {
	/** Whether the folder is expanded by default */
	expanded?: boolean;
	/** Optional injector for use outside injection context */
	injector?: Injector;
}

// ============================================================================
// Main tweaks() function
// ============================================================================

/**
 * Creates Tweakpane controls declaratively from any component within an `ngt-canvas`.
 *
 * **Prerequisites:**
 * 1. Add `tweakpaneAnchor` directive to your `ngt-canvas`:
 *    ```html
 *    <ngt-canvas tweakpaneAnchor>
 *    ```
 * 2. Add `<tweakpane-pane>` somewhere in your scene
 *
 * @param folderName - The name of the folder to create/use
 * @param config - Configuration object defining the controls
 * @param options - Optional folder options (expanded, etc.)
 * @returns An object with signals for each control value
 *
 * @example
 * ```typescript
 * // Basic usage with primitives (creates new signals)
 * const controls = tweaks('Physics', {
 *   gravity: 9.8,
 *   debug: false,
 *   name: 'World',
 * });
 *
 * // With config objects for more control
 * const controls = tweaks('Physics', {
 *   gravity: { value: 9.8, min: 0, max: 20, step: 0.1 },
 *   color: { value: '#ff0000', color: true },
 *   mode: { value: 'normal', options: ['normal', 'debug', 'verbose'] },
 * });
 *
 * // Two-way binding with existing signals
 * filteringEnabled = signal(true);
 * const controls = tweaks('Settings', {
 *   filteringEnabled: this.filteringEnabled, // two-way binding
 * });
 *
 * // Buttons (actions)
 * const controls = tweaks('Actions', {
 *   reset: { action: () => this.reset() },
 * });
 *
 * // Nested folders
 * const controls = tweaks('Settings', {
 *   basic: 42,
 *   advanced: tweaks.folder('Advanced', {
 *     iterations: { value: 4, min: 1, max: 10 },
 *   }),
 * });
 * ```
 */
export function tweaks<T extends TweakConfig>(
	folderName: string,
	config: T,
	{ injector, ...options }: TweakFolderOptions = {},
): TweakResult<T> {
	return assertInjector(tweaks, injector, () => {
		const maybeAnchor = inject(TweakpaneAnchor, { optional: true });
		const assertedInjector = inject(Injector);
		const destroyRef = inject(DestroyRef);

		if (!maybeAnchor) {
			throw new Error(
				'[NGT Tweakpane] tweaks() requires TweakpaneAnchor directive. Add `tweakpaneAnchor` to your ngt-canvas element.',
			);
		}

		const anchor = maybeAnchor;

		const result = {} as Record<string, Signal<unknown> | Record<string, Signal<unknown>>>;
		const createdComponents: ComponentRef<TweakpaneAnchorHost>[] = [];

		// Process config and create controls when pane folder is ready
		effect(
			(onCleanup) => {
				const paneFolder = anchor.paneFolder();
				if (!paneFolder) return;

				// Get or create folder for this tweaks() call
				let folderRef = anchor.folders[folderName];
				let folderInstance: TweakpaneFolder;

				if (!folderRef) {
					// Create folder using the directives approach
					folderRef = anchor.vcr.createComponent(TweakpaneAnchorHost, {
						injector: Injector.create({
							providers: [{ provide: TweakpaneFolder, useValue: paneFolder }],
							parent: assertedInjector,
						}),
						directives: [
							{
								type: TweakpaneFolder,
								bindings: [
									inputBinding('title', () => folderName),
									inputBinding('expanded', () => options?.expanded ?? false),
								],
							},
						],
					});
					folderInstance = folderRef.injector.get(TweakpaneFolder);
					anchor.folders[folderName] = folderRef;
					createdComponents.push(folderRef);
				} else {
					folderInstance = folderRef.injector.get(TweakpaneFolder);
				}

				// Process each config entry
				processConfig(config, result, folderInstance, anchor.vcr, createdComponents, anchor, assertedInjector);

				onCleanup(() => {
					// Destroy created components
					for (const ref of createdComponents) {
						ref.destroy();
					}
					createdComponents.length = 0;
				});
			},
			{ injector: assertedInjector },
		);

		// Cleanup on destroy
		destroyRef.onDestroy(() => {
			for (const ref of createdComponents) {
				ref.destroy();
			}
		});

		return result as TweakResult<T>;
	});
}

// Attach folder helper to tweaks
tweaks.folder = folder;

// ============================================================================
// Internal: Process config and create components
// ============================================================================

function processConfig(
	config: TweakConfig,
	result: Record<string, Signal<unknown> | Record<string, Signal<unknown>>>,
	parentFolder: TweakpaneFolder,
	vcr: ViewContainerRef,
	createdComponents: ComponentRef<TweakpaneAnchorHost>[],
	anchor: TweakpaneAnchor,
	parentInjector: Injector,
): void {
	const keys = Object.keys(config);

	// Create injector with parent folder provided
	const folderInjector = Injector.create({
		providers: [{ provide: TweakpaneFolder, useValue: parentFolder }],
		parent: parentInjector,
	});

	for (const key of keys) {
		const configValue = config[key];

		// Handle nested folders
		if (isFolderConfig(configValue)) {
			const nestedResult = {} as Record<string, Signal<unknown>>;

			// Get or create nested folder
			const nestedFolderName = configValue.name;
			let nestedFolderRef = anchor.folders[nestedFolderName];
			let nestedFolderInstance: TweakpaneFolder;

			if (!nestedFolderRef) {
				nestedFolderRef = vcr.createComponent(TweakpaneAnchorHost, {
					injector: folderInjector,
					directives: [
						{
							type: TweakpaneFolder,
							bindings: [
								inputBinding('title', () => nestedFolderName),
								inputBinding('expanded', () => configValue.expanded ?? false),
							],
						},
					],
				});
				nestedFolderInstance = nestedFolderRef.injector.get(TweakpaneFolder);
				anchor.folders[nestedFolderName] = nestedFolderRef;
				createdComponents.push(nestedFolderRef);
			} else {
				nestedFolderInstance = nestedFolderRef.injector.get(TweakpaneFolder);
			}

			processConfig(
				configValue.config,
				nestedResult,
				nestedFolderInstance,
				vcr,
				createdComponents,
				anchor,
				folderInjector,
			);
			result[key] = nestedResult;
			continue;
		}

		// Handle buttons (no result signal)
		if (isButtonConfig(configValue)) {
			const buttonRef = vcr.createComponent(TweakpaneAnchorHost, {
				injector: folderInjector,
				directives: [
					{
						type: TweakpaneButton,
						bindings: [
							inputBinding('title', () => key),
							...(configValue.label ? [inputBinding('label', () => configValue.label)] : []),
						],
					},
				],
			});
			// Subscribe to click events
			const buttonInstance = buttonRef.injector.get(TweakpaneButton);
			buttonInstance.click.subscribe(() => {
				configValue.action();
			});
			createdComponents.push(buttonRef);
			continue;
		}

		// Handle direct WritableSignal (two-way binding)
		if (isSignal(configValue)) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const untrackedValue = untracked(configValue as WritableSignal<any>);
			const valueType = typeof untrackedValue;

			if (valueType === 'number') {
				const ref = vcr.createComponent(TweakpaneAnchorHost, {
					injector: folderInjector,
					directives: [
						{
							type: TweakpaneNumber,
							bindings: [
								inputBinding('label', () => key),
								twoWayBinding('value', configValue as WritableSignal<number>),
							],
						},
					],
				});
				createdComponents.push(ref);
				result[key] = (configValue as WritableSignal<number>).asReadonly();
			} else if (valueType === 'string') {
				const ref = vcr.createComponent(TweakpaneAnchorHost, {
					injector: folderInjector,
					directives: [
						{
							type: TweakpaneText,
							bindings: [
								inputBinding('label', () => key),
								twoWayBinding('value', configValue as WritableSignal<string>),
							],
						},
					],
				});
				createdComponents.push(ref);
				result[key] = (configValue as WritableSignal<string>).asReadonly();
			} else if (valueType === 'boolean') {
				const ref = vcr.createComponent(TweakpaneAnchorHost, {
					injector: folderInjector,
					directives: [
						{
							type: TweakpaneCheckbox,
							bindings: [
								inputBinding('label', () => key),
								twoWayBinding('value', configValue as WritableSignal<boolean>),
							],
						},
					],
				});
				createdComponents.push(ref);
				result[key] = (configValue as WritableSignal<boolean>).asReadonly();
			}
			continue;
		}

		// Handle primitive values (create new signal)
		if (typeof configValue === 'number') {
			const valueSignal = signal(configValue);
			const ref = vcr.createComponent(TweakpaneAnchorHost, {
				injector: folderInjector,
				directives: [
					{
						type: TweakpaneNumber,
						bindings: [inputBinding('label', () => key), twoWayBinding('value', valueSignal)],
					},
				],
			});
			createdComponents.push(ref);
			result[key] = valueSignal.asReadonly();
			continue;
		}

		if (typeof configValue === 'string') {
			const valueSignal = signal(configValue);
			const ref = vcr.createComponent(TweakpaneAnchorHost, {
				injector: folderInjector,
				directives: [
					{
						type: TweakpaneText,
						bindings: [inputBinding('label', () => key), twoWayBinding('value', valueSignal)],
					},
				],
			});
			createdComponents.push(ref);
			result[key] = valueSignal.asReadonly();
			continue;
		}

		if (typeof configValue === 'boolean') {
			const valueSignal = signal(configValue);
			const ref = vcr.createComponent(TweakpaneAnchorHost, {
				injector: folderInjector,
				directives: [
					{
						type: TweakpaneCheckbox,
						bindings: [inputBinding('label', () => key), twoWayBinding('value', valueSignal)],
					},
				],
			});
			createdComponents.push(ref);
			result[key] = valueSignal.asReadonly();
			continue;
		}

		// Handle config objects
		if (isColorConfig(configValue)) {
			const initialValue = isSignal(configValue.value)
				? untracked(configValue.value)
				: (configValue.value as string);
			const valueSignal = isSignal(configValue.value) ? configValue.value : signal(initialValue);
			const ref = vcr.createComponent(TweakpaneAnchorHost, {
				injector: folderInjector,
				directives: [
					{
						type: TweakpaneColor,
						bindings: [inputBinding('label', () => key), twoWayBinding('value', valueSignal)],
					},
				],
			});
			createdComponents.push(ref);
			result[key] = valueSignal.asReadonly();
			continue;
		}

		if (isListConfig(configValue)) {
			const initialValue = isSignal(configValue.value) ? untracked(configValue.value) : configValue.value;
			const valueSignal = isSignal(configValue.value)
				? (configValue.value as WritableSignal<unknown>)
				: signal(initialValue);
			const ref = vcr.createComponent(TweakpaneAnchorHost, {
				injector: folderInjector,
				directives: [
					{
						type: TweakpaneList,
						bindings: [
							inputBinding('label', () => key),
							inputBinding('options', () => configValue.options),
							twoWayBinding('value', valueSignal),
						],
					},
				],
			});
			createdComponents.push(ref);
			result[key] = valueSignal.asReadonly();
			continue;
		}

		if (isPointConfig(configValue)) {
			const initialValue = isSignal(configValue.value) ? untracked(configValue.value) : configValue.value;
			const valueSignal = isSignal(configValue.value) ? configValue.value : signal(initialValue);
			// Build params from x, y, z, w configs
			const params: Point2dInputParams | Point3dInputParams | Point4dInputParams = {};
			if (configValue.x) (params as Point2dInputParams).x = configValue.x;
			if (configValue.y) (params as Point2dInputParams).y = configValue.y;
			if (configValue.z) (params as Point3dInputParams).z = configValue.z;
			if (configValue.w) (params as Point4dInputParams).w = configValue.w;

			const ref = vcr.createComponent(TweakpaneAnchorHost, {
				injector: folderInjector,
				directives: [
					{
						type: TweakpanePoint,
						bindings: [
							inputBinding('label', () => key),
							inputBinding('params', () => params),
							twoWayBinding(
								'value',
								valueSignal as WritableSignal<
									[number, number] | [number, number, number] | [number, number, number, number]
								>,
							),
						],
					},
				],
			});
			createdComponents.push(ref);
			result[key] = valueSignal.asReadonly();
			continue;
		}

		if (isNumberConfig(configValue)) {
			const initialValue = isSignal(configValue.value)
				? untracked(configValue.value)
				: (configValue.value as number);
			const valueSignal = isSignal(configValue.value) ? configValue.value : signal(initialValue);
			// Build params
			const params: NumberInputParams = {};
			if (configValue.min !== undefined) params.min = configValue.min;
			if (configValue.max !== undefined) params.max = configValue.max;
			if (configValue.step !== undefined) params.step = configValue.step;

			const ref = vcr.createComponent(TweakpaneAnchorHost, {
				injector: folderInjector,
				directives: [
					{
						type: TweakpaneNumber,
						bindings: [
							inputBinding('label', () => key),
							inputBinding('params', () => params),
							twoWayBinding('value', valueSignal),
						],
					},
				],
			});
			createdComponents.push(ref);
			result[key] = valueSignal.asReadonly();
			continue;
		}

		if (isCheckboxConfig(configValue)) {
			const initialValue = isSignal(configValue.value)
				? untracked(configValue.value)
				: (configValue.value as boolean);
			const valueSignal = isSignal(configValue.value) ? configValue.value : signal(initialValue);
			const ref = vcr.createComponent(TweakpaneAnchorHost, {
				injector: folderInjector,
				directives: [
					{
						type: TweakpaneCheckbox,
						bindings: [inputBinding('label', () => key), twoWayBinding('value', valueSignal)],
					},
				],
			});
			createdComponents.push(ref);
			result[key] = valueSignal.asReadonly();
			continue;
		}

		if (isTextConfig(configValue)) {
			const initialValue = isSignal(configValue.value)
				? untracked(configValue.value)
				: (configValue.value as string);
			const valueSignal = isSignal(configValue.value) ? configValue.value : signal(initialValue);
			const ref = vcr.createComponent(TweakpaneAnchorHost, {
				injector: folderInjector,
				directives: [
					{
						type: TweakpaneText,
						bindings: [inputBinding('label', () => key), twoWayBinding('value', valueSignal)],
					},
				],
			});
			createdComponents.push(ref);
			result[key] = valueSignal.asReadonly();
			continue;
		}
	}
}
