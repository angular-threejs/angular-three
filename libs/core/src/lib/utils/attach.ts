import { getInstanceState } from '../instance';
import type { NgtAttachFunction, NgtInstanceNode, NgtState } from '../types';
import { applyProps, NGT_APPLY_PROPS } from './apply-props';
import { SignalState } from './signal-state';

/**
 * Attaches a value to an object at the specified path.
 *
 * This function recursively traverses the path and sets the value at the final key.
 * It's used internally to implement the `attach` property on Three.js elements.
 *
 * @param object - The target object to attach to
 * @param value - The value to attach
 * @param paths - An array of path segments (e.g., ['material', 'map'])
 * @param useApplyProps - Whether to use applyProps for setting the value
 *
 * @example
 * ```typescript
 * const mesh = new THREE.Mesh();
 * attach(mesh, texture, ['material', 'map']);
 * // mesh.material.map = texture
 * ```
 */
export function attach(object: NgtInstanceNode, value: unknown, paths: string[] = [], useApplyProps = false): void {
	const [base, ...remaining] = paths;
	if (!base) return;

	if (remaining.length === 0) {
		if (useApplyProps) applyProps(object, { [base]: value });
		else object[base] = value;
	} else {
		assignEmpty(object, base, useApplyProps);
		attach(object[base], value, remaining, useApplyProps);
	}
}

/**
 * Detaches a child from its parent, restoring the previous value.
 *
 * This function reverses the attach operation by restoring the previous value
 * that was stored when the child was attached.
 *
 * @param parent - The parent object
 * @param child - The child object to detach
 * @param attachProp - The attach path or function that was used
 */
export function detach(parent: NgtInstanceNode, child: NgtInstanceNode, attachProp: string[] | NgtAttachFunction) {
	const childInstanceState = getInstanceState(child);
	if (childInstanceState) {
		if (Array.isArray(attachProp))
			attach(parent, childInstanceState.previousAttach, attachProp, childInstanceState.type === 'ngt-value');
		else (childInstanceState.previousAttach as () => void)?.();
	}
}

function assignEmpty(obj: NgtInstanceNode, base: string, shouldAssignStoreForApplyProps = false) {
	if ((!Object.hasOwn(obj, base) && Reflect && !!Reflect.has && !Reflect.has(obj, base)) || obj[base] === undefined) {
		obj[base] = {};
	}

	if (shouldAssignStoreForApplyProps) {
		const instanceState = getInstanceState(obj[base]);
		// if we already have instance state, bail out
		if (instanceState) return;

		const parentInstanceState = getInstanceState(obj);
		// if parent doesn't have instance state, bail out
		if (!parentInstanceState) return;

		Object.assign(obj[base], { [NGT_APPLY_PROPS]: parentInstanceState.store });
	}
}

/**
 * Creates a custom attach function for advanced attachment scenarios.
 *
 * Use this when you need custom logic for attaching a child to a parent,
 * such as when the relationship isn't a simple property assignment.
 *
 * @typeParam TChild - The type of the child object
 * @typeParam TParent - The type of the parent object
 * @param cb - Callback that performs the attachment and optionally returns a cleanup function
 * @returns An attach function compatible with the `attach` property
 *
 * @example
 * ```typescript
 * const customAttach = createAttachFunction<THREE.Mesh, THREE.Group>(
 *   ({ parent, child, store }) => {
 *     parent.add(child);
 *     return () => parent.remove(child);
 *   }
 * );
 * ```
 */
export function createAttachFunction<TChild = any, TParent = any>(
	cb: (params: { parent: TParent; child: TChild; store: SignalState<NgtState> }) => (() => void) | void,
): NgtAttachFunction<TChild, TParent> {
	return (parent, child, store) => cb({ parent, child, store });
}
