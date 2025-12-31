import * as THREE from 'three';
import { getInstanceState, invalidateInstance } from '../instance';
import type { NgtAnyRecord, NgtInstanceNode, NgtInstanceState, NgtState } from '../types';
import { is } from './is';
import { checkUpdate } from './update';

/**
 * Prepares a set of changes to be applied to the instance by comparing props.
 *
 * @param instance - The Three.js instance to compare against
 * @param props - The props to diff
 * @returns An array of [key, value] tuples representing changed properties
 */
function diffProps(instance: NgtAnyRecord, props: NgtAnyRecord) {
	const changes: [key: string, value: unknown][] = [];

	for (const propKey in props) {
		const propValue = props[propKey];
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

/**
 * Internal symbol used to temporarily store the parent's store on an instance.
 * This is a workaround to give the instance access to the store from its parent
 * during property application. The property is cleared after applyProps completes.
 * @internal
 */
export const NGT_APPLY_PROPS = '__ngt_apply_props__';

// https://github.com/mrdoob/three.js/pull/27042
// https://github.com/mrdoob/three.js/pull/22748
const colorMaps = ['map', 'emissiveMap', 'sheenColorMap', 'specularColorMap', 'envMap'];

type ClassConstructor = { new (): void };

/**
 * Resolves a property key that may contain dot notation (pierced props).
 *
 * This function handles nested property access like 'position.x' by traversing
 * the object hierarchy and returning the final target object and key.
 *
 * @param instance - The root instance to start from
 * @param key - The property key, potentially with dot notation
 * @returns An object containing the root object, target key, and target property value
 *
 * @example
 * ```typescript
 * const mesh = new THREE.Mesh();
 * const result = resolveInstanceKey(mesh, 'position.x');
 * // result.root = mesh.position
 * // result.targetKey = 'x'
 * // result.targetProp = mesh.position.x
 * ```
 */
export function resolveInstanceKey(instance: any, key: string): { root: any; targetKey: string; targetProp: any } {
	let targetProp = instance[key];
	if (!key.includes('.')) return { root: instance, targetKey: key, targetProp };

	// Resolve pierced target
	targetProp = instance;
	for (const part of key.split('.')) {
		key = part;
		instance = targetProp;
		targetProp = targetProp[key];
	}
	// const chain = key.split('.');
	// targetProp = chain.reduce((acc, part) => acc[part], instance);
	// const targetKey = chain.pop()!;
	//
	// // Switch root if atomic
	// if (!targetProp?.set) instance = chain.reduce((acc, part) => acc[part], instance);

	return { root: instance, targetKey: key, targetProp };
}

/**
 * Applies a set of properties to a Three.js instance.
 *
 * This is the core function for updating Three.js objects with new property values.
 * It handles various property types including:
 * - Math types (Vector3, Color, Euler, etc.) with automatic conversion
 * - Pierced props (dot notation like 'position.x')
 * - Arrays (converted to set/fromArray calls)
 * - Layers (mask copying)
 * - Textures (automatic color space management)
 *
 * After applying props, the function triggers necessary updates like
 * camera projection matrix updates and texture needsUpdate flags.
 *
 * @typeParam T - The type of the Three.js instance
 * @param instance - The Three.js instance to update
 * @param props - An object containing the properties to apply
 * @returns The updated instance
 *
 * @example
 * ```typescript
 * const mesh = new THREE.Mesh();
 * applyProps(mesh, {
 *   position: [1, 2, 3],
 *   'rotation.x': Math.PI / 2,
 *   visible: true
 * });
 * ```
 */
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

		const { root, targetKey, targetProp } = resolveInstanceKey(instance, key);

		// we have switched due to pierced props
		if (root !== instance) {
			return applyProps(root, { [targetKey]: value });
		}

		// Layers have no copy function, we must therefore copy the mask property
		if (targetProp instanceof THREE.Layers && value instanceof THREE.Layers) {
			targetProp.mask = value.mask;
		} else if (is.three<THREE.Color>(targetProp, 'isColor') && is.colorRepresentation(value)) {
			targetProp.set(value);
		}
		// Copy if properties match signatures
		else if (
			targetProp &&
			typeof targetProp.set === 'function' &&
			typeof targetProp.copy === 'function' &&
			(value as ClassConstructor | undefined)?.constructor &&
			(targetProp as ClassConstructor).constructor === (value as ClassConstructor).constructor
		) {
			// If both are geometries, we should assign the value directly instead of copying
			if (
				is.three<THREE.BufferGeometry>(targetProp, 'isBufferGeometry') &&
				is.three<THREE.BufferGeometry>(value, 'isBufferGeometry')
			) {
				Object.assign(root, { [targetKey]: value });
			} else {
				targetProp.copy(value);
			}
		}
		// Set array types
		else if (targetProp && typeof targetProp.set === 'function' && Array.isArray(value)) {
			if (typeof targetProp.fromArray === 'function') targetProp.fromArray(value);
			else targetProp.set(...value);
		}
		// Set literal types
		else if (targetProp && typeof targetProp.set === 'function' && typeof value !== 'object') {
			const isColor = is.three<THREE.Color>(targetProp, 'isColor');
			// Allow setting array scalars
			if (!isColor && typeof targetProp.setScalar === 'function' && typeof value === 'number')
				targetProp.setScalar(value);
			// Otherwise just set single value
			else targetProp.set(value);
		}
		// Else, just overwrite the value
		else {
			Object.assign(root, { [targetKey]: value });

			// Auto-convert sRGB texture parameters for built-in materials
			// https://github.com/pmndrs/react-three-fiber/issues/344
			// https://github.com/mrdoob/three.js/pull/25857
			if (
				rootState &&
				!rootState.linear &&
				colorMaps.includes(targetKey) &&
				(root[targetKey] as THREE.Texture | undefined)?.isTexture &&
				// sRGB textures must be RGBA8 since r137 https://github.com/mrdoob/three.js/pull/23129
				root[targetKey].format === THREE.RGBAFormat &&
				root[targetKey].type === THREE.UnsignedByteType
			) {
				// NOTE: this cannot be set from the renderer (e.g. sRGB source textures rendered to P3)
				root[targetKey].colorSpace = THREE.SRGBColorSpace;
			}
		}

		checkUpdate(root[targetKey]);
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
	if (instance[NGT_APPLY_PROPS]) delete instance[NGT_APPLY_PROPS];

	return instance;
}
