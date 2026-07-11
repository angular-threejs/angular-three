import { untracked } from '@angular/core';
import * as THREE from 'three';
import { removeInteractivity } from '../events';
import { getInstanceState, invalidateInstance } from '../instance';
import { NgtAnyRecord, NgtInstanceNode, NgtState } from '../types';
import { attach, detach } from '../utils/attach';
import { is } from '../utils/is';
import type { SignalState } from '../utils/signal-state';
import { NGT_DOM_PARENT_FLAG, NGT_GET_NODE_ATTRIBUTE_FLAG } from './constants';
import { NgtRendererClassId, NgtRendererNode } from './state';

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

function propagateStoreRecursively(
	node: NgtInstanceNode,
	parentNode: NgtInstanceNode,
	storeOverride?: SignalState<NgtState>,
) {
	const iS = getInstanceState(node);
	const pIS = getInstanceState(parentNode);

	if (!iS || !pIS) return;
	const store = storeOverride ?? pIS.store;
	if (!store) return;

	// assign store on child if not already exist
	// or child store is not the same as parent store
	// or child store is the parent of parent store
	if (!iS.store || iS.store !== store || iS.store === store.snapshot.previousRoot) {
		iS.store = store;

		// Call addInteraction if it exists
		iS.addInteraction?.(store);

		// Collect all children (objects and nonObjects)
		const children = [
			...(iS.objects ? untracked(iS.objects) : []),
			...(iS.nonObjects ? untracked(iS.nonObjects) : []),
		];

		// Recursively reassign the store for each child
		for (const child of children) {
			propagateStoreRecursively(child, node, store);
		}
	}
}

function placeObject3DChild(parent: THREE.Object3D, child: THREE.Object3D, before?: NgtInstanceNode | null) {
	if (child.parent !== parent) parent.add(child);

	const currentIndex = parent.children.indexOf(child);
	if (currentIndex < 0) return;

	parent.children.splice(currentIndex, 1);
	const beforeIndex = before ? parent.children.indexOf(before as unknown as THREE.Object3D) : -1;
	const insertionIndex = beforeIndex < 0 ? parent.children.length : Math.min(beforeIndex, parent.children.length);
	parent.children.splice(insertionIndex, 0, child);
}

export function attachThreeNodes(
	parent: NgtInstanceNode,
	child: NgtInstanceNode,
	before?: NgtInstanceNode | null,
	storeOverride?: SignalState<NgtState>,
) {
	const pIS = getInstanceState(parent);
	const cIS = getInstanceState(child);

	if (!pIS || !cIS) {
		throw new Error(`[NGT] THREE instances need to be prepared with local state.`);
	}
	propagateStoreRecursively(child, parent, storeOverride);

	if (untracked(cIS.parent) === parent) {
		if (
			!cIS.attach &&
			is.three<THREE.Object3D>(parent, 'isObject3D') &&
			is.three<THREE.Object3D>(child, 'isObject3D')
		) {
			placeObject3DChild(parent, child, before);
			pIS.add?.(child, 'objects', before);
		} else {
			// Attached resources have no physical sibling order. A logical move must
			// not invoke their attach callback or overwrite their restoration value.
			pIS.add?.(child, 'nonObjects', before);
		}
		invalidateInstance(parent);
		return;
	}

	// whether the child is added to the parent with parent.add()
	let added = false;

	if (cIS.attach) {
		const attachProp = cIS.attach;

		if (typeof attachProp === 'function') {
			let attachCleanUp: ReturnType<typeof attachProp> | undefined = undefined;

			if (cIS.type === 'ngt-value') {
				// at this point we don't have rawValue yet, so we bail and wait until the Renderer recalls attach
				if ((child as unknown as NgtRendererNode).__ngt_renderer__[NgtRendererClassId.rawValue] === undefined)
					return;
				if (cIS.hierarchyStore.snapshot.parent !== parent) {
					cIS.setParent(parent);
				}
				attachCleanUp = attachProp(
					parent,
					(child as unknown as NgtRendererNode).__ngt_renderer__[NgtRendererClassId.rawValue],
					cIS.store!,
				);
			} else {
				attachCleanUp = attachProp(parent, child, cIS.store!);
			}

			cIS.previousAttach = attachCleanUp;
		} else {
			// we skip attach none if set explicitly
			if (attachProp[0] === 'none') {
				cIS.previousAttach = undefined;
				pIS.add?.(child, 'nonObjects', before);
				cIS.setParent(parent);
				invalidateInstance(child);
				invalidateInstance(parent);
				return;
			}

			// handle material array
			if (
				attachProp[0] === 'material' &&
				attachProp[1] !== undefined &&
				!Number.isNaN(Number(attachProp[1])) &&
				is.three<THREE.Material>(child, 'isMaterial') &&
				!Array.isArray(parent['material'])
			) {
				parent['material'] = [];
			}

			if (cIS.type === 'ngt-value') {
				// at this point we don't have rawValue yet, so we bail and wait until the Renderer recalls attach
				if ((child as unknown as NgtRendererNode).__ngt_renderer__[NgtRendererClassId.rawValue] === undefined)
					return;
				if (cIS.hierarchyStore.snapshot.parent !== parent) {
					cIS.setParent(parent);
				}

				// save prev value
				cIS.previousAttach = attachProp.reduce((value, key) => value[key], parent);
				attach(
					parent,
					(child as unknown as NgtRendererNode).__ngt_renderer__[NgtRendererClassId.rawValue],
					attachProp,
					true,
				);
			} else {
				// save prev value
				cIS.previousAttach = attachProp.reduce((value, key) => value[key], parent);
				attach(parent, child, attachProp);
			}
		}
	} else if (is.three<THREE.Object3D>(parent, 'isObject3D') && is.three<THREE.Object3D>(child, 'isObject3D')) {
		placeObject3DChild(parent, child, before);
		added = true;
		cIS.addInteraction?.(cIS.store || pIS.store);
	}

	if (pIS.add) {
		pIS.add(child, added ? 'objects' : 'nonObjects', before);
	}

	if (cIS.parent && untracked(cIS.parent) !== parent) {
		cIS.setParent(parent);
	}

	// NOTE: this does not mean that the child is actually attached to the parent on the scenegraph.
	//  a child on the Angular template can also emit onAttach
	if (cIS.onAttach) cIS.onAttach({ parent, node: child });

	invalidateInstance(child);
	invalidateInstance(parent);
}

export function removeThreeChild(child: NgtInstanceNode, parent: NgtInstanceNode, dispose = false) {
	const pIS = getInstanceState(parent);
	const cIS = getInstanceState(child);

	// clear parent ref
	cIS?.setParent(null);

	// remove child from parent
	pIS?.remove?.(child, 'objects');
	pIS?.remove?.(child, 'nonObjects');

	if (cIS?.attach) {
		detach(parent, child, cIS.attach);
	} else if (is.three<THREE.Object3D>(parent, 'isObject3D') && is.three<THREE.Object3D>(child, 'isObject3D')) {
		parent.remove(child);
		const store = cIS?.store || pIS?.store;
		cIS?.removeInteraction?.(store);
		if (store) removeInteractivity(store, child);
	}

	// dispose
	const isPrimitive = cIS?.type && cIS.type === 'ngt-primitive';
	if (dispose && !isPrimitive && child['dispose'] && !is.three<THREE.Scene>(child, 'isScene')) {
		const disposeInstance = child['dispose'].bind(child);
		queueMicrotask(disposeInstance);
	}

	invalidateInstance(parent);
}

export function internalDestroyNode(
	node: NgtRendererNode,
	removeChild: null | ((node: NgtRendererNode, child: NgtRendererNode) => void),
) {
	const rS = node.__ngt_renderer__;
	if (!rS || rS[NgtRendererClassId.destroyed]) return;
	const iS = getInstanceState(node);
	const physicalParent = iS?.parent ? untracked(iS.parent) : null;
	if (physicalParent) {
		removeThreeChild(node as unknown as NgtInstanceNode, physicalParent, false);
	}

	for (const child of rS[NgtRendererClassId.children].slice()) {
		const destructionOwner = rS[NgtRendererClassId.ownedNodes] ? node : rS[NgtRendererClassId.owner];
		const childOwner = child.__ngt_renderer__[NgtRendererClassId.owner];
		removeChild?.(node, child);
		if (destructionOwner && childOwner && childOwner !== destructionOwner) continue;
		internalDestroyNode(child, removeChild);
	}

	// clear out parent if haven't
	rS[NgtRendererClassId.parent] = undefined;
	// clear out children
	rS[NgtRendererClassId.children].length = 0;

	// clear out NgtInstanceState
	if (iS) {
		const temp = iS as NgtAnyRecord;
		const isPrimitive = iS.type === 'ngt-primitive';
		if (!isPrimitive && node['dispose'] && !is.three<THREE.Scene>(node, 'isScene')) {
			const disposeInstance = node['dispose'].bind(node);
			queueMicrotask(disposeInstance);
		}

		iS.removeInteraction?.(iS.store);

		delete temp['onAttach'];
		delete temp['onUpdate'];
		delete temp['object'];
		delete temp['objects'];
		delete temp['nonObjects'];
		delete temp['parent'];
		delete temp['add'];
		delete temp['remove'];
		delete temp['updateGeometryStamp'];
		delete temp['setParent'];
		delete temp['store'];
		delete temp['handlers'];
		delete temp['hierarchyStore'];
		delete temp['previousAttach'];
		delete temp['setPointerEvent'];
		delete temp['addInteraction'];
		delete temp['removeInteraction'];

		if (iS.type !== 'ngt-primitive') {
			delete node['__ngt__'];
		}
	}

	// clear renderer metadata
	rS[NgtRendererClassId.parentOverride] = undefined;
	rS[NgtRendererClassId.anchor] = undefined;
	rS[NgtRendererClassId.owner] = undefined;
	rS[NgtRendererClassId.ownedNodes]?.clear();

	if (rS[NgtRendererClassId.type] === 'comment') {
		delete node[NGT_DOM_PARENT_FLAG];
	}

	// clear getAttribute if exist
	if (
		'getAttribute' in node &&
		typeof node['getAttribute'] === 'function' &&
		node['getAttribute'][NGT_GET_NODE_ATTRIBUTE_FLAG]
	) {
		delete node['getAttribute'];
	}

	// mark node as destroyed
	rS[NgtRendererClassId.destroyed] = true;
}
