import {
	ElementRef,
	InjectionToken,
	Injector,
	assertInInjectionContext,
	computed,
	inject,
	signal,
	untracked,
	type ChangeDetectorRef,
	type CreateComputedOptions,
	type CreateSignalOptions,
	type FactoryProvider,
	type Host,
	type InjectOptions,
	type Optional,
	type Provider,
	type Self,
	type Signal,
	type SkipSelf,
	type Type,
	type WritableSignal,
} from '@angular/core';
import * as THREE from 'three';
import type { NgtGLOptions } from './canvas';
import type { NgtIntersection } from './events';
import { getLocalState, invalidateInstance, type NgtAttachFunction, type NgtInstanceNode } from './instance';
import type { NgtCameraManual, NgtDpr, NgtRenderer, NgtSize, NgtState } from './store';
import type { NgtAnyRecord } from './types';

type CreateInjectionTokenDep<TTokenType> =
	| Type<TTokenType>
	// NOTE: we don't have an AbstractType
	| (abstract new (...args: any[]) => TTokenType)
	| InjectionToken<TTokenType>;

type CreateInjectionTokenDeps<
	TFactory extends (...args: any[]) => any,
	TFactoryDeps extends Parameters<TFactory> = Parameters<TFactory>,
> = {
	[Index in keyof TFactoryDeps]:
		| CreateInjectionTokenDep<TFactoryDeps[Index]>
		| [...modifiers: Array<Optional | Self | SkipSelf | Host>, token: CreateInjectionTokenDep<TFactoryDeps[Index]>];
} & { length: TFactoryDeps['length'] };

export type CreateInjectionTokenOptions<
	TFactory extends (...args: any[]) => any,
	TFactoryDeps extends Parameters<TFactory> = Parameters<TFactory>,
> =
	// this means TFunction has no arguments
	(TFactoryDeps[0] extends undefined
		? {
				isRoot: boolean;
				deps?: never;
		  }
		: {
				isRoot?: boolean;
				deps: CreateInjectionTokenDeps<TFactory, TFactoryDeps>;
		  }) & {
		token?: InjectionToken<ReturnType<TFactory>>;
		extraProviders?: Provider;
	};

type InjectFn<
	TFactory extends (...args: any[]) => any,
	TFactoryReturn extends ReturnType<TFactory> = ReturnType<TFactory>,
> = {
	(): TFactoryReturn;
	(injectOptions: InjectOptions & { optional?: false }): TFactoryReturn;
	(injectOptions: InjectOptions): TFactoryReturn | null;
};

export type CreateInjectionTokenReturn<
	TFactory extends (...args: any[]) => any,
	TFactoryReturn extends ReturnType<TFactory> = ReturnType<TFactory>,
> = [InjectFn<TFactory, TFactoryReturn>, (value?: TFactoryReturn) => Provider, InjectionToken<TFactoryReturn>];

function createInjectFn<TValue>(token: InjectionToken<TValue>) {
	return (injectOptions?: InjectOptions) => inject(token, injectOptions as InjectOptions);
}

function createProvideFn<
	TValue,
	TFactory extends (...args: any[]) => any = (...args: any[]) => TValue,
	TFactoryDeps extends Parameters<TFactory> = Parameters<TFactory>,
>(
	token: InjectionToken<TValue>,
	factory: (...args: any[]) => TValue,
	deps?: CreateInjectionTokenDeps<TFactory, TFactoryDeps>,
	extraProviders?: Provider,
) {
	return (value?: TValue) => {
		let provider: Provider;
		if (value) {
			provider = { provide: token, useValue: value };
		} else {
			provider = { provide: token, useFactory: factory, deps: (deps ?? []) as FactoryProvider['deps'] };
		}

		return extraProviders ? [extraProviders, provider] : provider;
	};
}

export function createInjectionToken<
	TFactory extends (...args: any[]) => any,
	TFactoryDeps extends Parameters<TFactory> = Parameters<TFactory>,
	TFactoryReturn extends ReturnType<TFactory> = ReturnType<TFactory>,
>(
	factory: TFactory,
	options?: CreateInjectionTokenOptions<TFactory, TFactoryDeps>,
): CreateInjectionTokenReturn<TFactory, TFactoryReturn> {
	const opts = options ?? ({ isRoot: true } as CreateInjectionTokenOptions<TFactory, TFactoryDeps>);

	opts.isRoot ??= true;

	if (opts.isRoot) {
		if (opts.token) {
			throw new Error(`\
createInjectionToken is creating a root InjectionToken but an external token is passed in.
`);
		}

		const token = new InjectionToken<TFactoryReturn>(`Token for ${factory.name}`, {
			factory: () => {
				if (opts.deps && Array.isArray(opts.deps)) {
					return factory(...opts.deps.map((dep) => inject(dep)));
				}
				return factory();
			},
		});

		return [
			createInjectFn(token) as CreateInjectionTokenReturn<TFactory, TFactoryReturn>[0],
			createProvideFn(token, factory, opts.deps as any[]),
			token,
		];
	}

	const token = opts.token || new InjectionToken<TFactoryReturn>(`Token for ${factory.name}`);
	return [
		createInjectFn(token) as CreateInjectionTokenReturn<TFactory, TFactoryReturn>[0],
		createProvideFn(token, factory, opts.deps as any[], opts.extraProviders),
		token,
	];
}

const STORE_COMPUTED_KEY = '__ngt_signal_store_computed__';

export type NgtSignalStore<State extends object> = {
	select<
		Key1 extends keyof State,
		Key2 extends keyof State[Key1],
		Key3 extends keyof State[Key1][Key2],
		Key4 extends keyof State[Key1][Key2][Key3],
	>(
		key1: Key1,
		key2: Key2,
		key3: Key3,
		key4: Key4,
		options?: CreateComputedOptions<State[Key1][Key2][Key3][Key4]>,
	): Signal<State[Key1][Key2][Key3][Key4]>;
	select<Key1 extends keyof State, Key2 extends keyof State[Key1], Key3 extends keyof State[Key1][Key2]>(
		key1: Key1,
		key2: Key2,
		key3: Key3,
		options?: CreateComputedOptions<State[Key1][Key2][Key3]>,
	): Signal<State[Key1][Key2][Key3]>;
	select<Key1 extends keyof State, Key2 extends keyof State[Key1]>(
		key1: Key1,
		key2: Key2,
		options?: CreateComputedOptions<State[Key1][Key2]>,
	): Signal<State[Key1][Key2]>;
	select<Key extends keyof State>(key: Key, options?: CreateComputedOptions<State[Key]>): Signal<State[Key]>;
	select(options?: CreateComputedOptions<State>): Signal<State>;

	get<
		Key1 extends keyof State,
		Key2 extends keyof State[Key1],
		Key3 extends keyof State[Key1][Key2],
		Key4 extends keyof State[Key1][Key2][Key3],
	>(
		key1: Key1,
		key2: Key2,
		key3: Key3,
		key4: Key4,
	): State[Key1][Key2][Key3][Key4];
	get<Key1 extends keyof State, Key2 extends keyof State[Key1], Key3 extends keyof State[Key1][Key2]>(
		key1: Key1,
		key2: Key2,
		key3: Key3,
	): State[Key1][Key2][Key3];
	get<Key1 extends keyof State, Key2 extends keyof State[Key1]>(key1: Key1, key2: Key2): State[Key1][Key2];
	get<Key extends keyof State>(key: Key): State[Key];
	get(): State;

	set(state: Partial<State> | ((previous: State) => Partial<State>)): void;
	patch(state: Partial<State>): void;

	state: Signal<State>;
};

export function signalStore<State extends object>(
	initialState: Partial<State> | ((storeApi: NgtSignalStore<State>) => Partial<State>) = {},
	options?: CreateSignalOptions<State>,
): NgtSignalStore<State> {
	const setter = (_source: WritableSignal<State>) => (state: State | ((previous: State) => State)) => {
		const updater = (previous: State) => {
			const partial = typeof state === 'function' ? state(previous) : state;
			Object.keys(partial).forEach((key) => {
				const typedKey = key as keyof State;
				if (partial[typedKey] === undefined && previous[typedKey] != null) {
					partial[typedKey] = previous[typedKey];
				}
			});
			return partial;
		};
		_source.update((previous) => ({ ...previous, ...updater(previous) }));
	};

	const patcher = (_source: WritableSignal<State>) => (state: State) => {
		const updater = (previous: State) => {
			Object.keys(state).forEach((key) => {
				const typedKey = key as keyof State;
				if (state[typedKey] === undefined && previous[typedKey] != null) {
					state[typedKey] = previous[typedKey];
				}
			});
			return state;
		};
		_source.update((previous) => ({ ...updater(previous), ...previous }));
	};

	const getter =
		(_source: WritableSignal<State>) =>
		(...keys: string[]) => {
			const root = untracked(_source);
			if (keys.length === 0) return root;
			return keys.reduce((value, key) => (value as NgtAnyRecord)[key], root);
		};

	let source: WritableSignal<State>;
	let set: NgtSignalStore<State>['set'];
	let get: NgtSignalStore<State>['get'];
	let patch: NgtSignalStore<State>['patch'];

	if (typeof initialState === 'function') {
		source = signal({} as State, options);
		get = getter(source);
		set = setter(source);
		patch = patcher(source);
		source.set(initialState({ set, get, patch } as NgtSignalStore<State>) as State);
	} else {
		source = signal(initialState as State, options);
		get = getter(source);
		set = setter(source);
		patch = patcher(source);
	}

	const state = source.asReadonly();
	const computedCache = new Map();

	return {
		select: (...keysAndOptions: any[]) => {
			if (keysAndOptions.length === 0) return state;
			if (keysAndOptions.length === 1 && typeof keysAndOptions[0] === 'object') {
				const cachedKey = STORE_COMPUTED_KEY.concat(JSON.stringify(keysAndOptions[0]));
				if (!computedCache.has(cachedKey)) {
					computedCache.set(cachedKey, computed(state, keysAndOptions as CreateComputedOptions<object>));
				}
				return computedCache.get(cachedKey)!;
			}
			const [keys, options] = parseStoreOptions(keysAndOptions);
			const joinedKeys = keys.join('-');
			const cachedKeys = joinedKeys.concat(options ? JSON.stringify(options) : '');

			if (!computedCache.has(cachedKeys)) {
				computedCache.set(
					cachedKeys,
					computed(() => keys.reduce((value, key) => (value as NgtAnyRecord)[key], state()), options),
				);
			}
			return computedCache.get(cachedKeys)!;
		},
		get,
		set,
		patch,
		state,
	};
}

function parseStoreOptions(keysAndOptions: any[]): [string[], CreateComputedOptions<any>?] {
	if (typeof keysAndOptions.at(-1) === 'object') {
		return [keysAndOptions.slice(0, -1), keysAndOptions.at(-1)];
	}

	return [keysAndOptions];
}

export type NgtEquConfig = {
	/** Compare arrays by reference equality a === b (default), or by shallow equality */
	arrays?: 'reference' | 'shallow';
	/** Compare objects by reference equality a === b (default), or by shallow equality */
	objects?: 'reference' | 'shallow';
	/** If true the keys in both a and b must match 1:1 (default), if false a's keys must intersect b's */
	strict?: boolean;
};

export const is = {
	obj: (a: unknown): a is object => a === Object(a) && !Array.isArray(a) && typeof a !== 'function',
	material: (a: unknown): a is THREE.Material => !!a && (a as THREE.Material).isMaterial,
	geometry: (a: unknown): a is THREE.BufferGeometry => !!a && (a as THREE.BufferGeometry).isBufferGeometry,
	orthographicCamera: (a: unknown): a is THREE.OrthographicCamera =>
		!!a && (a as THREE.OrthographicCamera).isOrthographicCamera,
	perspectiveCamera: (a: unknown): a is THREE.PerspectiveCamera =>
		!!a && (a as THREE.PerspectiveCamera).isPerspectiveCamera,
	camera: (a: unknown): a is THREE.Camera => !!a && (a as THREE.Camera).isCamera,
	renderer: (a: unknown): a is THREE.WebGLRenderer => !!a && a instanceof THREE.WebGLRenderer,
	scene: (a: unknown): a is THREE.Scene => !!a && (a as THREE.Scene).isScene,
	object3D: (a: unknown): a is THREE.Object3D => !!a && (a as THREE.Object3D).isObject3D,
	instance: (a: unknown): a is NgtInstanceNode => !!a && !!(a as NgtAnyRecord)['__ngt__'],
	ref: (a: unknown): a is ElementRef => a instanceof ElementRef,
	colorSpaceExist: <
		T extends NgtRenderer | THREE.Texture | object,
		P = T extends NgtRenderer ? { outputColorSpace: string } : { colorSpace: string },
	>(
		object: T,
	): object is T & P => 'colorSpace' in object || 'outputColorSpace' in object,
	equ(a: any, b: any, { arrays = 'shallow', objects = 'reference', strict = true }: NgtEquConfig = {}) {
		// Wrong type or one of the two undefined, doesn't match
		if (typeof a !== typeof b || !!a !== !!b) return false;
		// Atomic, just compare a against b
		if (typeof a === 'string' || typeof a === 'number') return a === b;
		const isObj = is.obj(a);
		if (isObj && objects === 'reference') return a === b;
		const isArr = Array.isArray(a);
		if (isArr && arrays === 'reference') return a === b;
		// Array or Object, shallow compare first to see if it's a match
		if ((isArr || isObj) && a === b) return true;
		// Last resort, go through keys
		let i;
		for (i in a) if (!(i in b)) return false;
		for (i in strict ? b : a) if (a[i] !== b[i]) return false;
		if (i === void 0) {
			if (isArr && a.length === 0 && b.length === 0) return true;
			if (isObj && Object.keys(a).length === 0 && Object.keys(b).length === 0) return true;
			if (a !== b) return false;
		}
		return true;
	},
};

const idCache: { [id: string]: boolean | undefined } = {};
export function makeId(event?: NgtIntersection): string {
	if (event) {
		return (event.eventObject || event.object).uuid + '/' + event.index + event.instanceId;
	}

	const newId = THREE.MathUtils.generateUUID();
	// ensure not already used
	if (!idCache[newId]) {
		idCache[newId] = true;
		return newId;
	}
	return makeId();
}

export function makeDpr(dpr: NgtDpr, window?: Window) {
	const target = window?.devicePixelRatio || 1;
	return Array.isArray(dpr) ? Math.min(Math.max(dpr[0], target), dpr[1]) : dpr;
}

export function makeDefaultCamera(isOrthographic: boolean, size: NgtSize) {
	if (isOrthographic) return new THREE.OrthographicCamera(0, 0, 0, 0, 0.1, 1000);
	return new THREE.PerspectiveCamera(75, size.width / size.height, 0.1, 1000);
}

export function makeDefaultRenderer(glOptions: NgtGLOptions, canvasElement: HTMLCanvasElement): THREE.WebGLRenderer {
	const customRenderer = (
		typeof glOptions === 'function' ? glOptions(canvasElement) : glOptions
	) as THREE.WebGLRenderer;

	if (customRenderer?.render != null) return customRenderer;

	return new THREE.WebGLRenderer({
		powerPreference: 'high-performance',
		canvas: canvasElement,
		antialias: true,
		alpha: true,
		...(glOptions || {}),
	});
}

export type NgtObjectMap = {
	nodes: { [name: string]: THREE.Object3D };
	materials: { [name: string]: THREE.Material };
	[key: string]: any;
};

export function makeObjectGraph(object: THREE.Object3D): NgtObjectMap {
	const data: NgtObjectMap = { nodes: {}, materials: {} };

	if (object) {
		object.traverse((child: THREE.Object3D) => {
			if (child.name) data.nodes[child.name] = child;
			if ('material' in child && !data.materials[((child as THREE.Mesh).material as THREE.Material).name]) {
				data.materials[((child as THREE.Mesh).material as THREE.Material).name] = (child as THREE.Mesh)
					.material as THREE.Material;
			}
		});
	}
	return data;
}

export function checkNeedsUpdate(value: unknown) {
	if (value !== null && is.obj(value) && 'needsUpdate' in (value as NgtAnyRecord)) {
		(value as NgtAnyRecord)['needsUpdate'] = true;
		if ('uniformsNeedUpdate' in (value as NgtAnyRecord)) (value as NgtAnyRecord)['uniformsNeedUpdate'] = true;
	}
}

export function checkUpdate(value: unknown) {
	if (is.object3D(value)) value.updateMatrix();

	if (is.camera(value)) {
		if (is.perspectiveCamera(value) || is.orthographicCamera(value)) value.updateProjectionMatrix();
		value.updateMatrixWorld();
	}

	checkNeedsUpdate(value);
}

export function updateCamera(camera: NgtCameraManual, size: NgtSize) {
	if (!camera.manual) {
		if (is.orthographicCamera(camera)) {
			camera.left = size.width / -2;
			camera.right = size.width / 2;
			camera.top = size.height / 2;
			camera.bottom = size.height / -2;
		} else camera.aspect = size.width / size.height;

		camera.updateProjectionMatrix();
		camera.updateMatrixWorld();
	}
}

export function assertInjectionContext(fn: Function, injector?: Injector): Injector {
	try {
		if (!injector) {
			return inject(Injector);
		}
		return injector;
	} catch {
		!injector && assertInInjectionContext(fn);
		return null!;
	}
}

export function safeDetectChanges(cdr: ChangeDetectorRef | undefined | null) {
	if (!cdr) return;
	try {
		// dynamic created component with ViewContainerRef#createComponent does not have Context
		// but it has _attachedToViewContainer
		if ((cdr as NgtAnyRecord)['_attachedToViewContainer'] || !!(cdr as NgtAnyRecord)['context']) {
			cdr.detectChanges();
		}
	} catch (e) {
		cdr.markForCheck();
	}
}

export function attach(object: NgtAnyRecord, value: unknown, paths: string[] = []): void {
	const [base, ...remaining] = paths;
	if (!base) return;

	if (remaining.length === 0) {
		applyProps(object, { [base]: value });
	} else {
		assignEmpty(object, base);
		attach(object[base], value, remaining);
	}
}

export function detach(parent: NgtAnyRecord, child: NgtAnyRecord, attachProp: string[] | NgtAttachFunction) {
	const childLocalState = getLocalState(child);
	if (Array.isArray(attachProp)) {
		attach(parent, childLocalState.previousAttach, attachProp);
	} else {
		(childLocalState.previousAttach as Function)();
	}
}

function assignEmpty(obj: NgtAnyRecord, base: string) {
	if ((!Object.hasOwn(obj, base) && Reflect && !!Reflect.has && !Reflect.has(obj, base)) || obj[base] === undefined) {
		obj[base] = {};
	}
}

export function createAttachFunction<TParent = any, TChild = any>(
	cb: (params: { parent: TParent; child: TChild; store: NgtSignalStore<NgtState> }) => (() => void) | void,
): NgtAttachFunction<TChild, TParent> {
	return (parent, child, store) => cb({ parent, child, store });
}

// This function prepares a set of changes to be applied to the instance
export function diffProps(instance: NgtAnyRecord, props: NgtAnyRecord) {
	const propsEntries = Object.entries(props);
	const changes: [key: string, value: unknown][] = [];

	for (const [propKey, propValue] of propsEntries) {
		let key = propKey;
		if (is.colorSpaceExist(instance)) {
			if (propKey === 'encoding') {
				key = 'colorSpace';
			} else if (propKey === 'outputEncoding') {
				key = 'outputColorSpace';
			}
		}
		if (is.equ(propValue, instance[key])) continue;
		changes.push([propKey, propValue]);
	}

	return changes;
}

// This function applies a set of changes to the instance
export function applyProps(instance: NgtInstanceNode, props: NgtAnyRecord) {
	// if props is empty
	if (!Object.keys(props).length) return instance;

	// Filter equals, events and reserved props
	// filter equals, events , and reserved props
	const localState = getLocalState(instance);
	const rootState = localState.store?.get();
	const changes = diffProps(instance, props);

	for (let i = 0; i < changes.length; i++) {
		let [key, value] = changes[i];

		// Alias (output)encoding => (output)colorSpace (since r152)
		// https://github.com/pmndrs/react-three-fiber/pull/2829
		if (is.colorSpaceExist(instance)) {
			const sRGBEncoding = 3001;
			const SRGBColorSpace = 'srgb';
			const LinearSRGBColorSpace = 'srgb-linear';

			if (key === 'encoding') {
				key = 'colorSpace';
				value = value === sRGBEncoding ? SRGBColorSpace : LinearSRGBColorSpace;
			} else if (key === 'outputEncoding') {
				key = 'outputColorSpace';
				value = value === sRGBEncoding ? SRGBColorSpace : LinearSRGBColorSpace;
			}
		}

		const currentInstance = instance;
		const targetProp = currentInstance[key] as NgtAnyRecord;

		// special treatmen for objects with support for set/copy, and layers
		if (targetProp && targetProp['set'] && (targetProp['copy'] || targetProp instanceof THREE.Layers)) {
			const isColor = targetProp instanceof THREE.Color;
			// if value is an array
			if (Array.isArray(value)) {
				if ((targetProp as NgtAnyRecord)['fromArray']) (targetProp as NgtAnyRecord)['fromArray'](value);
				else targetProp['set'](...value);
			}
			// test again target.copy
			else if (
				(targetProp as NgtAnyRecord)['copy'] &&
				value &&
				value.constructor &&
				targetProp.constructor.name === value.constructor.name
			) {
				(targetProp as NgtAnyRecord)['copy'](value);
				if (!THREE.ColorManagement && !rootState.linear && isColor) targetProp['convertSRGBToLinear']();
			}
			// if nothing else fits, just set the single value, ignore undefined
			else if (value !== undefined) {
				const isColor = targetProp instanceof THREE.Color;
				// allow setting array scalars
				if (!isColor && (targetProp as NgtAnyRecord)['setScalar'])
					(targetProp as NgtAnyRecord)['setScalar'](value);
				// layers have no copy function, copy the mask
				else if (targetProp instanceof THREE.Layers && value instanceof THREE.Layers)
					targetProp.mask = value.mask;
				// otherwise just set ...
				else targetProp['set'](value);

				// auto-convert srgb
				if (!THREE.ColorManagement && !rootState?.linear && isColor) targetProp.convertSRGBToLinear();
			}
		}
		// else just overwrite the value
		else {
			currentInstance[key] = value;
			// auto-convert srgb textures
			if (
				currentInstance[key] instanceof THREE.Texture &&
				currentInstance[key].format === THREE.RGBAFormat &&
				currentInstance[key].type === THREE.UnsignedByteType
			) {
				const texture = currentInstance[key] as THREE.Texture;
				if (rootState?.gl) {
					if (is.colorSpaceExist(texture) && is.colorSpaceExist(rootState.gl))
						texture.colorSpace = rootState.gl.outputColorSpace;
					else texture.encoding = rootState.gl.outputEncoding;
				}
			}
		}

		checkUpdate(targetProp);
		invalidateInstance(instance);
	}

	const instanceHandlers = localState.eventCount;
	const parent = localState.parent ? untracked(localState.parent) : null;

	if (parent && rootState.internal && instance['raycast'] && instanceHandlers !== localState.eventCount) {
		// Pre-emptively remove the instance from the interaction manager
		const index = rootState.internal.interaction.indexOf(instance);
		if (index > -1) rootState.internal.interaction.splice(index, 1);
		// Add the instance to the interaction manager only when it has handlers
		if (localState.eventCount) rootState.internal.interaction.push(instance);
	}

	if (parent && localState.afterUpdate && localState.afterUpdate.observed && changes.length) {
		localState.afterUpdate.emit(instance);
	}

	return instance;
}
