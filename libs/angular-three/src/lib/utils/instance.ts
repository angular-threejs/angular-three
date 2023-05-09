import { untracked } from '@angular/core';
import type { NgtAnyRecord, NgtInstanceLocalState, NgtInstanceNode } from '../types';
import { createSignal } from './signal';
import { checkUpdate } from './update';

export function getLocalState<TInstance extends object = NgtAnyRecord>(
    obj: TInstance | undefined
): NgtInstanceLocalState {
    if (!obj) return {} as unknown as NgtInstanceLocalState;
    return (obj as NgtAnyRecord)['__ngt__'] || ({} as NgtInstanceLocalState);
}

export function invalidateInstance<TInstance extends object>(instance: TInstance) {
    const state = getLocalState(instance).store?.get();
    if (state && state.internal.frames === 0) state.invalidate();
    checkUpdate(instance);
}

export function prepare<TInstance extends object = NgtAnyRecord>(
    object: TInstance,
    localState?: Partial<NgtInstanceLocalState>
): NgtInstanceNode<TInstance> {
    const instance = object as unknown as NgtInstanceNode<TInstance>;

    if (localState?.primitive || !instance.__ngt__) {
        const {
            objects = createSignal<NgtInstanceNode[]>([]),
            nonObjects = createSignal<NgtInstanceNode[]>([]),
            ...rest
        } = localState || {};

        instance.__ngt__ = {
            previousAttach: null,
            store: null,
            parent: createSignal(null),
            memoized: {},
            eventCount: 0,
            handlers: {},
            objects,
            nonObjects,
            add: (object, type) => {
                const current = untracked(instance.__ngt__[type]);
                const foundIndex = current.indexOf((obj: NgtInstanceNode) => obj === object);
                if (foundIndex > -1) {
                    // if we add an object with the same reference, then we switch it out
                    // and update the BehaviorSubject
                    current.splice(foundIndex, 1, object);
                    instance.__ngt__[type].set(current);
                } else {
                    instance.__ngt__[type].update((prev) => [...prev, object]);
                }
                notifyAncestors(untracked(instance.__ngt__.parent));
            },
            remove: (object, type) => {
                instance.__ngt__[type].update((prev) => prev.filter((o) => o !== object));
                notifyAncestors(untracked(instance.__ngt__.parent));
            },
            ...rest,
        } as NgtInstanceLocalState;
    }

    return instance;
}

function notifyAncestors(instance: NgtInstanceNode | null) {
    if (!instance) return;
    const localState = getLocalState(instance);
    if (localState.objects) localState.objects.update((prev) => prev);
    if (localState.nonObjects) localState.nonObjects.update((prev) => prev);
    notifyAncestors(untracked(localState.parent));
}
