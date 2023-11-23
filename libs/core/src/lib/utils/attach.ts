import { getLocalState, type NgtAttachFunction } from '../instance';
import type { NgtState } from '../store';
import type { NgtAnyRecord } from '../types';
import { applyProps } from './apply-props';
import type { NgtSignalStore } from './signal-store';

export function attach(object: NgtAnyRecord, value: unknown, paths: string[] = []): void {
	const [base, ...remaining] = paths;
	if (!base) return;

	if (remaining.length === 0) {
		applyProps(object, { [base]: value });
	} else {
		assignEmpty(object, base);
		attach(object[base], value, remaining);
	}
}

export function detach(parent: NgtAnyRecord, child: NgtAnyRecord, attachProp: string[] | NgtAttachFunction) {
	const childLocalState = getLocalState(child);
	if (childLocalState) {
		if (Array.isArray(attachProp)) attach(parent, childLocalState.previousAttach, attachProp);
		else (childLocalState.previousAttach as Function)();
	}
}

function assignEmpty(obj: NgtAnyRecord, base: string) {
	if ((!Object.hasOwn(obj, base) && Reflect && !!Reflect.has && !Reflect.has(obj, base)) || obj[base] === undefined) {
		obj[base] = {};
	}
}

export function createAttachFunction<TChild = any, TParent = any>(
	cb: (params: { parent: TParent; child: TChild; store: NgtSignalStore<NgtState> }) => (() => void) | void,
): NgtAttachFunction<TChild, TParent> {
	return (parent, child, store) => cb({ parent, child, store });
}
