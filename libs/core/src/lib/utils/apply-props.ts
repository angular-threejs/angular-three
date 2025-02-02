import * as THREE from 'three';
import { getInstanceState, invalidateInstance } from '../instance';
import type { NgtAnyRecord, NgtInstanceNode, NgtInstanceState, NgtState } from '../types';
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

// NOTE: this is a workaround to give the instance a chance to have the store from the parent.
//  we clear this property after the applyProps is done
export const NGT_APPLY_PROPS = '__ngt_apply_props__';

// https://github.com/mrdoob/three.js/pull/27042
// https://github.com/mrdoob/three.js/pull/22748
const colorMaps = ['map', 'emissiveMap', 'sheenColorMap', 'specularColorMap', 'envMap'];

type ClassConstructor = { new (): void };

const MEMOIZED_PROTOTYPES = new Map();

function getMemoizedPrototype(root: any) {
	let ctor = MEMOIZED_PROTOTYPES.get(root.constructor);
	try {
		if (!ctor) {
			ctor = new root.constructor();
			MEMOIZED_PROTOTYPES.set(root.constructor, ctor);
		}
	} catch (e) {
		// ...
	}
	return ctor;
}

// This function applies a set of changes to the instance
export function applyProps<T extends NgtAnyRecord>(instance: NgtInstanceState<T>['object'], props: NgtAnyRecord) {
	// if props is empty
	if (!Object.keys(props).length) return instance;

	const localState = getInstanceState(instance);
	const rootState =
		localState?.store?.snapshot ?? (instance as NgtAnyRecord)[NGT_APPLY_PROPS]?.snapshot ?? ({} as NgtState);
	const changes = diffProps(instance, props);

	for (let i = 0; i < changes.length; i++) {
		let [key, value] = changes[i];

		// Ignore setting undefined props
		// https://github.com/pmndrs/react-three-fiber/issues/274
		if (value === undefined) continue;

		// Alias (output)encoding => (output)colorSpace (since r152)
		// https://github.com/pmndrs/react-three-fiber/pull/2829
		// if (is.colorSpaceExist(instance)) {
		// 	const sRGBEncoding = 3001;
		// 	const SRGBColorSpace = 'srgb';
		// 	const LinearSRGBColorSpace = 'srgb-linear';
		//
		// 	if (key === 'encoding') {
		// 		key = 'colorSpace';
		// 		value = value === sRGBEncoding ? SRGBColorSpace : LinearSRGBColorSpace;
		// 	} else if (key === 'outputEncoding') {
		// 		key = 'outputColorSpace';
		// 		value = value === sRGBEncoding ? SRGBColorSpace : LinearSRGBColorSpace;
		// 	}
		// }

		const currentInstance = instance;
		const targetProp = (currentInstance as NgtAnyRecord)[key];

		// Copy if properties match signatures
		if (
			targetProp?.copy &&
			(value as ClassConstructor | undefined)?.constructor &&
			(targetProp as ClassConstructor).constructor === (value as ClassConstructor).constructor
		) {
			// If both are geometries, we should assign the value directly instead of copying
			if (
				is.three<THREE.BufferGeometry>(targetProp, 'isBufferGeometry') &&
				is.three<THREE.BufferGeometry>(value, 'isBufferGeometry')
			) {
				Object.assign(currentInstance, { [key]: value });
			} else {
				// fetch the default state of the target
				const ctor = getMemoizedPrototype(currentInstance);
				// The target key was originally null or undefined, which indicates that the object which
				// is now present was externally set by the user, we should therefore assign the value directly
				if (ctor !== undefined && ctor[key] == null) Object.assign(currentInstance, { [key]: value });
				// Otherwise copy is correct
				else targetProp.copy(value);
			}
		}
		// Layers have no copy function, we must therefore copy the mask property
		else if (targetProp instanceof THREE.Layers && value instanceof THREE.Layers) {
			targetProp.mask = value.mask;
		}
		// Set array types
		else if (targetProp?.set && Array.isArray(value)) {
			if (targetProp.fromArray) targetProp.fromArray(value);
			else targetProp.set(...value);
		}
		// Set literal types
		else if (targetProp?.set && typeof value !== 'object') {
			const isColor = (targetProp as THREE.Color | undefined)?.isColor;
			// Allow setting array scalars
			if (!isColor && targetProp.setScalar && typeof value === 'number') targetProp.setScalar(value);
			// Otherwise just set single value
			else targetProp.set(value);
		}
		// Else, just overwrite the value
		else {
			Object.assign(currentInstance, { [key]: value });

			// Auto-convert sRGB texture parameters for built-in materials
			// https://github.com/pmndrs/react-three-fiber/issues/344
			// https://github.com/mrdoob/three.js/pull/25857
			if (
				rootState &&
				!rootState.linear &&
				colorMaps.includes(key) &&
				(currentInstance[key] as THREE.Texture | undefined)?.isTexture &&
				// sRGB textures must be RGBA8 since r137 https://github.com/mrdoob/three.js/pull/23129
				currentInstance[key].format === THREE.RGBAFormat &&
				currentInstance[key].type === THREE.UnsignedByteType
			) {
				// NOTE: this cannot be set from the renderer (e.g. sRGB source textures rendered to P3)
				currentInstance[key].colorSpace = THREE.SRGBColorSpace;
			}
		}

		checkUpdate(currentInstance[key]);
		checkUpdate(targetProp);
		invalidateInstance(instance as NgtInstanceNode<T>);
	}

	const instanceHandlersCount = localState?.eventCount;
	const parent = localState?.hierarchyStore?.snapshot.parent;

	if (parent && rootState.internal && instance['raycast'] && instanceHandlersCount !== localState?.eventCount) {
		// Pre-emptively remove the instance from the interaction manager
		const index = rootState.internal.interaction.indexOf(instance);
		if (index > -1) rootState.internal.interaction.splice(index, 1);
		// Add the instance to the interaction manager only when it has handlers
		if (localState?.eventCount) rootState.internal.interaction.push(instance);
	}

	if (parent && localState?.onUpdate && changes.length) {
		localState.onUpdate(instance as NgtInstanceNode<T>);
	}

	// clearing the intermediate store from the instance
	if (instance[NGT_APPLY_PROPS]) {
		delete instance[NGT_APPLY_PROPS];
	}

	return instance;
}
