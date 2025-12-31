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

/**
 * Configuration for a number input control.
 *
 * @example
 * ```typescript
 * const config = {
 *   gravity: { value: 9.8, min: 0, max: 20, step: 0.1 }
 * };
 * ```
 */
export interface TweakNumberConfig {
	/** The initial value or a writable signal for two-way binding */
	value: number | WritableSignal<number>;
	/** Minimum allowed value (enables slider display) */
	min?: number;
	/** Maximum allowed value (enables slider display) */
	max?: number;
	/** Step increment for the value */
	step?: number;
}

/**
 * Configuration for a text input control.
 *
 * @example
 * ```typescript
 * const config = {
 *   name: { value: 'Object 1' }
 * };
 * ```
 */
export interface TweakTextConfig {
	/** The initial value or a writable signal for two-way binding */
	value: string | WritableSignal<string>;
}

/**
 * Configuration for a color picker control.
 *
 * @example
 * ```typescript
 * const config = {
 *   background: { value: '#ff0000', color: true }
 * };
 * ```
 */
export interface TweakColorConfig {
	/** The initial color value (as hex string) or a writable signal */
	value: string | WritableSignal<string>;
	/** Marker to identify this as a color input (must be `true`) */
	color: true;
}

/**
 * Configuration for a checkbox/boolean control.
 *
 * @example
 * ```typescript
 * const config = {
 *   enabled: { value: true }
 * };
 * ```
 */
export interface TweakCheckboxConfig {
	/** The initial value or a writable signal for two-way binding */
	value: boolean | WritableSignal<boolean>;
}

/**
 * Configuration for a dropdown list/select control.
 *
 * @typeParam T - The type of option values
 *
 * @example
 * ```typescript
 * // With array of options
 * const config = {
 *   mode: { value: 'normal', options: ['normal', 'debug', 'performance'] }
 * };
 *
 * // With labeled options
 * const config = {
 *   quality: { value: 2, options: { 'Low': 1, 'Medium': 2, 'High': 3 } }
 * };
 * ```
 */
export interface TweakListConfig<T> {
	/** The initial value or a writable signal for two-way binding */
	value: T | WritableSignal<T>;
	/** Array of options or object mapping labels to values */
	options: T[] | Record<string, T>;
}

/**
 * Configuration for a 2D/3D/4D point input control.
 *
 * @typeParam TVector - The tuple type for the point dimensions
 *
 * @example
 * ```typescript
 * // 2D point
 * const config = {
 *   position: { value: [0, 0] as [number, number] }
 * };
 *
 * // 3D point with axis constraints
 * const config = {
 *   position: {
 *     value: [0, 0, 0] as [number, number, number],
 *     x: { min: -10, max: 10 },
 *     y: { min: 0, max: 100 },
 *     z: { min: -10, max: 10 }
 *   }
 * };
 * ```
 */
export interface TweakPointConfig<
	TVector extends [number, number] | [number, number, number] | [number, number, number, number] =
		| [number, number]
		| [number, number, number]
		| [number, number, number, number],
> {
	/** The initial point value or a writable signal for two-way binding */
	value: TVector | WritableSignal<TVector>;
	/** Configuration for the X axis (min, max, step, etc.) */
	x?: Point2dInputParams['x'];
	/** Configuration for the Y axis */
	y?: Point2dInputParams['y'];
	/** Configuration for the Z axis (3D/4D points only) */
	z?: Point3dInputParams['z'];
	/** Configuration for the W axis (4D points only) */
	w?: Point4dInputParams['w'];
}

/**
 * Configuration for a button/action control.
 *
 * @example
 * ```typescript
 * const config = {
 *   reset: { action: () => this.resetSettings(), label: 'Actions' }
 * };
 * ```
 */
export interface TweakButtonConfig {
	/** The callback function to execute when the button is clicked */
	action: () => void;
	/** Optional label displayed next to the button */
	label?: string;
}

/**
 * Configuration for a nested folder within the tweaks.
 * Created using the `tweaks.folder()` helper function.
 *
 * @typeParam T - The config type for the folder's contents
 *
 * @example
 * ```typescript
 * const config = {
 *   advanced: tweaks.folder('Advanced Settings', {
 *     iterations: { value: 4, min: 1, max: 10 },
 *     tolerance: { value: 0.001, min: 0, max: 1 }
 *   })
 * };
 * ```
 */
export interface TweakFolderConfig<T extends TweakConfig> {
	/** Internal marker to identify folder configs */
	__folder: true;
	/** The folder title displayed in the UI */
	name: string;
	/** The configuration object for controls within the folder */
	config: T;
	/** Whether the folder is initially expanded */
	expanded?: boolean;
}

/**
 * Union of all possible configuration value types for `tweaks()`.
 *
 * Includes:
 * - Primitive values (number, string, boolean)
 * - Writable signals for two-way binding
 * - Typed config objects for each control type
 */
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

/**
 * A configuration object for `tweaks()`.
 * Maps control names to their configuration values.
 */
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

/**
 * The result type returned by `tweaks()` for a given configuration.
 *
 * Maps each config key to a readonly Signal of the appropriate type.
 * Button configs are excluded (they don't return values).
 *
 * @typeParam T - The configuration object type
 */
export type TweakResult<T extends TweakConfig> = {
	[K in keyof T as T[K] extends TweakButtonConfig ? never : K]: InferSignalType<T[K]>;
};

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Checks if a config value is a TweakNumberConfig.
 * @internal
 */
function isNumberConfig(config: TweakConfigValue): config is TweakNumberConfig {
	if (typeof config !== 'object' || config === null || !('value' in config)) return false;
	if ('color' in config || 'options' in config || 'action' in config || '__folder' in config) return false;
	if ('x' in config || 'y' in config) return false;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const value = isSignal(config.value) ? untracked(config.value as Signal<any>) : config.value;
	return typeof value === 'number';
}

/**
 * Checks if a config value is a TweakTextConfig.
 * @internal
 */
function isTextConfig(config: TweakConfigValue): config is TweakTextConfig {
	if (typeof config !== 'object' || config === null || !('value' in config)) return false;
	if ('color' in config || 'options' in config || 'action' in config || '__folder' in config) return false;
	if ('min' in config || 'max' in config || 'step' in config) return false;
	if ('x' in config || 'y' in config) return false;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const value = isSignal(config.value) ? untracked(config.value as Signal<any>) : config.value;
	return typeof value === 'string';
}

/**
 * Checks if a config value is a TweakColorConfig.
 * @internal
 */
function isColorConfig(config: TweakConfigValue): config is TweakColorConfig {
	return typeof config === 'object' && config !== null && 'color' in config && config.color === true;
}

/**
 * Checks if a config value is a TweakCheckboxConfig.
 * @internal
 */
function isCheckboxConfig(config: TweakConfigValue): config is TweakCheckboxConfig {
	if (typeof config !== 'object' || config === null || !('value' in config)) return false;
	if ('color' in config || 'options' in config || 'action' in config || '__folder' in config) return false;
	if ('min' in config || 'max' in config || 'step' in config) return false;
	if ('x' in config || 'y' in config) return false;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const value = isSignal(config.value) ? untracked(config.value as Signal<any>) : config.value;
	return typeof value === 'boolean';
}

/**
 * Checks if a config value is a TweakListConfig.
 * @internal
 */
function isListConfig(config: TweakConfigValue): config is TweakListConfig<unknown> {
	return typeof config === 'object' && config !== null && 'options' in config;
}

/**
 * Checks if a config value is a TweakPointConfig.
 * @internal
 */
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

/**
 * Checks if a config value is a TweakButtonConfig.
 * @internal
 */
function isButtonConfig(config: TweakConfigValue): config is TweakButtonConfig {
	return typeof config === 'object' && config !== null && 'action' in config && typeof config.action === 'function';
}

/**
 * Checks if a config value is a TweakFolderConfig.
 * @internal
 */
function isFolderConfig(config: TweakConfigValue): config is TweakFolderConfig<TweakConfig> {
	return typeof config === 'object' && config !== null && '__folder' in config && config.__folder === true;
}

// ============================================================================
// Helper to create folder configs
// ============================================================================

/**
 * Creates a nested folder configuration for use with `tweaks()`.
 *
 * This helper function creates a folder configuration object that can be
 * used as a value in the `tweaks()` config to organize controls into
 * collapsible groups.
 *
 * @typeParam T - The config type for the folder's contents
 * @param name - The display name/title of the folder
 * @param config - The configuration object for controls within the folder
 * @param options - Optional folder settings
 * @param options.expanded - Whether the folder starts expanded
 * @returns A folder configuration object
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

/**
 * Options for configuring a `tweaks()` folder.
 */
export interface TweakFolderOptions {
	/**
	 * Whether the folder is expanded by default.
	 * @default false
	 */
	expanded?: boolean;
	/**
	 * Optional injector for use outside an injection context.
	 * Required when calling `tweaks()` from outside a constructor or field initializer.
	 */
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

/**
 * Attach the folder helper to tweaks for convenient access.
 * Allows usage like `tweaks.folder('Name', config)`.
 */
tweaks.folder = folder;

// ============================================================================
// Internal: Process config and create components
// ============================================================================

/**
 * Processes a configuration object and creates the corresponding Tweakpane controls.
 * This is an internal function called by `tweaks()` to set up the UI.
 *
 * @param config - The configuration object to process
 * @param result - The result object to populate with signals
 * @param parentFolder - The parent folder to add controls to
 * @param vcr - The ViewContainerRef for creating components
 * @param createdComponents - Array to track created component refs for cleanup
 * @param anchor - The TweakpaneAnchor for folder management
 * @param parentInjector - The parent injector for dependency injection
 *
 * @internal
 */
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
