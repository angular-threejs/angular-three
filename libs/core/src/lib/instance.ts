import { EventEmitter } from '@angular/core';
import type { NgtEventHandlers } from './events';
import type { NgtState } from './store';
import type { NgtAnyRecord } from './types';
import { signalStore, type NgtSignalStore } from './utils/signal-store';
import { checkUpdate } from './utils/update';

export type NgtAttachFunction<TChild = any, TParent = any> = (
	parent: TParent,
	child: TChild,
	store: NgtSignalStore<NgtState>,
) => void | (() => void);

export type NgtAfterAttach<
	TChild extends NgtInstanceNode = NgtInstanceNode,
	TParent extends NgtInstanceNode = NgtInstanceNode,
> = { parent: TParent; node: TChild };

export type NgtInstanceLocalState = {
	/** the store of the canvas that the instance is being rendered to */
	store: NgtSignalStore<NgtState>;
	// objects related to this instance
	instanceStore: NgtSignalStore<{
		objects: NgtInstanceNode[];
		nonObjects: NgtInstanceNode[];
		parent: NgtInstanceNode | null;
		nativeProps: NgtAnyRecord;
	}>;
	// shortcut to add/remove object to list
	add: (instance: NgtInstanceNode, type: 'objects' | 'nonObjects') => void;
	remove: (instance: NgtInstanceNode, type: 'objects' | 'nonObjects') => void;
	setNativeProps: (key: string, value: any) => void;
	setParent: (parent: NgtInstanceNode | null) => void;
	// if this THREE instance is a ngt-primitive
	primitive?: boolean;
	// if this THREE object has any events bound to it
	eventCount: number;
	// list of handlers to handle the events
	handlers: Partial<NgtEventHandlers>;
	// previous args
	args?: unknown[];
	// attach information so that we can detach as well as reset
	attach?: string[] | NgtAttachFunction;
	// previously attach information so we can reset as well as clean up
	previousAttach?: unknown | (() => void);
	// is raw value
	isRaw?: boolean;
	// priority for before render
	priority?: number;
	// emitter after props update
	afterUpdate?: EventEmitter<NgtInstanceNode>;
	// emitter after attaching to parent
	afterAttach?: EventEmitter<NgtAfterAttach>;
};

export type NgtInstanceNode<TNode = any> = {
	__ngt__: NgtInstanceLocalState;
} & NgtAnyRecord &
	TNode;

export function getLocalState<TInstance extends object = NgtAnyRecord>(
	obj: TInstance | undefined,
): NgtInstanceLocalState {
	if (!obj) return {} as unknown as NgtInstanceLocalState;
	return (obj as NgtAnyRecord)['__ngt__'] || ({} as NgtInstanceLocalState);
}

export function invalidateInstance<TInstance extends object>(instance: TInstance) {
	const state = getLocalState(instance).store?.get();
	if (state && state.internal.frames === 0) state.invalidate();
	checkUpdate(instance);
}

export function prepare<TInstance extends object = NgtAnyRecord>(
	object: TInstance,
	localState?: Partial<NgtInstanceLocalState>,
): NgtInstanceNode<TInstance> {
	const instance = object as unknown as NgtInstanceNode<TInstance>;

	if (localState?.primitive || !instance.__ngt__) {
		const {
			instanceStore = signalStore<{
				objects: NgtInstanceNode[];
				nonObjects: NgtInstanceNode[];
				parent: NgtInstanceNode | null;
				nativeProps: NgtAnyRecord;
			}>({
				nativeProps: {},
				parent: null,
				objects: [],
				nonObjects: [],
			}),
			...rest
		} = localState || {};

		instance.__ngt__ = {
			previousAttach: null,
			store: null,
			memoized: {},
			eventCount: 0,
			handlers: {},
			instanceStore,
			add: (object, type) => {
				const current = instance.__ngt__.instanceStore.get(type);
				const foundIndex = current.indexOf((obj: NgtInstanceNode) => obj === object);
				if (foundIndex > -1) {
					// if we add an object with the same reference, then we switch it out
					current.splice(foundIndex, 1, object);
					instance.__ngt__.instanceStore.set({ [type]: current });
				} else {
					instance.__ngt__.instanceStore.set((prev) => ({ [type]: [...prev[type], object] }));
				}
				notifyAncestors(instance.__ngt__.instanceStore.get('parent'));
			},
			remove: (object, type) => {
				instance.__ngt__.instanceStore.set((prev) => ({ [type]: prev[type].filter((o) => o !== object) }));
				notifyAncestors(instance.__ngt__.instanceStore.get('parent'));
			},
			setNativeProps: (key, value) => {
				instance.__ngt__.instanceStore.set((prev) => ({ nativeProps: { ...prev.nativeProps, [key]: value } }));
			},
			setParent: (parent) => {
				instance.__ngt__.instanceStore.set({ parent });
			},
			...rest,
		} as NgtInstanceLocalState;
	}

	return instance;
}

function notifyAncestors(instance: NgtInstanceNode | null) {
	if (!instance) return;
	const localState = getLocalState(instance);
	if (localState.instanceStore) {
		localState.instanceStore.set((prev) => ({ objects: prev.objects, nonObjects: prev.nonObjects }));
		notifyAncestors(localState.instanceStore.get('parent'));
	}
}
