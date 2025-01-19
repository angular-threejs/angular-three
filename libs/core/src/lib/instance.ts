import { computed } from '@angular/core';
import type { NgtAnyRecord, NgtInstanceHierarchyState, NgtInstanceNode, NgtInstanceState } from './types';
import { signalState } from './utils/signal-state';
import { checkUpdate } from './utils/update';

/**
 * @deprecated: use `getInstanceState` instead. Will be removed in 5.0.0
 */
export function getLocalState<TInstance extends object>(obj: TInstance | undefined): NgtInstanceState | undefined {
	return getInstanceState(obj);
}

export function getInstanceState<TInstance extends NgtAnyRecord>(
	obj: TInstance | undefined,
): NgtInstanceState<TInstance> | undefined {
	if (!obj) return undefined;
	return (obj as NgtInstanceNode<TInstance>).__ngt__ || undefined;
}

export function invalidateInstance<TInstance extends NgtAnyRecord>(instance: NgtInstanceNode<TInstance>) {
	let store = getInstanceState(instance)?.store;

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

export function prepare<TInstance extends NgtAnyRecord = NgtAnyRecord>(
	object: TInstance,
	type: string,
	instanceState?: Partial<NgtInstanceState>,
) {
	const instance = object as NgtInstanceNode<TInstance>;

	if (instanceState?.type === 'ngt-primitive' || !instance.__ngt__) {
		const {
			hierarchyStore = signalState<NgtInstanceHierarchyState>({
				parent: null,
				objects: [],
				nonObjects: [],
				geometryStamp: Date.now(),
			}),
			store = null,
			...rest
		} = instanceState || {};

		const nonObjects = hierarchyStore.nonObjects;
		const geometryStamp = hierarchyStore.geometryStamp;

		const nonObjectsChanged = computed(() => {
			const [_nonObjects] = [nonObjects(), geometryStamp()];
			return _nonObjects;
		});

		instance.__ngt__ = {
			previousAttach: null,
			type,
			eventCount: 0,
			handlers: {},
			hierarchyStore,
			object: instance as any,
			parent: hierarchyStore.parent,
			objects: hierarchyStore.objects,
			nonObjects: nonObjectsChanged,
			add(object, type) {
				const current = instance.__ngt__.hierarchyStore.snapshot[type];
				const foundIndex = current.findIndex(
					(node) => object === node || (!!object['uuid'] && !!node['uuid'] && object['uuid'] === node['uuid']),
				);

				if (foundIndex > -1) {
					current.splice(foundIndex, 1, object);
					instance.__ngt__.hierarchyStore.update({ [type]: current });
				} else {
					instance.__ngt__.hierarchyStore.update((prev) => ({ [type]: [...prev[type], object] }));
				}

				notifyAncestors(instance.__ngt__.hierarchyStore.snapshot.parent, type);
			},
			remove(object, type) {
				instance.__ngt__.hierarchyStore.update((prev) => ({ [type]: prev[type].filter((node) => node !== object) }));
				notifyAncestors(instance.__ngt__.hierarchyStore.snapshot.parent, type);
			},
			setParent(parent) {
				instance.__ngt__.hierarchyStore.update({ parent });
			},
			updateGeometryStamp() {
				instance.__ngt__.hierarchyStore.update({ geometryStamp: Date.now() });
			},
			store,
			...rest,
		};
	}

	return instance;
}

function notifyAncestors(instance: NgtInstanceNode | null, type: 'objects' | 'nonObjects') {
	if (!instance) return;
	const localState = getInstanceState(instance);
	if (!localState) return;
	const { parent } = localState.hierarchyStore.snapshot;
	localState.hierarchyStore.update({ [type]: (localState.hierarchyStore.snapshot[type] || []).slice() });
	notifyAncestors(parent, type);
}
