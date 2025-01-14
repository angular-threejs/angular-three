import { getInstanceState } from '../instance';
import type { NgtAttachFunction, NgtInstanceNode, NgtState } from '../types';
import { applyProps, NGT_APPLY_PROPS } from './apply-props';
import { SignalState } from './signal-state';

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

export function createAttachFunction<TChild = any, TParent = any>(
	cb: (params: { parent: TParent; child: TChild; store: SignalState<NgtState> }) => (() => void) | void,
): NgtAttachFunction<TChild, TParent> {
	return (parent, child, store) => cb({ parent, child, store });
}
