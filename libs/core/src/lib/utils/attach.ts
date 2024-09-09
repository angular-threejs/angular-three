import { getLocalState } from '../instance';
import { NgtAnyRecord, NgtAttachFunction, NgtState } from '../types';
import { applyProps, NGT_APPLY_PROPS } from './apply-props';
import { NgtSignalStore } from './signal-store';

export function attach(object: NgtAnyRecord, value: unknown, paths: string[] = [], useApplyProps = false): void {
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

export function detach(parent: NgtAnyRecord, child: NgtAnyRecord, attachProp: string[] | NgtAttachFunction) {
	const childLocalState = getLocalState(child);
	if (childLocalState) {
		if (Array.isArray(attachProp)) attach(parent, childLocalState.previousAttach, attachProp, childLocalState.isRaw);
		else (childLocalState.previousAttach as () => void)();
	}
}

function assignEmpty(obj: NgtAnyRecord, base: string, shouldAssignStoreForApplyProps = false) {
	if ((!Object.hasOwn(obj, base) && Reflect && !!Reflect.has && !Reflect.has(obj, base)) || obj[base] === undefined) {
		obj[base] = {};
	}

	if (shouldAssignStoreForApplyProps) {
		const localState = getLocalState(obj[base]);
		// if we already have local state, bail out
		if (localState) return;

		const parentLocalState = getLocalState(obj);
		// if parent doesn't have local state, bail out
		if (!parentLocalState) return;

		Object.assign(obj[base], { [NGT_APPLY_PROPS]: parentLocalState.store });
	}
}

export function createAttachFunction<TChild = any, TParent = any>(
	cb: (params: { parent: TParent; child: TChild; store: NgtSignalStore<NgtState> }) => (() => void) | void,
): NgtAttachFunction<TChild, TParent> {
	return (parent, child, store) => cb({ parent, child, store });
}
