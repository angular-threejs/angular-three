import { NgtAnyRecord, NgtInstanceNode, NgtLocalInstanceState, NgtLocalState } from './types';
import { signalStore } from './utils/signal-store';
import { checkUpdate } from './utils/update';

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
				const current = instance.__ngt__.instanceStore.snapshot[type];
				const foundIndex = current.indexOf((node: NgtInstanceNode) => object === node);
				if (foundIndex > -1) {
					current.splice(foundIndex, 1, object);
					instance.__ngt__.instanceStore.update({ [type]: current });
				} else {
					instance.__ngt__.instanceStore.update((prev) => ({ [type]: [...prev[type], object] }));
				}

				notifyAncestors(instance.__ngt__.instanceStore.snapshot.parent);
			},
			remove(object, type) {
				instance.__ngt__.instanceStore.update((prev) => ({ [type]: prev[type].filter((node) => node !== object) }));
				notifyAncestors(instance.__ngt__.instanceStore.snapshot.parent);
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
	const { parent, objects, nonObjects } = localState.instanceStore.snapshot;
	localState.instanceStore.update({ objects: (objects || []).slice(), nonObjects: (nonObjects || []).slice() });
	notifyAncestors(parent);
}
