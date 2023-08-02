import { ChangeDetectorRef, EventEmitter, NgZone, untracked } from '@angular/core';
import { removeInteractivity } from '../events';
import { getLocalState, invalidateInstance, type NgtInstanceNode } from '../instance';
import { attach, detach } from '../utils/attach';
import { is } from '../utils/is';
import { safeDetectChanges } from '../utils/safe-detect-changes';
import { SPECIAL_EVENTS } from './constants';

// @internal
export const enum NgtRendererClassId {
	type,
	parent,
	injectedParent,
	children,
	destroyed,
	compound,
	compoundParent,
	compounded,
	queueOps,
	attributes,
	properties,
	rawValue,
	ref,
	portalContainer,
	injectorFactory,
}

// @internal
export const enum NgtCompoundClassId {
	applyFirst,
	props,
}

// @internal
export const enum NgtQueueOpClassId {
	type,
	op,
	done,
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
	// or child store is the parent of parent store
	if (!cLS.store || cLS.store === pLS.store.get('previousRoot')) {
		cLS.store = pLS.store;
	}

	if (cLS.attach) {
		const attachProp = cLS.attach;

		if (typeof attachProp === 'function') {
			const attachCleanUp = attachProp(parent, child, cLS.store);
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
				if (cLS.parent) {
					untracked(() => {
						cLS.parent.set(parent);
					});
				}
				// at this point we don't have rawValue yet, so we bail and wait until the Renderer recalls attach
				if (child.__ngt_renderer__[NgtRendererClassId.rawValue] === undefined) return;
				attach(parent, child.__ngt_renderer__[NgtRendererClassId.rawValue], attachProp);
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

	if (cLS.parent) {
		untracked(() => {
			cLS.parent.set(parent);
		});
	}

	if (cLS.afterAttach) cLS.afterAttach.emit({ parent, node: child });

	invalidateInstance(child);
	invalidateInstance(parent);
}

export function removeThreeChild(parent: NgtInstanceNode, child: NgtInstanceNode, dispose?: boolean) {
	const pLS = getLocalState(parent);
	const cLS = getLocalState(child);

	// clear parent ref
	untracked(() => {
		cLS.parent?.set(null);
	});

	// remove child from parent
	if (untracked(pLS.objects)) pLS.remove(child, 'objects');
	if (untracked(pLS.nonObjects)) pLS.remove(child, 'nonObjects');

	if (cLS.attach) {
		detach(parent, child, cLS.attach);
	} else if (is.object3D(parent) && is.object3D(child)) {
		parent.remove(child);
		removeInteractivity(cLS.store || pLS.store, child);
	}

	const isPrimitive = cLS.primitive;
	if (!isPrimitive) {
		removeThreeRecursive(cLS.objects ? untracked(cLS.objects) : [], child, !!dispose);
		removeThreeRecursive(child.children, child, !!dispose);
	}

	// dispose
	if (!isPrimitive && child['dispose'] && !is.scene(child)) {
		queueMicrotask(() => child['dispose']());
	}

	invalidateInstance(parent);
}

function removeThreeRecursive(array: NgtInstanceNode[], parent: NgtInstanceNode, dispose: boolean) {
	if (array) [...array].forEach((child) => removeThreeChild(parent, child, dispose));
}

export function kebabToPascal(str: string): string {
	// split the string at each hyphen
	const parts = str.split('-');

	// map over the parts, capitalizing the first letter of each part
	const pascalParts = parts.map((part) => part.charAt(0).toUpperCase() + part.slice(1));

	// join the parts together to create the final PascalCase string
	return pascalParts.join('');
}

export function processThreeEvent(
	instance: NgtInstanceNode,
	priority: number,
	eventName: string,
	callback: (event: any) => void,
	zone: NgZone,
	rootCdr: ChangeDetectorRef,
	targetCdr?: ChangeDetectorRef | null,
): () => void {
	const lS = getLocalState(instance);
	if (eventName === SPECIAL_EVENTS.BEFORE_RENDER) {
		return lS.store
			.get('internal')
			.subscribe((state) => callback({ state, object: instance }), priority || lS.priority || 0);
	}

	if (eventName === SPECIAL_EVENTS.AFTER_UPDATE || eventName === SPECIAL_EVENTS.AFTER_ATTACH) {
		let emitter = lS[eventName];
		if (!emitter) emitter = lS[eventName] = new EventEmitter();
		const sub = emitter.subscribe(callback);
		return sub.unsubscribe.bind(sub);
	}

	if (!lS.handlers) lS.handlers = {};

	// try to get the previous handler. compound might have one, the THREE object might also have one with the same name
	const previousHandler = lS.handlers[eventName as keyof typeof lS.handlers];
	// readjust the callback
	const updatedCallback: typeof callback = (event) => {
		if (previousHandler) previousHandler(event);
		zone.run(() => {
			callback(event);
			safeDetectChanges(targetCdr, rootCdr);
		});
	};

	Object.assign(lS.handlers, { [eventName]: updatedCallback });

	// increment the count everytime
	lS.eventCount += 1;
	// but only add the instance (target) to the interaction array (so that it is handled by the EventManager with Raycast)
	// the first time eventCount is incremented
	if (lS.eventCount === 1 && instance['raycast']) lS.store.get('internal', 'interaction').push(instance);

	// clean up the event listener by removing the target from the interaction array
	return () => {
		const localState = getLocalState(instance);
		if (localState && localState.eventCount) {
			localState.eventCount -= 1;
			const index = localState.store
				.get('internal', 'interaction')
				.findIndex((obj) => obj.uuid === instance.uuid);
			if (index >= 0) localState.store.get('internal', 'interaction').splice(index, 1);
		}
	};
}
