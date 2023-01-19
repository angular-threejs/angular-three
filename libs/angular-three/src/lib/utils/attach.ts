import { NgtAnyRecord, NgtAttachFunction } from '../types';
import { applyProps } from './apply-props';
import { getLocalState } from './instance';

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
    if (Array.isArray(attachProp)) {
        attach(parent, childLocalState.previousAttach, attachProp);
    } else {
        (childLocalState.previousAttach as Function)();
    }
}

function assignEmpty(obj: NgtAnyRecord, base: string) {
    if ((!Object.hasOwn(obj, base) && Reflect && !!Reflect.has && !Reflect.has(obj, base)) || obj[base] === undefined) {
        obj[base] = {};
    }
}
