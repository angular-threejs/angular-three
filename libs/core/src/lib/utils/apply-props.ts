import { Color, ColorManagement, Layers, RGBAFormat, Texture, UnsignedByteType } from 'three';
import { getLocalState, invalidateInstance } from '../instance';
import { NgtAnyRecord, NgtInstanceNode, NgtState } from '../types';
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

// NOTE: this is a workaround to give the instance a change to have the store from the parent.
//  we clear this property after the applyProps is done
export const NGT_APPLY_PROPS = '__ngt_apply_props__';

// This function applies a set of changes to the instance
export function applyProps(instance: NgtInstanceNode, props: NgtAnyRecord) {
	// if props is empty
	if (!Object.keys(props).length) return instance;

	// filter equals, and reserved props
	const localState = getLocalState(instance);
	const rootState = localState?.store?.snapshot ?? instance[NGT_APPLY_PROPS]?.snapshot ?? ({} as NgtState);
	const changes = diffProps(instance, props);

	for (let i = 0; i < changes.length; i++) {
		let [key, value] = changes[i];

		// Alias (output)encoding => (output)colorSpace (since r152)
		// https://github.com/pmndrs/react-three-fiber/pull/2829
		if (is.colorSpaceExist(instance)) {
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

		const currentInstance = instance;
		const targetProp = currentInstance[key];

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
				const isColor = targetProp instanceof Color;
				// allow setting array scalars
				if (!isColor && targetProp['setScalar']) targetProp['setScalar'](value);
				// layers have no copy function, copy the mask
				else if (targetProp instanceof Layers && value instanceof Layers) targetProp.mask = value.mask;
				// otherwise just set ...
				else targetProp['set'](value);

				// auto-convert srgb
				if (!ColorManagement && !rootState?.linear && isColor) targetProp.convertSRGBToLinear();
			}
		} // else just overwrite the value
		else {
			currentInstance[key] = value;
			// auto-convert srgb textures
			if (
				currentInstance[key] instanceof Texture &&
				currentInstance[key].format === RGBAFormat &&
				currentInstance[key].type === UnsignedByteType
			) {
				const texture = currentInstance[key] as Texture;
				if (rootState?.gl) {
					if (is.colorSpaceExist(texture) && is.colorSpaceExist(rootState.gl))
						texture.colorSpace = rootState.gl.outputColorSpace;
					// @ts-expect-error - old version of threejs
					else texture.encoding = rootState.gl.outputEncoding;
				}
			}
		}

		checkUpdate(currentInstance[key]);
		checkUpdate(targetProp);
		invalidateInstance(instance);
	}

	const instanceHandlersCount = localState?.eventCount;
	const parent = localState?.instanceStore?.get('parent');

	if (parent && rootState.internal && instance['raycast'] && instanceHandlersCount !== localState?.eventCount) {
		// Pre-emptively remove the instance from the interaction manager
		const index = rootState.internal.interaction.indexOf(instance);
		if (index > -1) rootState.internal.interaction.splice(index, 1);
		// Add the instance to the interaction manager only when it has handlers
		if (localState?.eventCount) rootState.internal.interaction.push(instance);
	}

	if (parent && localState?.onUpdate && changes.length) {
		localState.onUpdate(instance);
	}

	// clearing the intermediate store from the instance
	if (instance[NGT_APPLY_PROPS]) {
		delete instance[NGT_APPLY_PROPS];
	}

	return instance;
}
