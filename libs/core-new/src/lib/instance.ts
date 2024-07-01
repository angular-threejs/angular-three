import { Signal, signal, untracked } from '@angular/core';
import { NgtEventHandlers } from './events';
import { NgtState } from './store';
import { NgtAnyRecord } from './types';
import { NgtSignalStore } from './utils/signal-store';
import { checkUpdate } from './utils/update';

export type NgtAttachFunction<TChild = any, TParent = any> = (
	parent: TParent,
	child: TChild,
	store: NgtSignalStore<NgtState>,
) => void | (() => void);

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
	// 3d objects as children
	objects: Signal<NgtAnyRecord[]>;
	// non-3d objects as children
	nonObjects: Signal<NgtAnyRecord[]>;
	add(instance: NgtAnyRecord, type: 'objects' | 'nonObjects'): void;
	remove(instance: NgtAnyRecord, type: 'objects' | 'nonObjects'): void;
	// attach information so that we can detach as well as reset
	attach?: string[] | NgtAttachFunction;
	// previously attach information so we can reset as well as clean up
	previousAttach?: unknown | (() => void);
	// is this a primitive object
	isPrimitive?: boolean;
	// is raw value via ngt-value
	isRaw?: boolean;
	// the raw value for ngt-value
	rawValue?: any;
	// priority for before render via [prirority]
	priority?: number;
	// onUpdate (after calling applyProps via (updated))
	onUpdate?: (instance: NgtAnyRecord) => void;
	// onAttach (after attaching to parent via (attached))
	onAttach?: (attachEvent: { instance: NgtAnyRecord; parent: NgtAnyRecord }) => void;
	// clean up local state
	destroy?: () => void;
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
		const objects = signal<NgtAnyRecord[]>([]);
		const nonObjects = signal<NgtAnyRecord[]>([]);

		instance['__ngt__'] = {
			handlers: {},
			store: null!,
			eventCount: 0,
			parent: parent.asReadonly(),
			setParent: parent.set.bind(parent),
			objects: objects.asReadonly(),
			nonObjects: nonObjects.asReadonly(),
			add(object, type) {
				const current = untracked(instance.__ngt__[type]);
				const writable = type === 'objects' ? objects : nonObjects;
				const foundIndex = current.indexOf((node: NgtInstanceNode) => object === node);

				untracked(() => {
					if (foundIndex > -1) {
						current.splice(foundIndex, 1, object);
						writable.set(current);
					} else {
						writable.update((prev) => [...prev, object]);
					}
				});
				// notifyAncestors(instance.__ngt__.instanceStore.get('parent'));
			},
			remove(object, type) {
				const writable = type === 'objects' ? objects : nonObjects;
				untracked(() => {
					writable.update((prev) => prev.filter((node) => node !== object));
				});
				// notifyAncestors(instance.__ngt__.instanceStore.get('parent'));
			},
			...(state || {}),
			destroy: () => {
				const localState = instance.__ngt__;
				localState.objects &&
					untracked(localState.objects).forEach((obj) => {
						getLocalState(obj)?.destroy?.();
					});
				localState.nonObjects &&
					untracked(localState.nonObjects).forEach((obj) => {
						getLocalState(obj)?.destroy?.();
					});

				delete localState.onAttach;
				delete localState.onUpdate;
				delete (localState as NgtAnyRecord)['objects'];
				delete (localState as NgtAnyRecord)['nonObjects'];
				delete (localState as NgtAnyRecord)['parent'];
				delete (localState as NgtAnyRecord)['setParent'];
				delete (localState as NgtAnyRecord)['add'];
				delete (localState as NgtAnyRecord)['remove'];
				delete (localState as NgtAnyRecord)['store'];
				delete (localState as NgtAnyRecord)['handlers'];

				if (!localState.isPrimitive) {
					delete (instance as NgtAnyRecord)['__ngt__'];
				}
			},
		};
	}

	return instance;
}

// function notifyAncestors(instance: NgtInstanceNode | null) {
// 	if (!instance) return;
// 	const localState = getLocalState(instance);
// 	if (!localState) return;
// 	localState.instanceStore.update((prev) => ({ objects: prev.objects, nonObjects: prev.nonObjects }));
// 	notifyAncestors(localState.instanceStore.get('parent'));
// }
