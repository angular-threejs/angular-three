import { Signal, signal, untracked } from '@angular/core';
import { NgtEventHandlers } from './events';
import { NgtState } from './store';
import { NgtAnyRecord } from './types';
import { NgtSignalStore } from './utils/signal-store';
import { checkUpdate } from './utils/update';

export interface NgtLocalState {
	// list of handlers to handle the events
	handlers: Partial<NgtEventHandlers>;
	/** the store of the canvas that the instance is being rendered to */
	store: NgtSignalStore<NgtState>;
	// if this THREE object has any events bound to it
	eventCount: number;
	// parent instance
	parent: Signal<NgtAnyRecord | null>;
	setParent(parent: NgtAnyRecord | null): void;

	// onUpdate (after calling applyProps)
	onUpdate?: (instance: NgtAnyRecord) => void;
}

export type NgtInstanceNode<TNode = any> = { __ngt__: NgtLocalState } & NgtAnyRecord & TNode;

export function getLocalState<TInstance extends object>(obj: TInstance | undefined): NgtLocalState | undefined {
	if (!obj) return undefined;
	return (obj as NgtAnyRecord)['__ngt__'];
}

/**
 * Returns the instances initial (outmost) root
 */
export function getRootStore<TInstance extends object>(obj: TInstance) {
	let store = getLocalState(obj)?.store;

	if (!store) return null;
	while (store.snapshot.previousRoot) {
		store = store.snapshot.previousRoot;
	}

	return store;
}

export function invalidateInstance<TInstance extends object>(instance: TInstance) {
	const store = getRootStore(instance);

	if (store && store.snapshot.internal.frames === 0) {
		store.snapshot.invalidate();
	}

	checkUpdate(instance);
}

export function prepare<TInstance extends object = NgtAnyRecord>(obj: TInstance, state?: Partial<NgtLocalState>) {
	const instance = obj as unknown as NgtInstanceNode<TInstance>;
	if (!instance['__ngt__']) {
		const parent = signal(state?.parent ? untracked(state.parent) : null);

		instance['__ngt__'] = {
			handlers: {},
			store: null!,
			eventCount: 0,
			parent: parent.asReadonly(),
			setParent: parent.set.bind(parent),
			...(state || {}),
		};
	}

	return instance;
}
