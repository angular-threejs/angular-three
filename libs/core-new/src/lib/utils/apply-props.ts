import { untracked } from '@angular/core';
import { Color, ColorManagement, Layers, Object3D, RGBAFormat, Texture, UnsignedByteType } from 'three';
import { getLocalState, getRootStore, invalidateInstance } from '../instance';
import { NgtState } from '../store';
import { NgtAnyRecord } from '../types';
import { is } from './is';
import { checkUpdate } from './update';

// This function prepares a set of changes to be applied to the instance
function diffProps(instance: NgtAnyRecord, props: NgtAnyRecord) {
	const propsEntries = Object.entries(props);
	const changes: [key: string, value: unknown][] = [];

	for (const [propKey, propValue] of propsEntries) {
		let key = propKey;
		if (is.colorSpaceExist(instance)) {
			if (propKey === 'encoding') {
				key = 'colorSpace';
			} else if (propKey === 'outputEncoding') {
				key = 'outputColorSpace';
			}
		}
		if (is.equ(propValue, instance[key])) continue;
		changes.push([propKey, propValue]);
	}

	return changes;
}

export function applyProps(obj: NgtAnyRecord, props: NgtAnyRecord) {
	// if props is empty
	if (!Object.keys(props).length) return obj;

	// filter equals, and reserved props
	const localState = getLocalState(obj);
	const rootState = localState?.store?.snapshot ?? ({} as NgtState);
	const changes = diffProps(obj, props);

	for (let i = 0; i < changes.length; i++) {
		let [key, value] = changes[i];

		// Alias (output)encoding => (output)colorSpace (since r152)
		// https://github.com/pmndrs/react-three-fiber/pull/2829
		if (is.colorSpaceExist(obj)) {
			const sRGBEncoding = 3001;
			const SRGBColorSpace = 'srgb';
			const LinearSRGBColorSpace = 'srgb-linear';

			if (key === 'encoding') {
				key = 'colorSpace';
				value = value === sRGBEncoding ? SRGBColorSpace : LinearSRGBColorSpace;
			} else if (key === 'outputEncoding') {
				key = 'outputColorSpace';
				value = value === sRGBEncoding ? SRGBColorSpace : LinearSRGBColorSpace;
			}
		}

		const current = obj;
		const targetProp = current[key];

		// special treatmen for objects with support for set/copy, and layers
		if (targetProp && targetProp['set'] && (targetProp['copy'] || targetProp instanceof Layers)) {
			const isColor = targetProp instanceof Color;

			// if value is an array
			if (Array.isArray(value)) {
				if (targetProp['fromArray']) targetProp['fromArray'](value);
				else targetProp['set'](...value);
			} // test again target.copy
			else if (
				targetProp['copy'] &&
				value &&
				value.constructor &&
				targetProp.constructor.name === value.constructor.name
			) {
				targetProp['copy'](value);
				if (!ColorManagement && !rootState.linear && isColor) targetProp['convertSRGBToLinear']();
			} // if nothing else fits, just set the single value, ignore undefined
			else if (value !== undefined) {
				// allow setting array scalars
				if (!isColor && targetProp['setScalar']) targetProp['setScalar'](value);
				// layers have no copy function, copy the mask
				else if (targetProp instanceof Layers && value instanceof Layers) targetProp.mask = value.mask;
				// otherwise just set ...
				else targetProp['set'](value);

				// auto-convert srgb
				if (!ColorManagement && !rootState?.linear && isColor) targetProp.convertSRGBToLinear();
			}
		} else {
			current[key] = value;
			// auto-convert srgb textures
			if (
				current[key] instanceof Texture &&
				current[key].format === RGBAFormat &&
				current[key].type === UnsignedByteType &&
				rootState
			) {
				const texture = current[key] as Texture;
				if (is.colorSpaceExist(texture) && is.colorSpaceExist(rootState.gl))
					texture.colorSpace = rootState.gl.outputColorSpace;
				// @ts-expect-error - old version of threejs
				else texture.encoding = rootState.gl.outputEncoding;
			}
		}

		checkUpdate(current[key]);
		checkUpdate(targetProp);
	}

	invalidateInstance(obj);

	const handlersCount = localState?.eventCount;
	const parent = localState?.parent ? untracked(localState.parent) : null;

	if (localState && parent && obj['raycast']) {
		// Get the initial root state's internals
		const initialRootStore = getRootStore(obj);
		const internal = initialRootStore?.snapshot.internal;
		if (!internal) return;
		// Pre-emptively remove the instance from the interaction manager
		const index = internal.interaction.indexOf(obj as Object3D);
		if (index > -1) internal.interaction.splice(index, 1);
		// Add the instance to the interaction manager only when it has handlers
		if (handlersCount) internal.interaction.push(obj as Object3D);
	}

	if (localState && localState.onUpdate && changes.length) {
		// (updated) event should add `onUpdate` to the instance
		localState.onUpdate(obj);
	}

	return obj;
}
