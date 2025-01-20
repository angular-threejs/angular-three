import { untracked } from '@angular/core';
import * as THREE from 'three';
import { removeInteractivity } from '../events';
import { getInstanceState, invalidateInstance } from '../instance';
import { NgtInstanceNode } from '../types';
import { attach, detach } from '../utils/attach';
import { is } from '../utils/is';
import { NgtRendererNode } from './state';

// @internal
export const enum NgtRendererClassId {
	type,
	destroyed,
	rawValue,
	portalContainer,
	injector,
	parent,
	children,
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

export function attachThreeNodes(parent: NgtInstanceNode, child: NgtInstanceNode) {
	const pIS = getInstanceState(parent);
	const cIS = getInstanceState(child);

	if (!pIS || !cIS) {
		throw new Error(`[NGT] THREE instances need to be prepared with local state.`);
	}

	// whether the child is added to the parent with parent.add()
	let added = false;

	// assign store on child if not already exist
	// or child store is not the same as parent store
	// or child store is the parent of parent store
	if (!cIS.store || cIS.store !== pIS.store || cIS.store === pIS.store.snapshot.previousRoot) {
		cIS.store = pIS.store;

		cIS.addInteraction?.(cIS.store);

		const grandChildren = [
			...(cIS.objects ? untracked(cIS.objects) : []),
			...(cIS.nonObjects ? untracked(cIS.nonObjects) : []),
		];
		for (const grandChild of grandChildren) {
			const grandChildIS = getInstanceState(grandChild);
			if (!grandChildIS) continue;
			grandChildIS.store = cIS.store;
			grandChildIS.addInteraction?.(cIS.store);
		}
	}

	if (cIS.attach) {
		const attachProp = cIS.attach;

		if (typeof attachProp === 'function') {
			let attachCleanUp: ReturnType<typeof attachProp> | undefined = undefined;

			if (cIS.type === 'ngt-value') {
				if (cIS.hierarchyStore.snapshot.parent !== parent) {
					cIS.setParent(parent);
				}
				// at this point we don't have rawValue yet, so we bail and wait until the Renderer recalls attach
				if ((child as unknown as NgtRendererNode).__ngt_renderer__[NgtRendererClassId.rawValue] === undefined) return;
				attachCleanUp = attachProp(
					parent,
					(child as unknown as NgtRendererNode).__ngt_renderer__[NgtRendererClassId.rawValue],
					cIS.store!,
				);
			} else {
				attachCleanUp = attachProp(parent, child, cIS.store!);
			}

			if (attachCleanUp) cIS.previousAttach = attachCleanUp;
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
				is.three<THREE.Material>(child, 'isMaterial') &&
				!Array.isArray(parent['material'])
			) {
				parent['material'] = [];
			}

			// attach
			// save prev value
			cIS.previousAttach = attachProp.reduce((value, key) => value[key], parent);

			if (cIS.type === 'ngt-value') {
				if (cIS.hierarchyStore.snapshot.parent !== parent) {
					cIS.setParent(parent);
				}
				// at this point we don't have rawValue yet, so we bail and wait until the Renderer recalls attach
				if ((child as unknown as NgtRendererNode).__ngt_renderer__[NgtRendererClassId.rawValue] === undefined) return;
				attach(
					parent,
					(child as unknown as NgtRendererNode).__ngt_renderer__[NgtRendererClassId.rawValue],
					attachProp,
					true,
				);
			} else {
				attach(parent, child, attachProp);
			}
		}
	} else if (is.three<THREE.Object3D>(parent, 'isObject3D') && is.three<THREE.Object3D>(child, 'isObject3D')) {
		parent.add(child);
		added = true;
		cIS.addInteraction?.(cIS.store || pIS.store);
	}

	if (pIS.add) {
		pIS.add(child, added ? 'objects' : 'nonObjects');
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

export function removeThreeChild(child: NgtInstanceNode, parent: NgtInstanceNode, dispose?: boolean) {
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
	const isPrimitive = cIS?.type && cIS.type !== 'ngt-primitive';
	if (!isPrimitive && child['dispose'] && !is.three<THREE.Scene>(child, 'isScene')) {
		queueMicrotask(() => child['dispose']());
	}

	invalidateInstance(parent);
}
