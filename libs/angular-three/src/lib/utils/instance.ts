import { BehaviorSubject } from 'rxjs';
import type { NgtAnyRecord, NgtInstanceLocalState, NgtInstanceNode } from '../types';
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
    object: TInstance | (() => TInstance),
    localState?: Partial<NgtInstanceLocalState>
): NgtInstanceNode<TInstance> {
    const instance = (typeof object === 'function' ? object() : object) as unknown as NgtInstanceNode<TInstance>;

    if (localState?.primitive || !instance.__ngt__) {
        const {
            objects = new BehaviorSubject<NgtInstanceNode[]>([]),
            nonObjects = new BehaviorSubject<NgtInstanceNode[]>([]),
            ...rest
        } = localState || {};

        instance.__ngt__ = {
            previousAttach: null,
            store: null,
            parent: null,
            memoized: {},
            eventCount: 0,
            handlers: {},
            objects,
            nonObjects,
            add: (object, type) => {
                const current = instance.__ngt__[type].value;
                const foundIndex = current.indexOf((obj: NgtInstanceNode) => obj === object);
                if (foundIndex > -1) {
                    current.splice(foundIndex, 1, object);
                    instance.__ngt__[type].next(current);
                } else {
                    instance.__ngt__[type].next([...instance.__ngt__[type].value, object]);
                }
                notifyAncestors(instance.__ngt__.parent);
            },
            remove: (object, type) => {
                instance.__ngt__[type].next(instance.__ngt__[type].value.filter((o) => o !== object));
                notifyAncestors(instance.__ngt__.parent);
            },
            ...rest,
        } as NgtInstanceLocalState;
    }

    return instance;
}

function notifyAncestors(instance: NgtInstanceNode | null) {
    if (!instance) return;
    const localState = getLocalState(instance);
    if (localState.objects) localState.objects.next(localState.objects.value);
    if (localState.nonObjects) localState.nonObjects.next(localState.nonObjects.value);
    notifyAncestors(localState.parent);
}
