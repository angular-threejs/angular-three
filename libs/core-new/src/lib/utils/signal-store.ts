import {
	CreateComputedOptions,
	CreateSignalOptions,
	Signal,
	WritableSignal,
	computed,
	signal,
	untracked,
} from '@angular/core';
import { NgtAnyRecord } from '../types';

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

	/**
	 * New state takes precedence
	 */
	update(state: Partial<State> | ((previous: State) => Partial<State>)): void;

	/**
	 * Equivalence to select()
	 */
	state: Signal<State>;
	/**
	 * Equivalence to get()
	 */
	get snapshot(): State;
};

function reducer<State extends object>(state: State | ((previous: State) => State)) {
	return (previous: State) => {
		const partial = typeof state === 'function' ? state(previous) : state;
		Object.keys(partial).forEach((key) => {
			const typedKey = key as keyof State;
			if (partial[typedKey] === undefined && previous[typedKey] != null) {
				partial[typedKey] = previous[typedKey];
			}
		});
		return partial;
	};
}

function updater<State extends object>(_source: WritableSignal<State>) {
	return (state: State | ((previous: State) => State)) => {
		const updater = reducer(state);
		untracked(() => {
			_source.update((previous) => ({ ...previous, ...updater(previous) }));
		});
	};
}

function getter<State extends object>(_source: WritableSignal<State>) {
	return (...keys: string[]) => {
		const root = untracked(_source);
		if (keys.length === 0) return root;
		return keys.reduce((value, key) => (value as NgtAnyRecord)[key], root);
	};
}

function selector<State extends object>(_state: Signal<State>, computedCache: Map<string, Signal<any>>) {
	return (...keysAndOptions: any[]) => {
		if (keysAndOptions.length === 0) return _state;
		if (keysAndOptions.length === 1 && typeof keysAndOptions[0] === 'object') {
			const cachedKey = STORE_COMPUTED_KEY.concat(JSON.stringify(keysAndOptions[0]));
			if (!computedCache.has(cachedKey)) {
				computedCache.set(cachedKey, computed(_state, keysAndOptions as CreateComputedOptions<object>));
			}
			return computedCache.get(cachedKey)!;
		}
		const [keys, options] = parseStoreOptions(keysAndOptions);
		const joinedKeys = keys.join('-');
		const cachedKeys = joinedKeys.concat(JSON.stringify(options));

		if (!computedCache.has(cachedKeys)) {
			computedCache.set(
				cachedKeys,
				computed(() => keys.reduce((value, key) => (value as NgtAnyRecord)[key], _state()), options),
			);
		}
		return computedCache.get(cachedKeys)!;
	};
}

function parseStoreOptions(keysAndOptions: any[]): [string[], CreateComputedOptions<any>?] {
	if (typeof keysAndOptions.at(-1) === 'object') {
		return [keysAndOptions.slice(0, -1), keysAndOptions.at(-1)];
	}

	return [keysAndOptions, { equal: Object.is }];
}

export function signalStore<State extends object>(
	initialState:
		| Partial<State>
		| ((storeApi: Pick<NgtSignalStore<State>, 'get' | 'update' | 'select'>) => Partial<State>) = {},
	options?: CreateSignalOptions<State>,
): NgtSignalStore<State> {
	let source: WritableSignal<State>;
	let update: NgtSignalStore<State>['update'];
	let get: NgtSignalStore<State>['get'];
	let select: NgtSignalStore<State>['select'];
	let state: Signal<State>;

	const computedCache = new Map();

	if (!options) {
		options = { equal: Object.is };
	}

	if (typeof initialState === 'function') {
		source = signal({} as State, options);
		state = source.asReadonly();
		get = getter(source);
		update = updater(source);
		select = selector(state, computedCache);
		source.set(initialState({ update, get, select }) as State);
	} else {
		source = signal(initialState as State, options);
		state = source.asReadonly();
		get = getter(source);
		update = updater(source);
		select = selector(state, computedCache);
	}

	const store = { select, get, update, state };

	Object.defineProperty(store, 'snapshot', {
		get: untracked.bind({}, state),
		configurable: false,
		enumerable: false,
	});

	return store as NgtSignalStore<State>;
}
