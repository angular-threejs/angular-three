/**
 * @fileoverview Signal-based state management ported from ngrx/signals.
 *
 * This module provides a reactive state management solution using Angular signals.
 * It supports deep signal access for nested state properties and efficient state updates.
 *
 * Ported from ngrx/signals. Last synced: 08/16/2025
 */
import { computed, isSignal, type Signal, signal, untracked, type WritableSignal } from '@angular/core';

type NonRecord =
	| Iterable<any>
	| WeakSet<any>
	| WeakMap<any, any>
	| Promise<any>
	| Date
	| Error
	| RegExp
	| ArrayBuffer
	| DataView
	| Function;

type Prettify<T> = { [K in keyof T]: T[K] } & {};
type IsRecord<T> = T extends object ? (T extends NonRecord ? false : true) : false;
type IsUnknownRecord<T> = string extends keyof T ? true : number extends keyof T ? true : false;
type IsKnownRecord<T> = IsRecord<T> extends true ? (IsUnknownRecord<T> extends true ? false : true) : false;

const STATE_SOURCE = Symbol('STATE_SOURCE');

/**
 * Type representing a writable state source with signals for each property.
 */
export type WritableStateSource<State extends object> = {
	[STATE_SOURCE]: { [K in keyof State]: WritableSignal<State[K]> };
};

/**
 * Type representing a readonly state source with signals for each property.
 */
export type StateSource<State extends object> = {
	[STATE_SOURCE]: { [K in keyof State]: Signal<State[K]> };
};

/**
 * Function type for partial state updates.
 */
export type PartialStateUpdater<State extends object> = (state: State) => Partial<State>;

function getState<State extends object>(stateSource: StateSource<State>): State {
	const signals: Record<string | symbol, Signal<unknown>> = stateSource[STATE_SOURCE];
	return Reflect.ownKeys(stateSource[STATE_SOURCE]).reduce((state, key) => {
		const value = signals[key]();
		return Object.assign(state, { [key]: value });
	}, {} as State);
}

function patchState<State extends object>(
	stateSource: WritableStateSource<State>,
	...updaters: Array<Partial<NoInfer<State>> | PartialStateUpdater<NoInfer<State>>>
): void {
	const currentState = untracked(() => getState(stateSource));
	const newState = updaters.reduce(
		(nextState: State, updater) => ({
			...nextState,
			...(typeof updater === 'function' ? updater(nextState) : updater),
		}),
		currentState,
	);

	const signals = stateSource[STATE_SOURCE];

	for (const key of Reflect.ownKeys(newState)) {
		const signalKey = key as keyof State;

		if (currentState[signalKey] !== newState[signalKey]) {
			signals[signalKey].set(newState[signalKey]);
		}
	}
}

const DEEP_SIGNAL = Symbol('DEEP_SIGNAL');

/**
 * A signal that provides deep access to nested properties as signals.
 *
 * Allows accessing nested properties directly on the signal, e.g., `state.user.name()`
 * instead of `state().user.name`.
 */
export type DeepSignal<T> = Signal<T> &
	(IsKnownRecord<T> extends true
		? Readonly<{
				[K in keyof T]: IsKnownRecord<T[K]> extends true ? DeepSignal<T[K]> : Signal<T[K]>;
			}>
		: unknown);

/**
 * Converts a regular signal to a deep signal that allows nested property access.
 *
 * @typeParam T - The type of the signal's value
 * @param signal - The signal to convert
 * @returns A DeepSignal with nested property access
 */
export function toDeepSignal<T>(signal: Signal<T>): DeepSignal<T> {
	return new Proxy(signal, {
		has(target: any, prop) {
			return !!this.get!(target, prop, undefined);
		},
		get(target: any, prop) {
			const value = untracked(target);
			if (!isRecord(value) || !(prop in value)) {
				if (isSignal(target[prop]) && (target[prop] as any)[DEEP_SIGNAL]) {
					delete target[prop];
				}

				return target[prop];
			}

			if (!isSignal(target[prop])) {
				Object.defineProperty(target, prop, {
					value: computed(() => target()[prop]),
					configurable: true,
				});
				target[prop][DEEP_SIGNAL] = true;
			}

			return toDeepSignal(target[prop]);
		},
	});
}

const nonRecords = [WeakSet, WeakMap, Promise, Date, Error, RegExp, ArrayBuffer, DataView, Function];

function isRecord(value: unknown): value is Record<string, unknown> {
	if (value === null || typeof value !== 'object' || isIterable(value)) {
		return false;
	}

	let proto = Object.getPrototypeOf(value);
	if (proto === Object.prototype) {
		return true;
	}

	while (proto && proto !== Object.prototype) {
		if (nonRecords.includes(proto.constructor)) {
			return false;
		}
		proto = Object.getPrototypeOf(proto);
	}

	return proto === Object.prototype;
}

function isIterable(value: any): value is Iterable<any> {
	return typeof value?.[Symbol.iterator] === 'function';
}

/**
 * A reactive state container built on Angular signals.
 *
 * Provides deep signal access to nested properties, an update method for
 * modifying state, and a snapshot getter for non-reactive access.
 */
export type SignalState<State extends object> = DeepSignal<State> &
	WritableStateSource<State> & {
		/** Updates the state with partial updates or updater functions */
		update: (...updaters: Array<Partial<Prettify<State>> | PartialStateUpdater<Prettify<State>>>) => void;
		/** Gets the current state value without triggering reactivity */
		get snapshot(): State;
	};

/**
 * Creates a reactive state container from an initial state object.
 *
 * The returned SignalState provides:
 * - Deep signal access to nested properties (e.g., `state.camera()`)
 * - An `update` method for modifying state
 * - A `snapshot` getter for non-reactive access
 *
 * @typeParam State - The shape of the state object
 * @param initialState - The initial state values
 * @returns A SignalState instance
 *
 * @example
 * ```typescript
 * const store = signalState({
 *   camera: null,
 *   scene: null,
 *   size: { width: 0, height: 0 }
 * });
 *
 * // Access reactively
 * const width = store.size.width();
 *
 * // Update state
 * store.update({ camera: new THREE.PerspectiveCamera() });
 *
 * // Access snapshot
 * const { scene } = store.snapshot;
 * ```
 */
export function signalState<State extends object>(initialState: State): SignalState<State> {
	const stateKeys = Reflect.ownKeys(initialState);

	const stateSource = stateKeys.reduce(
		(signalsDict, key) =>
			Object.assign(signalsDict, {
				[key]: signal((initialState as Record<string | symbol, unknown>)[key]),
			}),
		{} as Record<string | symbol, any>,
	);

	const signalState = computed(() => stateKeys.reduce((state, key) => ({ ...state, [key]: stateSource[key]() }), {}));

	Object.defineProperties(signalState, {
		[STATE_SOURCE]: { value: stateSource },
		update: { value: patchState.bind(null, signalState as SignalState<State>) },
		snapshot: { get: () => untracked(signalState) },
	});

	for (const key of stateKeys) {
		Object.defineProperty(signalState, key, {
			value: toDeepSignal(stateSource[key]),
		});
	}

	return signalState as SignalState<State>;
}
