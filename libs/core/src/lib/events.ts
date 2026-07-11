import { Subject } from 'rxjs';
import * as THREE from 'three';
import { getInstanceState } from './instance';
import type {
	NgtAnyRecord,
	NgtDomEvent,
	NgtEventHandlers,
	NgtIntersection,
	NgtPointerCaptureTarget,
	NgtState,
	NgtThreeEvent,
} from './types';
import { makeId } from './utils/make';
import { SignalState } from './utils/signal-state';

const NGT_EVENT_LAYER = Symbol('NGT_EVENT_LAYER');
type LayeredIntersection = THREE.Intersection<THREE.Object3D> & {
	[NGT_EVENT_LAYER]?: SignalState<NgtState>;
};

/**
 * @fileoverview Event handling system for Angular Three.
 *
 * This module provides the event handling infrastructure for raycasting-based
 * pointer events in Three.js scenes. It handles event propagation, pointer
 * capture, and event bubbling through the scene graph.
 */

/**
 * Releases pointer captures for an object.
 * Called by releasePointerCapture in the API, and when an object is removed.
 * @internal
 */
function releaseInternalPointerCapture(
	capturedMap: Map<number, Map<THREE.Object3D, NgtPointerCaptureTarget>>,
	obj: THREE.Object3D,
	captures: Map<THREE.Object3D, NgtPointerCaptureTarget>,
	pointerId: number,
): void {
	const captureData: NgtPointerCaptureTarget | undefined = captures.get(obj);
	if (captureData) {
		captures.delete(obj);
		// If this was the last capturing object for this pointer
		if (captures.size === 0) {
			capturedMap.delete(pointerId);
			captureData.target.releasePointerCapture(pointerId);
		}
	}
}

/**
 * Removes all traces of an object from the event handling system.
 *
 * This function cleans up:
 * - Interaction array
 * - Initial hits
 * - Hovered elements map
 * - Pointer captures
 *
 * @param store - The Angular Three store
 * @param object - The object to remove from interactivity
 */
export function removeInteractivity(store: SignalState<NgtState>, object: THREE.Object3D) {
	const { internal } = store.snapshot;
	// Removes every trace of an object from the data store
	internal.interaction = internal.interaction.filter((o) => o !== object);
	internal.initialHits = internal.initialHits.filter((o) => o !== object);
	internal.hovered.forEach((value, key) => {
		if (value.eventObject === object || value.object === object) {
			// Clear out intersects, they are outdated by now
			internal.hovered.delete(key);
		}
	});
	internal.capturedMap.forEach((captures, pointerId) => {
		releaseInternalPointerCapture(internal.capturedMap, object, captures, pointerId);
	});
}

/**
 * Creates the event handling system for a store.
 *
 * Returns an object with a `handlePointer` function that creates event handlers
 * for different pointer event types. These handlers perform raycasting,
 * event propagation, and callback invocation.
 *
 * @param store - The Angular Three store to create events for
 * @returns An object containing the handlePointer factory function
 */
export function createEvents(store: SignalState<NgtState>) {
	/** Calculates delta */
	function calculateDistance(event: NgtDomEvent) {
		const internal = store.snapshot.internal;
		const dx = event.offsetX - internal.initialClick[0];
		const dy = event.offsetY - internal.initialClick[1];
		return Math.round(Math.sqrt(dx * dx + dy * dy));
	}

	/** Returns true if an instance has a valid pointer-event registered, this excludes scroll, clicks etc */
	function filterPointerEvents(objects: THREE.Object3D[]) {
		return objects.filter((obj) =>
			['move', 'over', 'enter', 'out', 'leave'].some((name) => {
				const eventName = `pointer${name}` as keyof NgtEventHandlers;
				return getInstanceState(obj)?.handlers?.[eventName];
			}),
		);
	}

	function intersect(event: NgtDomEvent, filter?: (objects: THREE.Object3D[]) => THREE.Object3D[]) {
		const state = store.snapshot;
		const duplicates = new Set<string>();
		const intersections: NgtIntersection[] = [];
		// Allow callers to eliminate event objects
		const allEventsObjects = filter ? filter(state.internal.interaction) : state.internal.interaction;

		// filter out invisible objects
		const eventsObjects: THREE.Object3D[] = [];
		for (const eventsObject of allEventsObjects) {
			let current: THREE.Object3D | null = eventsObject;
			while (current) {
				if (!current.visible) break;
				current = current.parent;
			}

			if (!current) eventsObjects.push(eventsObject);
		}

		const objectsByLayer = new Map<SignalState<NgtState>, THREE.Object3D[]>();
		for (const object of eventsObjects) {
			const objectStore = getInstanceState(object)?.store;
			if (!objectStore) continue;
			const layerObjects = objectsByLayer.get(objectStore);
			if (layerObjects) layerObjects.push(object);
			else objectsByLayer.set(objectStore, [object]);
		}

		// The root computation must precede portal/layer computations, which may derive their
		// pointer or ray from previousRoot. Each layer is reset, computed, and raycast once.
		const eventLayers: SignalState<NgtState>[] = [];
		const scheduledLayers = new Set<SignalState<NgtState>>();
		const scheduleLayer = (eventLayer: SignalState<NgtState>) => {
			if (scheduledLayers.has(eventLayer)) return;
			scheduledLayers.add(eventLayer);
			const previousRoot = eventLayer.snapshot.previousRoot;
			if (previousRoot) scheduleLayer(previousRoot);
			eventLayers.push(eventLayer);
		};
		scheduleLayer(store);
		for (const objectStore of objectsByLayer.keys()) scheduleLayer(objectStore);
		for (const eventLayer of eventLayers) eventLayer.snapshot.raycaster.camera = undefined!;

		const raycastResults: LayeredIntersection[] = [];
		for (const eventLayer of eventLayers) {
			const layerState = eventLayer.snapshot;
			if (!layerState.events.enabled) continue;
			layerState.events.compute?.(event, eventLayer, layerState.previousRoot);
			if (layerState.raycaster.camera === undefined) layerState.raycaster.camera = null!;

			const layerObjects = objectsByLayer.get(eventLayer);
			if (!layerState.raycaster.camera || !layerObjects?.length) continue;
			const layerResults = layerState.raycaster.intersectObjects(layerObjects, true);
			for (let index = 0; index < layerResults.length; index++) {
				const result = layerResults[index] as LayeredIntersection;
				result[NGT_EVENT_LAYER] = eventLayer;
				raycastResults.push(result);
			}
		}

		// Sort by event priority and distance
		raycastResults.sort((a, b) => {
			const aState = a[NGT_EVENT_LAYER]?.snapshot ?? getInstanceState(a.object)?.store?.snapshot;
			const bState = b[NGT_EVENT_LAYER]?.snapshot ?? getInstanceState(b.object)?.store?.snapshot;
			if (!aState || !bState) return a.distance - b.distance;
			return bState.events.priority - aState.events.priority || a.distance - b.distance;
		});

		// Filter out duplicates - more efficient than chaining
		let hits: THREE.Intersection<THREE.Object3D>[] = [];
		for (let i = 0; i < raycastResults.length; i++) {
			const item = raycastResults[i];
			const id = makeId(item as NgtIntersection);
			if (duplicates.has(id)) continue;
			duplicates.add(id);
			hits.push(item);
		}

		// https://github.com/mrdoob/three.js/issues/16031
		// Allow custom userland intersect sort order, this likely only makes sense on the root filter
		if (state.events.filter) hits = state.events.filter(hits, store);

		// Bubble up the events, find the event source (eventObject)
		const hitsLen = hits.length;
		for (let i = 0; i < hitsLen; i++) {
			const hit = hits[i];
			let eventObject: THREE.Object3D | null = hit.object;
			// bubble event up
			while (eventObject) {
				if (getInstanceState(eventObject)?.eventCount) intersections.push({ ...hit, eventObject });
				eventObject = eventObject.parent;
			}
		}

		// If the interaction is captured, make all capturing targets part of the intersect.
		if ('pointerId' in event && state.internal.capturedMap.has(event.pointerId)) {
			const captures = state.internal.capturedMap.get(event.pointerId)!;
			for (const captureData of captures.values()) {
				if (duplicates.has(makeId(captureData.intersection))) continue;
				intersections.push(captureData.intersection);
			}
		}
		return intersections;
	}

	/**  Handles intersections by forwarding them to handlers */
	function handleIntersects(
		intersections: NgtIntersection[],
		event: NgtDomEvent,
		delta: number,
		callback: (event: NgtThreeEvent<NgtDomEvent>) => void,
	) {
		const rootState = store.snapshot;

		// If anything has been found, forward it to the event listeners
		if (intersections.length) {
			const localState = { stopped: false };
			for (const hit of intersections) {
				let instanceState = getInstanceState(hit.object);

				// If the object is not managed by NGT, it might be parented to an element which is.
				// Traverse upwards until we find a managed parent and use its state instead.
				if (!instanceState) {
					hit.object.traverseAncestors((ancestor) => {
						const parentInstanceState = getInstanceState(ancestor);
						if (parentInstanceState) {
							instanceState = parentInstanceState;
							return false;
						}
						return;
					});
				}

				const eventLayer = (hit as LayeredIntersection)[NGT_EVENT_LAYER];
				const { raycaster, pointer, camera, internal } =
					eventLayer?.snapshot || instanceState?.store?.snapshot || rootState;

				const unprojectedPoint = new THREE.Vector3(pointer.x, pointer.y, 0).unproject(camera);
				const hasPointerCapture = (id: number) => internal.capturedMap.get(id)?.has(hit.eventObject) ?? false;

				const setPointerCapture = (id: number) => {
					const captureData = { intersection: hit, target: event.target as Element };
					if (internal.capturedMap.has(id)) {
						// if the pointerId was previously captured, we add the hit to the
						// event capturedMap.
						internal.capturedMap.get(id)!.set(hit.eventObject, captureData);
					} else {
						// if the pointerId was not previously captured, we create a map
						// containing the hitObject, and the hit. hitObject is used for
						// faster access.
						internal.capturedMap.set(id, new Map([[hit.eventObject, captureData]]));
					}
					// Call the original event now
					(event.target as Element).setPointerCapture(id);
				};

				const releasePointerCapture = (id: number) => {
					const captures = internal.capturedMap.get(id);
					if (captures) {
						releaseInternalPointerCapture(internal.capturedMap, hit.eventObject, captures, id);
					}
				};

				// Add native event props
				const extractEventProps: any = {};
				// This iterates over the event's properties including the inherited ones. Native PointerEvents have most of their props as getters which are inherited, but polyfilled PointerEvents have them all as their own properties (i.e. not inherited). We can't use Object.keys() or Object.entries() as they only return "own" properties; nor Object.getPrototypeOf(event) as that *doesn't* return "own" properties, only inherited ones.
				for (const prop in event) {
					const property = event[prop as keyof NgtDomEvent];
					// Only copy over atomics, leave functions alone as these should be
					// called as event.nativeEvent.fn()
					if (typeof property !== 'function') extractEventProps[prop] = property;
				}

				const raycastEvent: NgtThreeEvent<NgtDomEvent> = {
					...hit,
					...extractEventProps,
					pointer,
					intersections,
					stopped: localState.stopped,
					delta,
					unprojectedPoint,
					ray: raycaster.ray,
					camera,
					// Hijack stopPropagation, which just sets a flag
					stopPropagation() {
						// https://github.com/pmndrs/react-three-fiber/issues/596
						// Events are not allowed to stop propagation if the pointer has been captured
						const capturesForPointer = 'pointerId' in event && internal.capturedMap.get(event.pointerId);

						// We only authorize stopPropagation...
						if (
							// ...if this pointer hasn't been captured
							!capturesForPointer ||
							// ... or if the hit object is capturing the pointer
							capturesForPointer.has(hit.eventObject)
						) {
							raycastEvent.stopped = localState.stopped = true;
							// Propagation is stopped, remove all other hover records
							// An event handler is only allowed to flush other handlers if it is hovered itself
							if (
								internal.hovered.size &&
								Array.from(internal.hovered.values()).find((i) => i.eventObject === hit.eventObject)
							) {
								// Objects cannot flush out higher up objects that have already caught the event
								const higher = intersections.slice(0, intersections.indexOf(hit));
								cancelPointer([...higher, hit]);
							}
						}
					},
					// there should be a distinction between target and currentTarget
					target: { hasPointerCapture, setPointerCapture, releasePointerCapture },
					currentTarget: { hasPointerCapture, setPointerCapture, releasePointerCapture },
					nativeEvent: event,
				};

				// Call subscribers
				callback(raycastEvent);
				// Event bubbling may be interrupted by stopPropagation
				if (localState.stopped) break;
			}
		}
		return intersections;
	}

	function cancelPointer(intersections: NgtIntersection[]) {
		const internal = store.snapshot.internal;
		for (const hoveredObj of internal.hovered.values()) {
			// When no objects were hit or the the hovered object wasn't found underneath the cursor
			// we call onPointerOut and delete the object from the hovered-elements map
			if (
				!intersections.length ||
				!intersections.find(
					(hit) =>
						hit.object === hoveredObj.object &&
						hit.index === hoveredObj.index &&
						hit.instanceId === hoveredObj.instanceId,
				)
			) {
				const eventObject = hoveredObj.eventObject;
				const instance = getInstanceState(eventObject);
				const handlers = instance?.handlers;
				internal.hovered.delete(makeId(hoveredObj));
				if (instance?.eventCount) {
					// Clear out intersects, they are outdated by now
					const data = { ...hoveredObj, intersections };
					handlers?.pointerout?.(data as NgtThreeEvent<PointerEvent>);
					handlers?.pointerleave?.(data as NgtThreeEvent<PointerEvent>);
				}
			}
		}
	}

	function pointerMissed(event: MouseEvent, objects: THREE.Object3D[]) {
		for (let i = 0; i < objects.length; i++) {
			const instance = getInstanceState(objects[i]);
			instance?.handlers.pointermissed?.(event);
		}
	}

	function handlePointer(name: string) {
		// Handle common cancelation events
		if (name === 'pointerleave' || name === 'pointercancel') {
			return () => cancelPointer([]);
		}

		if (name === 'lostpointercapture') {
			return (event: NgtDomEvent) => {
				const { internal } = store.snapshot;
				if ('pointerId' in event && internal.capturedMap.has(event.pointerId)) {
					// If the object event interface had lostpointercapture, we'd call it here on every
					// object that's getting removed. We call it on the next frame because lostpointercapture
					// fires before pointerup. Otherwise pointerUp would never be called if the event didn't
					// happen in the object it originated from, leaving components in a in-between state.
					requestAnimationFrame(() => {
						// Only release if pointer-up didn't do it already
						if (internal.capturedMap.has(event.pointerId)) {
							internal.capturedMap.delete(event.pointerId);
							cancelPointer([]);
						}
					});
				}
			};
		}

		// Cache these values since they're used in the closure
		const isPointerMove = name === 'pointermove';
		const isClickEvent = name === 'click' || name === 'contextmenu' || name === 'dblclick';
		const filter = isPointerMove ? filterPointerEvents : undefined;

		// Any other pointer goes here ...
		return function handleEvent(event: NgtDomEvent) {
			// NOTE: __pointerMissed$ on NgtStore is private subject since we only expose the Observable
			const pointerMissed$: Subject<MouseEvent> = (store as NgtAnyRecord)['__pointerMissed$'];
			const internal = store.snapshot.internal;

			// Cache the event
			internal.lastEvent.nativeElement = event;

			// Get fresh intersects
			const hits = intersect(event, filter);
			// Only calculate distance for click events to avoid unnecessary math
			const delta = isClickEvent ? calculateDistance(event) : 0;
			let missedNotified = false;
			const notifyMissedOnce = () => {
				if (missedNotified || !isClickEvent) return;
				missedNotified = true;
				const missedObjects = internal.interaction.filter((object) => !internal.initialHits.includes(object));
				if (missedObjects.length > 0) pointerMissed(event, missedObjects);
			};

			// Save initial coordinates on pointer-down
			if (name === 'pointerdown') {
				internal.initialClick = [event.offsetX, event.offsetY];
				internal.initialHits = hits.map((hit) => hit.eventObject);
			}

			// Handle click miss events - early return optimization for better performance
			if (isClickEvent && hits.length === 0 && delta <= 2) {
				pointerMissed(event, internal.interaction);
				pointerMissed$.next(event);
				return; // Early return if nothing was hit
			}

			// Take care of unhover for pointer moves
			if (isPointerMove) cancelPointer(hits);

			// Define onIntersect handler - locally cache common properties for better performance
			function onIntersect(data: NgtThreeEvent<NgtDomEvent>) {
				const eventObject = data.eventObject;
				const instance = getInstanceState(eventObject);

				// Early return if no instance or event count
				if (!instance?.eventCount) return;

				const handlers = instance.handlers;
				if (!handlers) return;

				if (isPointerMove) {
					// Handle pointer move events
					const hasPointerOverHandlers = !!(
						handlers.pointerover ||
						handlers.pointerenter ||
						handlers.pointerout ||
						handlers.pointerleave
					);

					if (hasPointerOverHandlers) {
						const id = makeId(data);
						const hoveredItem = internal.hovered.get(id);
						if (!hoveredItem) {
							// If the object wasn't previously hovered, book it and call its handler
							internal.hovered.set(id, data);
							if (handlers.pointerover) handlers.pointerover(data as NgtThreeEvent<PointerEvent>);
							if (handlers.pointerenter) handlers.pointerenter(data as NgtThreeEvent<PointerEvent>);
						} else if (hoveredItem.stopped) {
							// If the object was previously hovered and stopped, we shouldn't allow other items to proceed
							data.stopPropagation();
						}
					}

					// Call mouse move
					if (handlers.pointermove) handlers.pointermove(data as NgtThreeEvent<PointerEvent>);
				} else {
					// All other events ...
					const handler = handlers[name as keyof NgtEventHandlers] as (
						event: NgtThreeEvent<PointerEvent>,
					) => void;

					if (handler) {
						// Forward all events back to their respective handlers with the exception of click events,
						// which must use the initial target
						if (!isClickEvent || internal.initialHits.includes(eventObject)) {
							notifyMissedOnce();
							// Now call the handler
							handler(data as NgtThreeEvent<PointerEvent>);
						}
					} else if (isClickEvent && internal.initialHits.includes(eventObject)) {
						notifyMissedOnce();
					}
				}
			}

			// Process all intersections
			if (hits.length > 0) {
				handleIntersects(hits, event, delta, onIntersect);
			}
		};
	}

	return { handlePointer };
}
