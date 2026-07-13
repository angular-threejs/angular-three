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

/** RFC 4122 v4 UUID — safe in non-secure contexts (e.g. http:// on LAN). */
export function uuidv4Fallback(): string {
	const bytes = new Uint8Array(16);
	crypto.getRandomValues(bytes);
	bytes[6] = (bytes[6] & 0x0f) | 0x40;
	bytes[8] = (bytes[8] & 0x3f) | 0x80;
	const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0'));
	return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10).join('')}`;
}

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

type RegisteredPointerHandler = (event: unknown) => void;
const pointerEventRegistrations = new WeakMap<
	NgtInstanceState,
	Map<keyof NgtEventHandlers, Map<symbol, RegisteredPointerHandler>>
>();

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

		instance.__ngt_id__ = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : uuidv4Fallback();
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
			add(object, type, before) {
				const current = instance.__ngt__.hierarchyStore.snapshot[type];
				const next = current.filter(
					(node) => object !== node && (!object['uuid'] || !node['uuid'] || object['uuid'] !== node['uuid']),
				);
				const beforeIndex = before ? next.indexOf(before) : -1;
				next.splice(beforeIndex >= 0 ? beforeIndex : next.length, 0, object);
				instance.__ngt__.hierarchyStore.update({ [type]: next });

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
				const handlers = (iS.handlers ??= {});
				let registrations = pointerEventRegistrations.get(iS);
				if (!registrations) {
					registrations = new Map();
					pointerEventRegistrations.set(iS, registrations);
				}

				let listeners = registrations.get(eventName);
				if (!listeners) {
					listeners = new Map();
					registrations.set(eventName, listeners);
					const existingHandler = handlers[eventName];
					if (existingHandler) listeners.set(Symbol('existing'), existingHandler as RegisteredPointerHandler);
				}

				const token = Symbol(eventName);
				listeners.set(token, callback as RegisteredPointerHandler);
				const dispatch = ((event: unknown) => {
					for (const listener of [...listeners.values()]) listener(event);
				}) as NonNullable<NgtEventHandlers[TEvent]>;
				handlers[eventName] = dispatch;
				iS.eventCount += 1;

				let active = true;
				return () => {
					if (!active) return;
					active = false;
					if (getInstanceState(instance) !== iS || !listeners?.delete(token)) return;
					iS.eventCount = Math.max(0, iS.eventCount - 1);
					if (listeners.size === 0) {
						registrations?.delete(eventName);
						delete handlers[eventName];
					}
					if (iS.eventCount === 0) iS.removeInteraction?.(iS.store);
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
					const internal = root.snapshot.internal;
					const object = instance as unknown as THREE.Object3D;
					const interactions = internal.interaction;
					const index = interactions.findIndex((obj) => obj.uuid === object.uuid);
					if (index >= 0) interactions.splice(index, 1);
					internal.initialHits = internal.initialHits.filter((hit) => hit !== object);
					for (const [key, hovered] of internal.hovered) {
						if (hovered.eventObject === object || hovered.object === object) internal.hovered.delete(key);
					}
					for (const [pointerId, captures] of internal.capturedMap) {
						const capture = captures.get(object);
						if (!capture) continue;
						captures.delete(object);
						if (captures.size === 0) {
							internal.capturedMap.delete(pointerId);
							capture.target.releasePointerCapture(pointerId);
						}
					}
				}
			},
			configurable: true,
		},
	});

	return instance;
}
const pendingAncestorNotifications = new Map<NgtInstanceNode, Set<'objects' | 'nonObjects'>>();
let ancestorNotificationScheduled = false;

/**
 * Notify ancestors about changes to a THREE.js objects' children
 *
 * For example: `NgtsCenter` might have a child that asynchronously loads a 3D model
 * in which case the model matrices will be settled later. `NgtsCenter` needs to know about this
 * matrices change to re-center everything inside of it.
 *
 * Notifications are coalesced by ancestor and hierarchy kind. Angular renderer
 * transactions flush them at `RendererFactory2.end`; direct calls use a microtask fallback.
 */
function notifyAncestors(instance: NgtInstanceNode | null, type: 'objects' | 'nonObjects') {
	let current = instance;
	while (current) {
		const localState = getInstanceState(current);
		if (!localState?.hierarchyStore) break;
		let types = pendingAncestorNotifications.get(current);
		if (!types) pendingAncestorNotifications.set(current, (types = new Set()));
		types.add(type);
		current = localState.hierarchyStore.snapshot.parent;
	}

	if (pendingAncestorNotifications.size === 0 || ancestorNotificationScheduled) return;
	ancestorNotificationScheduled = true;
	queueMicrotask(flushAncestorNotifications);
}

/** @internal */
export function flushAncestorNotifications() {
	ancestorNotificationScheduled = false;
	const batch = [...pendingAncestorNotifications];
	pendingAncestorNotifications.clear();
	for (const [ancestor, types] of batch) {
		const localState = getInstanceState(ancestor);
		if (!localState?.hierarchyStore) continue;
		const snapshot = localState.hierarchyStore.snapshot;
		const update: Partial<NgtInstanceHierarchyState> = {};
		for (const pendingType of types) update[pendingType] = snapshot[pendingType].slice();
		localState.hierarchyStore.update(update);
	}
}
