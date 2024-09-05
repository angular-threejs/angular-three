import { untracked } from '@angular/core';
import { EventDispatcher, Object3D } from 'three';
import { removeInteractivity } from '../events';
import { getLocalState, invalidateInstance } from '../instance';
import { NgtInstanceNode } from '../types';
import { attach, detach } from '../utils/attach';
import { is } from '../utils/is';
import { SPECIAL_EVENTS, THREE_NATIVE_EVENTS } from './constants';

// @internal
export const enum NgtRendererClassId {
	type,
	parent,
	children,
	destroyed,
	rawValue,
	portalContainer,
	debugNode,
	debugNodeFactory,
}

export function kebabToPascal(str: string): string {
	if (!str) return str; // Handle empty input

	let pascalStr = '';
	let capitalizeNext = true; // Flag to track capitalization

	for (let i = 0; i < str.length; i++) {
		const char = str[i];
		if (char === '-') {
			capitalizeNext = true;
			continue;
		}

		pascalStr += capitalizeNext ? char.toUpperCase() : char;
		capitalizeNext = false;
	}

	return pascalStr;
}

export function attachThreeChild(parent: NgtInstanceNode, child: NgtInstanceNode) {
	const pLS = getLocalState(parent);
	const cLS = getLocalState(child);

	if (!pLS || !cLS) {
		throw new Error(`[NGT] THREE instances need to be prepared with local state.`);
	}

	// whether the child is added to the parent with parent.add()
	let added = false;

	// assign store on child if not already exist
	// or child store is not the same as parent store
	// or child store is the parent of parent store
	if (!cLS.store || cLS.store !== pLS.store || cLS.store === pLS.store.get('previousRoot')) {
		cLS.store = pLS.store;
		const grandchildren = [
			...(cLS.objects ? untracked(cLS.objects) : []),
			...(cLS.nonObjects ? untracked(cLS.nonObjects) : []),
		];
		for (const grandchild of grandchildren) {
			const grandChildLS = getLocalState(grandchild);
			if (!grandChildLS) continue;
			grandChildLS.store = cLS.store;
		}
	}

	if (cLS.attach) {
		const attachProp = cLS.attach;

		if (typeof attachProp === 'function') {
			let attachCleanUp: ReturnType<typeof attachProp> | undefined = undefined;

			if (cLS.isRaw) {
				if (cLS.instanceStore.get('parent') !== parent) {
					cLS.setParent(parent);
				}
				// at this point we don't have rawValue yet, so we bail and wait until the Renderer recalls attach
				if (child.__ngt_renderer__[NgtRendererClassId.rawValue] === undefined) return;
				attachCleanUp = attachProp(parent, child.__ngt_renderer__[NgtRendererClassId.rawValue], cLS.store);
			} else {
				attachCleanUp = attachProp(parent, child, cLS.store);
			}

			if (attachCleanUp) cLS.previousAttach = attachCleanUp;
		} else {
			// we skip attach none if set explicitly
			if (attachProp[0] === 'none') {
				invalidateInstance(child);
				return;
			}

			// handle material array
			if (
				attachProp[0] === 'material' &&
				attachProp[1] &&
				typeof Number(attachProp[1]) === 'number' &&
				is.material(child) &&
				!Array.isArray(parent['material'])
			) {
				parent['material'] = [];
			}

			// attach
			if (cLS.isRaw) {
				if (cLS.instanceStore.get('parent') !== parent) {
					cLS.setParent(parent);
				}
				// at this point we don't have rawValue yet, so we bail and wait until the Renderer recalls attach
				if (child.__ngt_renderer__[NgtRendererClassId.rawValue] === undefined) return;
				attach(parent, child.__ngt_renderer__[NgtRendererClassId.rawValue], attachProp, true);
			} else {
				attach(parent, child, attachProp);
			}
			// save value
			cLS.previousAttach = attachProp.reduce((value, property) => value[property], parent);
		}
	} else if (is.object3D(parent) && is.object3D(child)) {
		parent.add(child);
		added = true;
	}

	pLS.add(child, added ? 'objects' : 'nonObjects');

	if (cLS.parent && untracked(cLS.parent) !== parent) {
		cLS.setParent(parent);
	}

	// NOTE: this does not mean that the child is actually attached to the parent on the scenegraph.
	//  a child on the Angular template can also emit onAttach
	if (cLS.onAttach) cLS.onAttach({ parent, node: child });

	invalidateInstance(child);
	invalidateInstance(parent);
}

export function removeThreeChild(child: NgtInstanceNode, parent?: NgtInstanceNode, dispose?: boolean) {
	const pLS = getLocalState(parent);
	const cLS = getLocalState(child);

	// clear parent ref
	cLS?.setParent(null);

	// remove child from parent
	pLS?.remove(child, 'objects');
	pLS?.remove(child, 'nonObjects');

	if (parent) {
		if (cLS?.attach) {
			detach(parent, child, cLS.attach);
		} else if (is.object3D(parent) && is.object3D(child)) {
			parent.remove(child);
			const store = cLS?.store || pLS?.store;
			if (store) removeInteractivity(store, child);
		}
	}

	const isPrimitive = cLS?.primitive;
	if (!isPrimitive) {
		removeThreeRecursive(cLS?.instanceStore.get('objects') || [], child, !!dispose);
		removeThreeRecursive(child.children, child, !!dispose);
	}

	// dispose
	if (!isPrimitive && child['dispose'] && !is.scene(child)) {
		queueMicrotask(() => child['dispose']());
	}

	if (parent) {
		invalidateInstance(parent);
	}
}

function removeThreeRecursive(array: NgtInstanceNode[], parent: NgtInstanceNode, dispose: boolean) {
	if (array) [...array].forEach((child) => removeThreeChild(child, parent, dispose));
}

export function processThreeEvent(
	instance: NgtInstanceNode,
	priority: number,
	eventName: string,
	callback: (event: any) => void,
): () => void {
	const lS = getLocalState(instance);
	if (!lS) {
		console.warn('[NGT] instance has not been prepared yet.');
		return () => {};
	}

	if (eventName === SPECIAL_EVENTS.BEFORE_RENDER) {
		return lS.store
			.get('internal')
			.subscribe((state) => callback({ state, object: instance }), priority || lS.priority || 0);
	}

	if (eventName === SPECIAL_EVENTS.ATTACHED) {
		lS.onAttach = callback;
		if (untracked(lS.parent)) {
			lS.onAttach({ parent: untracked(lS.parent), node: instance });
		}

		return () => {
			lS.onAttach = undefined;
		};
	}

	if (eventName === SPECIAL_EVENTS.UPDATED) {
		lS.onUpdate = callback;
		return () => {
			lS.onUpdate = undefined;
		};
	}

	if (THREE_NATIVE_EVENTS.includes(eventName) && instance instanceof EventDispatcher) {
		// NOTE: rename to dispose because that's the event type, not disposed.
		if (eventName === 'disposed') {
			eventName = 'dispose';
		}

		if ((instance as Object3D).parent && (eventName === 'added' || eventName === 'removed')) {
			callback({ type: eventName, target: instance });
		}

		instance.addEventListener(eventName, callback);
		return () => instance.removeEventListener(eventName, callback);
	}

	if (!lS.handlers) lS.handlers = {};

	// try to get the previous handler. compound might have one, the THREE object might also have one with the same name
	const previousHandler = lS.handlers[eventName as keyof typeof lS.handlers];
	// readjust the callback
	const updatedCallback: typeof callback = (event) => {
		if (previousHandler) previousHandler(event);
		callback(event);
	};

	Object.assign(lS.handlers, { [eventName]: updatedCallback });

	// increment the count everytime
	lS.eventCount += 1;
	// but only add the instance (target) to the interaction array (so that it is handled by the EventManager with Raycast)
	// the first time eventCount is incremented
	if (lS.eventCount === 1 && instance['raycast']) {
		let root = lS.store;
		while (root.get('previousRoot')) {
			root = root.get('previousRoot')!;
		}

		const interactions = root.get('internal', 'interaction') || [];
		interactions.push(instance);
	}

	// clean up the event listener by removing the target from the interaction array
	return () => {
		const lS = getLocalState(instance);
		if (lS) {
			lS.eventCount -= 1;
			const interactions = lS.store.get('internal', 'interaction') || [];
			const index = interactions.findIndex((obj) => obj.uuid === instance.uuid);
			if (index >= 0) interactions.splice(index, 1);
		}
	};
}
