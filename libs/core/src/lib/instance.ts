import { computed } from '@angular/core';
import type * as THREE from 'three';
import type {
	NgtAnyRecord,
	NgtEventHandlers,
	NgtInstanceHierarchyState,
	NgtInstanceNode,
	NgtInstanceState,
	NgtState,
} from './types';
import { SignalState, signalState } from './utils/signal-state';
import { checkUpdate } from './utils/update';

/**
 * @deprecated Use `getInstanceState` instead. Will be removed in 5.0.0
 * @param obj - The object to get local state from
 * @returns The instance state if the object has been prepared, undefined otherwise
 */
export function getLocalState<TInstance extends object>(obj: TInstance | undefined): NgtInstanceState | undefined {
	return getInstanceState(obj);
}

/**
 * Retrieves the Angular Three instance state from a Three.js object.
 *
 * Every Three.js object managed by Angular Three has an associated instance state
 * that contains metadata such as the store reference, parent/child relationships,
 * event handlers, and attach information.
 *
 * @typeParam TInstance - The type of the Three.js object
 * @param obj - The Three.js object to get instance state from
 * @returns The instance state if the object has been prepared, undefined otherwise
 *
 * @example
 * ```typescript
 * const mesh = new THREE.Mesh();
 * prepare(mesh, 'ngt-mesh');
 * const state = getInstanceState(mesh);
 * console.log(state?.type); // 'ngt-mesh'
 * ```
 */
export function getInstanceState<TInstance extends NgtAnyRecord>(
	obj: TInstance | undefined,
): NgtInstanceState<TInstance> | undefined {
	if (!obj) return undefined;
	return (obj as NgtInstanceNode<TInstance>).__ngt__ || undefined;
}

/**
 * Invalidates an instance, triggering a re-render of the scene.
 *
 * This function marks the instance as needing an update and triggers the render loop
 * to re-render the scene. It traverses up to the root store to ensure proper invalidation
 * even for objects in portals.
 *
 * @typeParam TInstance - The type of the Three.js object
 * @param instance - The instance node to invalidate
 *
 * @example
 * ```typescript
 * // After modifying a mesh's properties
 * mesh.position.x = 10;
 * invalidateInstance(mesh);
 * ```
 */
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

/**
 * Prepares a Three.js object for use with Angular Three.
 *
 * This function attaches the Angular Three instance state to a Three.js object,
 * enabling it to be managed by the Angular Three renderer. The instance state
 * includes parent/child relationships, event handlers, and store references.
 *
 * @typeParam TInstance - The type of the Three.js object
 * @param object - The Three.js object to prepare
 * @param type - The element type name (e.g., 'ngt-mesh', 'ngt-primitive')
 * @param instanceState - Optional partial instance state to merge with defaults
 * @returns The prepared instance node
 *
 * @example
 * ```typescript
 * // Prepare a mesh for Angular Three
 * const mesh = new THREE.Mesh(geometry, material);
 * const prepared = prepare(mesh, 'ngt-mesh', { store });
 * ```
 */
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

		instance.__ngt_id__ = crypto.randomUUID();
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
					(node) =>
						object === node || (!!object['uuid'] && !!node['uuid'] && object['uuid'] === node['uuid']),
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
				instance.__ngt__.hierarchyStore.update((prev) => ({
					[type]: prev[type].filter((node) => node !== object),
				}));
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

	Object.defineProperties(instance.__ngt__, {
		setPointerEvent: {
			value: <TEvent extends keyof NgtEventHandlers>(
				eventName: TEvent,
				callback: NonNullable<NgtEventHandlers[TEvent]>,
			) => {
				const iS = getInstanceState(instance) as NgtInstanceState;
				if (!iS.handlers) iS.handlers = {};

				// try to get the previous handler. compound might have one, the THREE object might also have one with the same name
				const previousHandler = iS.handlers[eventName];
				// readjust the callback
				const updatedCallback: typeof callback = (event: any) => {
					if (previousHandler) previousHandler(event);
					callback(event);
				};

				Object.assign(iS.handlers, { [eventName]: updatedCallback });

				// increment the count everytime
				iS.eventCount += 1;

				// clean up the event listener by removing the target from the interaction array
				return () => {
					const iS = getInstanceState(instance) as NgtInstanceState;
					if (iS) {
						iS.handlers && delete iS.handlers[eventName];
						iS.eventCount -= 1;
					}
				};
			},
			configurable: true,
		},
		addInteraction: {
			value: (store?: SignalState<NgtState>) => {
				if (!store) return;

				const iS = getInstanceState(instance) as NgtInstanceState;

				if (iS.eventCount < 1 || !('raycast' in instance) || !instance['raycast']) return;

				let root = store;
				while (root.snapshot.previousRoot) {
					root = root.snapshot.previousRoot;
				}

				if (root.snapshot.internal) {
					const interactions = root.snapshot.internal.interaction;
					const index = interactions.findIndex(
						(obj) => obj.uuid === (instance as unknown as THREE.Object3D).uuid,
					);
					// if already exists, do not add to interactions
					if (index < 0) {
						root.snapshot.internal.interaction.push(instance as unknown as THREE.Object3D);
					}
				}
			},
			configurable: true,
		},
		removeInteraction: {
			value: (store?: SignalState<NgtState>) => {
				if (!store) return;

				let root = store;
				while (root.snapshot.previousRoot) {
					root = root.snapshot.previousRoot;
				}

				if (root.snapshot.internal) {
					const interactions = root.snapshot.internal.interaction;
					const index = interactions.findIndex(
						(obj) => obj.uuid === (instance as unknown as THREE.Object3D).uuid,
					);
					if (index >= 0) interactions.splice(index, 1);
				}
			},
			configurable: true,
		},
	});

	return instance;
}

interface NotificationCacheState {
	skipCount: number;
	lastType: 'objects' | 'nonObjects';
}

const notificationCache = new Map<string, NotificationCacheState>();

/**
 * Notify ancestors about changes to a THREE.js objects' children
 *
 * For example: `NgtsCenter` might have a child that asynchronously loads a 3D model
 * in which case the model matrices will be settled later. `NgtsCenter` needs to know about this
 * matrices change to re-center everything inside of it.
 *
 * The implementation here uses a naive approach to reduce the number of notifications; we cache
 * the notifications by the instance ID and the type of the notification.
 *
 * 1. If there's no cache or
 * 2. If the type is different for the same instance or
 * 3. We've skipped the notifications for this instance more than a certain amount
 *
 * then we'll proceed with notification
 */
function notifyAncestors(instance: NgtInstanceNode | null, type: 'objects' | 'nonObjects') {
	if (!instance) return;

	const localState = getInstanceState(instance);
	if (!localState) return;

	const id = instance.__ngt_id__ || instance['uuid'];
	if (!id) return;

	const maxNotificationSkipCount = localState.store?.snapshot.maxNotificationSkipCount || 5;
	const cached = notificationCache.get(id);

	if (!cached || cached.lastType !== type || cached.skipCount > maxNotificationSkipCount) {
		notificationCache.set(id, { skipCount: 0, lastType: type });

		if (notificationCache.size === 1) {
			queueMicrotask(() => notificationCache.clear());
		}

		const { parent } = localState.hierarchyStore.snapshot;
		localState.hierarchyStore.update({ [type]: (localState.hierarchyStore.snapshot[type] || []).slice() });
		notifyAncestors(parent, type);
		return;
	}

	notificationCache.set(id, { ...cached, skipCount: cached.skipCount + 1 });
}
