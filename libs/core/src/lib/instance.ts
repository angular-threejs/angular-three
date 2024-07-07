import { Signal } from '@angular/core';
import { NgtEventHandlers } from './events';
import { NgtState } from './store';
import { NgtAnyRecord } from './types';
import { NgtSignalStore, signalStore } from './utils/signal-store';
import { checkUpdate } from './utils/update';

export type NgtAttachFunction<TChild = any, TParent = any> = (
	parent: TParent,
	child: TChild,
	store: NgtSignalStore<NgtState>,
) => void | (() => void);

export interface NgtAfterAttach<
	TChild extends NgtInstanceNode = NgtInstanceNode,
	TParent extends NgtInstanceNode = NgtInstanceNode,
> {
	parent: TParent;
	node: TChild;
}

export interface NgtLocalInstanceState {
	objects: NgtInstanceNode[];
	nonObjects: NgtInstanceNode[];
	parent: NgtInstanceNode | null;
}

export interface NgtLocalState {
	/** the store of the canvas that the instance is being rendered to */
	store: NgtSignalStore<NgtState>;
	// objects related to this instance
	instanceStore: NgtSignalStore<NgtLocalInstanceState>;
	// shortcut to signals
	parent: Signal<NgtLocalInstanceState['parent']>;
	objects: Signal<NgtLocalInstanceState['objects']>;
	nonObjects: Signal<NgtLocalInstanceState['nonObjects']>;
	// shortcut to add/remove object to list
	add: (instance: NgtInstanceNode, type: 'objects' | 'nonObjects') => void;
	remove: (instance: NgtInstanceNode, type: 'objects' | 'nonObjects') => void;
	setParent: (parent: NgtInstanceNode | null) => void;
	// if this THREE instance is a ngt-primitive
	primitive?: boolean;
	// if this THREE object has any events bound to it
	eventCount: number;
	// list of handlers to handle the events
	handlers: Partial<NgtEventHandlers>;
	// attach information so that we can detach as well as reset
	attach?: string[] | NgtAttachFunction;
	// previously attach information so we can reset as well as clean up
	previousAttach?: unknown | (() => void);
	// is raw value
	isRaw?: boolean;
	// priority for before render
	priority?: number;
	onUpdate?: (node: NgtInstanceNode) => void;
	onAttach?: (afterAttach: NgtAfterAttach) => void;
}

export type NgtInstanceNode<TNode = any> = { __ngt__: NgtLocalState } & NgtAnyRecord & TNode;

export function getLocalState<TInstance extends object>(obj: TInstance | undefined): NgtLocalState | undefined {
	if (!obj) return undefined;
	return (obj as NgtAnyRecord)['__ngt__'];
}

export function invalidateInstance<TInstance extends object>(instance: TInstance) {
	let store = getLocalState(instance)?.store;

	if (store) {
		while (store.snapshot.previousRoot) {
			store = store.snapshot.previousRoot;
		}
		if (store.snapshot.internal.frames === 0) {
			store.snapshot.invalidate();
		}
	}

	checkUpdate(instance);
}

export function prepare<TInstance extends object = NgtAnyRecord>(
	object: TInstance,
	localState?: Partial<NgtLocalState>,
) {
	const instance = object as unknown as NgtInstanceNode<TInstance>;

	if (localState?.primitive || !instance.__ngt__) {
		const {
			instanceStore = signalStore<NgtLocalInstanceState>({
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
			parent: instanceStore.select('parent'),
			objects: instanceStore.select('objects'),
			nonObjects: instanceStore.select('nonObjects'),
			add(object, type) {
				const current = instance.__ngt__.instanceStore.get(type);
				const foundIndex = current.indexOf((node: NgtInstanceNode) => object === node);
				if (foundIndex > -1) {
					current.splice(foundIndex, 1, object);
					instance.__ngt__.instanceStore.update({ [type]: current });
				} else {
					instance.__ngt__.instanceStore.update((prev) => ({ [type]: [...prev[type], object] }));
				}
				notifyAncestors(instance.__ngt__.instanceStore.get('parent'));
			},
			remove(object, type) {
				instance.__ngt__.instanceStore.update((prev) => ({ [type]: prev[type].filter((node) => node !== object) }));
				notifyAncestors(instance.__ngt__.instanceStore.get('parent'));
			},
			setParent(parent) {
				instance.__ngt__.instanceStore.update({ parent });
			},
			...rest,
		} as NgtLocalState;
	}

	return instance;
}

function notifyAncestors(instance: NgtInstanceNode | null) {
	if (!instance) return;
	const localState = getLocalState(instance);
	if (!localState) return;
	localState.instanceStore.update((prev) => ({ objects: prev.objects, nonObjects: prev.nonObjects }));
	notifyAncestors(localState.instanceStore.get('parent'));
}
