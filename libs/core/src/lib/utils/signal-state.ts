/** ported from ngrx/signals */
import { computed, isSignal, Signal as NgSignal, signal, untracked, WritableSignal } from '@angular/core';

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

type WritableStateSource<State extends object> = {
	[STATE_SOURCE]: WritableSignal<State>;
};

export type PartialStateUpdater<State extends object> = (state: State) => Partial<State>;

function patchState<State extends object>(
	stateSource: WritableStateSource<State>,
	...updaters: Array<Partial<Prettify<State>> | PartialStateUpdater<Prettify<State>>>
): void {
	stateSource[STATE_SOURCE].update((currentState) =>
		updaters.reduce(
			(nextState: State, updater) => ({
				...nextState,
				...(typeof updater === 'function' ? updater(nextState) : updater),
			}),
			currentState,
		),
	);
}

// An extended Signal type that enables the correct typing
// of nested signals with the `name` or `length` key.
export interface Signal<T> extends NgSignal<T> {
	name: unknown;
	length: unknown;
}

export type DeepSignal<T> = Signal<T> &
	(IsKnownRecord<T> extends true
		? Readonly<{
				[K in keyof T]: IsKnownRecord<T[K]> extends true ? DeepSignal<T[K]> : Signal<T[K]>;
			}>
		: unknown);

function toDeepSignal<T>(signal: Signal<T>): DeepSignal<T> {
	const value = untracked(() => signal());
	if (!isRecord(value)) {
		return signal as DeepSignal<T>;
	}

	return new Proxy(signal, {
		get(target: any, prop) {
			if (!(prop in value)) {
				return target[prop];
			}

			if (!isSignal(target[prop])) {
				Object.defineProperty(target, prop, {
					value: computed(() => target()[prop]),
					configurable: true,
				});
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

export type SignalState<State extends object> = DeepSignal<State> &
	WritableStateSource<State> & {
		update: (...updaters: Array<Partial<Prettify<State>> | PartialStateUpdater<Prettify<State>>>) => void;
		get snapshot(): State;
	};

export function signalState<State extends object>(initialState: State): SignalState<State> {
	const stateSource = signal(initialState as State);
	const signalState = toDeepSignal(stateSource.asReadonly());

	Object.defineProperties(signalState, {
		[STATE_SOURCE]: { value: stateSource },
		update: { value: patchState.bind(null, signalState as SignalState<State>) },
		snapshot: { get: () => untracked(stateSource) },
	});

	return signalState as SignalState<State>;
}
